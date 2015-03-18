
var Transport = require('./Transport.js');
var ObjectPool = require('./ObjectPool.js');

const TRANSPORT_ACTION = Transport.ACTION;

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
        onInstanceInit : params.onInstanceInit || function () {}
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
    })
};

/**
 * Sends find request to model transport.
 * @param key
 * @param {Array} meta Array of meta data stuff that are passed on to transport.
 * @returns {ModelInstance|null}
 */
Model.prototype.find = function (key, meta) {
    var model = this;
    return this.transport.read(key, meta || null, this).then(function (data) {
        if ( data !== null && data !== undefined ) {
            var instance = model.objectPool.acquire();
            instance.init(TRANSPORT_ACTION.DO_NOTHING, data, false);
            return instance;
        }
        else return null;
    })
};

/**
 * Creates new instance of the model.
 * @param {[Object]} data
 * @returns {ModelInstance}
 */
Model.prototype.create = function (data) {
    var instance = this.objectPool.acquire();
    instance.init(TRANSPORT_ACTION.CREATE, data, true);
    return instance;
};

// =================================================================================================
// Model Wrapper
// =================================================================================================

/**
 * An instance of the object described my the Model definition.
 * @class ModelInstance
 * @param {Model} model A reference to a Model definition instance.
 * @param {Object} [data] An actual data.
 * @constructor
 */
function ModelInstance (model) {

    this._model = model;
    this._data = {};
    this._state = {
        onSave : '',
        dirty : {}
    };

    var i, key;
    for(i = 0; i < model.definitionKeys.length; i++) {
        key = model.definitionKeys[i];
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

    var dataType, k, keys = this._model.definitionKeys;
    for(var i = 0, len = keys.length; i < len; i++) {
        k = keys[i];
        dataType = this._model.definition[k];
        dataType.assignValue(this, k, (data)? data[k]:null, setDirtyToValue);
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

/**
 * @return {Object} Returns object literal containing all non-virtual properties of this model.
 */
ModelInstance.prototype.toJSON = function () {

    var result = {};
    var dataType, k, keys = this._model.definitionKeys;
    for(var i = 0, len = keys.length; i < len; i++) {
        k = keys[i];
        dataType = this._model.definition[k];
        if (!dataType.virtual) {
            result[k] = this._data[k];
        }
    }
    return result;
};

/**
 * @param {String} name Property name.
 * @returns {Boolean} True if property has being modified.
 */
ModelInstance.prototype.isDirty = function (name) {
    var prop = this._state.dirty[name];
    return ( prop !== undefined )? prop : false;
};

/**
 * Marks the object for deletion.
 */
ModelInstance.prototype.destroy = function () {
    this._state.onSave = TRANSPORT_ACTION.DESTROY;
};

/**
 * Send object to transport.
 * @param {Array} [meta] Array of anything that transport might find useful to know.
 * @returns {Promise<ModelInstance>}
 */
ModelInstance.prototype.commit = function (meta) {
    var self = this;
    return this._model.transport[this._state.onSave](this, meta || null).then(function (data) {
        if (data !== null && data !== undefined) {
            self.setAll(data, false);
        }
        self._state.onSave = TRANSPORT_ACTION.DO_NOTHING;
        return self;
    });
};

/**
 * Stores an object in the object pool for future reference. Don't call this method if you
 * want GC to take over.
 */
ModelInstance.prototype.release = function () {
    this.resetAll();
    this._model.objectPool.release(this);
};

/** @returns {exports.TransportInterface|*} */
ModelInstance.prototype.getTransport = function () {
    return this._model.transport;
};