var Transport = require('./Transport.js');
var ObjectPool = require('./ObjectPool.js');
var DataType = require('./DataType');

const TRANSPORT_ACTION = Transport.ACTION;
const EMPTY_OBJECT = {};

// =================================================================================================
// Model Definition
// =================================================================================================
module.exports = Model;

/**
 * Model definition
 * @class Model
 *
 * @param {Object} def Definition object
 * @param {Object} [params]
 * @param {Function} [params.onInstanceInit] ModelInstance initialization hook.
 * @param {TransportInterface} [params.transport] Custom transport for this model
 * @param {ObjectPool} [params.objectPool] Custom object pool implementation to use.
 *
 * @param {Function} [params.onInstanceInit] Called when instance first initialized.
 * @param {Function} [params.onInstanceRevert] Called when instance changes are reset.
 *
 *
 *  @example
 *  var Jedi = new Model({
 *      name : DataType.String,
 *      age : DataType.Number,
 *      describePerson : DataType.Computed(function () {
 *          return (this.age > 50) ? 'master ' + this.name : 'youngling ' + this.name;
 *      })
 *  }, {
 *      transport : MyCustomTransportImplementation
 *  });
 *
 *  var ben = Jedi.create({ age : 80, name : Obi-Wan Kenobi })
 *  ben.describePerson(); // 'master Obi-Wan Kenobi'
 *
 * @constructor
 */
function Model (def, params) {

    params = params || {};

    this.definition = def;

    this.definitionKeys = Object.keys(def);

    this.setTransport(params.transport || Transport.TransportInterface);
    this.setObjectPool(params.objectPool || ObjectPool);

    this.actions = {
        onInstanceInit : params.onInstanceInit || function () {},
        onInstanceRevert : params.onInstanceRevert || function () {}
    };

    this.objectPool.reset();
}

/**
 * @param transport
 */
Model.prototype.setTransport = function (transport) {
    this.transport = transport;
};

/**
 * @param pool
 */
Model.prototype.setObjectPool = function (pool) {
    var self = this;
    this.objectPool = pool.extend({
        generator : function () {
            return new ModelInstance(self);
        }
    });
    this.objectPool.reset();
};

/**
 * Sends find request to model transport.
 * @param key
 * @param {Object} [meta] Meta data stuff that is passed on to a transport.
 * @returns {ModelInstance|null}
 */
Model.prototype.find = function (key, meta) {
    var model = this;
    var instance = model.objectPool.acquire();
    return this.transport.read(key, meta || null, model, instance).then(function (data) {
        if ( data ) {
            instance.init(TRANSPORT_ACTION.DO_NOTHING, data, false);
            return instance;
        }
        else {
            instance.release();
            return null;
        }
    })
};

/**
 * Creates new instance of the model (instance data does not exist in persistent storage).
 * @param {Object} [data]
 * @returns {ModelInstance}
 */
Model.prototype.create = function (data) {
    var instance = this.objectPool.acquire();
    instance.init(TRANSPORT_ACTION.CREATE, data || EMPTY_OBJECT, true);
    return instance;
};

/**
 * Creates an existing instance of the model.
 * Use this method to create a data instance that does not need to be created in persistent storage.
 * @param {Object} [data]
 * @returns {ModelInstance}
 */
Model.prototype.instantiate = function (data) {
    var instance = this.objectPool.acquire();
    instance.init(TRANSPORT_ACTION.DO_NOTHING, data || EMPTY_OBJECT, true);
    return instance;
};

// =================================================================================================
// Model Wrapper
// =================================================================================================

/**
 * An instance of the object described my the Model definition.
 * @class ModelInstance
 * @param {Model} model A reference to a Model definition instance.
 * @constructor
 */
function ModelInstance (model) {

    this._model = model;
    this._data = {};
    this._state = {
        onSave : '',
        dirty : {}
    };

    var i, key, prop;
    for(i = 0; i < model.definitionKeys.length; i++) {
        key = model.definitionKeys[i];
        prop = model.definition[key];

        if (typeof prop === 'function') {
            model.definition[key] = DataType.Computed.extend({callback : prop});
        }

        model.definition[key].initializeProperty(this, key);
    }
}

/** @protected */
ModelInstance.prototype.init = function (action, data, setDirtyToValue) {

    this._state.onSave = action;
    this.setAll(data, setDirtyToValue);
    this._model.actions.onInstanceInit(this);
};

/** @private */
ModelInstance.prototype.setAll = function (data, setDirtyToValue) {

    var dataType, value, key, keys = this._model.definitionKeys;
    for(var i = 0, len = keys.length; i < len; i++) {
        key = keys[i];
        dataType = this._model.definition[key];
        value = data[key] === undefined && dataType.virtual ? this[key] : data[key];

        if (dataType.deserialized && value !== undefined) {
            value = dataType.deserialized(value);
        }

        dataType.assignValue(this, key, value, setDirtyToValue);
    }
};

/** @private */
ModelInstance.prototype.resetAll = function () {

    var dataType, k, keys = this._model.definitionKeys;
    for(var i = 0, len = keys.length; i < len; i++) {
        k = keys[i];
        dataType = this._model.definition[k];
        dataType.resetValue(this, k);
    }
};

ModelInstance.prototype.isDirty = function (propertyName) {

    var def = this._model.definition[propertyName];
    if (!def) throw new UndefinedProperty(propertyName);
    else if (def.virtual) throw new NotAllowed(name);

    var dirty = this._state.dirty[propertyName];
    var value = this._data[propertyName];

    return dirty !== undefined ? !def.isEqual(value, dirty) : false;
};

/**
 * @param {String[]} [filter] Array of key names to serialize
 * @return {Object} Returns object literal containing all non-virtual properties of this model.
 */
ModelInstance.prototype.serialized = function (filter) {

    var result = {};
    var dataType, k, keys = filter ? filter : this._model.definitionKeys;
    for(var i = 0, len = keys.length; i < len; i++) {
        k = keys[i];
        dataType = this._model.definition[k];
        if (dataType && !dataType.virtual) {
            result[k] = dataType.serialized ? dataType.serialized(this[k]) : this[k];
        }
    }
    return result;
};

/**
 * @param {Boolean} [dirty] Optional flag to return only dirty keys.
 * @param {Object} [type] Optional type filer
 * @return {String[]|null} Returns an array of non-virtual properties of the underlying model.
 */
ModelInstance.prototype.keys = function (dirty, type) {

    var result = null;
    var dataType, k, keys = this._model.definitionKeys;

    for(var i = 0, len = keys.length; i < len; i++) {
        k = keys[i];
        dataType = this._model.definition[k];
        if (!dataType.virtual && (!type || type && type.testType(dataType)) && (!dirty || this.isDirty(k))) {
            if (!result) result = [];
            result.push(k);
        }
    }
    return result;
};

/**
 * Marks the object for deletion on commit.
 */
ModelInstance.prototype.destroy = function () {
    this._state.onSave = TRANSPORT_ACTION.DESTROY;
};

/**
 * Marks the object for to be updated on commit (this is hack-y).
 *
 * When DataType.Array or DataType.Json are used, modifying the contents of those will not trigger
 * Transport.update routine unless this function is called.
 */
ModelInstance.prototype.update = function () {
    this._state.onSave = TRANSPORT_ACTION.UPDATE;
};

/**
 * Send object to transport.
 * @param {Object} [meta] Array of anything that transport might find useful to know.
 * @returns {Promise<ModelInstance>}
 */
ModelInstance.prototype.commit = function (meta) {
    var self = this;
    return this._model.transport[this._state.onSave](this, meta || null).then(function (data) {

        var dataType, key, val, old, keys = self._model.definitionKeys;

        for(var i = 0, len = keys.length; i < len; i++) {
            key = keys[i];
            dataType = self._model.definition[key];

            if (!dataType.virtual) {

                if (data && data[key]) {
                    val = dataType.deserialized ? dataType.deserialized(data[key]) : data[key];
                }
                else {
                    val = self._state.dirty[key];
                }

                dataType.copyAssignValue(self, key, val);
            }
        }

        self._state.onSave = TRANSPORT_ACTION.DO_NOTHING;
        return self;
    });
};

/**
 * Undo all the changes made since the last call to ModelInstance.commit.
 */
ModelInstance.prototype.revert = function () {

    var dataType, value, key, keys = this._model.definitionKeys;
    for(var i = 0, len = keys.length; i < len; i++) {
        key = keys[i];
        dataType = this._model.definition[key];

        if (dataType.virtual) value = this[key];
        else value = this._data[key];

        this._state.dirty[key] = (value === undefined) ?
            dataType.defaultValue() : dataType.valueCopy(value);
    }
    this._model.actions.onInstanceRevert(this);
};

/**
 * Stores an object in the object pool for future reference. Don't call this method if you
 * want GC to take over.
 */
ModelInstance.prototype.release = function () {
    this.resetAll();
    this._model.objectPool.store(this);
};

/** @returns {exports.TransportInterface|*} */
ModelInstance.prototype.getTransport = function () {
    return this._model.transport;
};

/* *************************************************************************************************
    Misc
***************************************************************************************************/

function UndefinedProperty(name) {
    this.name = 'does_not_exist';
    this.message = 'Property with the name "' + name + '" does not exist on Model.'
}
UndefinedProperty.prototype = Object.create(Error.prototype);

function NotAllowed(name) {
    this.name = 'illegal_operation';
    this.message = 'Operation not permitted on virtual property "' + name + '".'
}
NotAllowed.prototype = Object.create(Error.prototype);