
var Transport = require('./Transport.js');
var ObjectPool = require('./ObjectPool.js');

// =================================================================================================
// Model Definition
// =================================================================================================
module.exports = Model;

Model.transport = Transport.TransportInterface;
Model.objectPool = ObjectPool;

const ACTION = Transport.ACTION;

/**
 * Model definition
 * @class Model
 * @param {Object} def Definition object
 * @param {[Object]} params Modifications declaration
 * @param {[TransportInterface]} params.transport Sets custom transport
 * @param {[function|Object]} params.custom Add any number of these to be appended to the object instance prototype when those are instantiated.
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

    var self = this;

    this.definition = def;
    this.options = params || {};

    this.definitionKeys = Object.keys(def);
    this.transport = params.transport || Model.transport.extend({});

    this.objectPool = (this.options.pool || Model.objectPool).extend({
        generator : function () {
            return new ModelInstance(self);
        }
    });

    this.objectPool.reset();
}

/**
 * Sends find request to model transport.
 * @param key
 * @param {Array} meta Array of meta data stuff that are passed on to transport.
 * @returns {ModelInstance|null}
 */
Model.prototype.find = function (key, meta) {
    var that = this;
    return this.transport.read(key, meta || null, this).then(function (data) {
        if ( data !== null && data !== undefined ) {
            var obj = that.objectPool.acquire();
            obj.setAll(data, false);
            obj._state.onSave = ACTION.DO_NOTHING;
            return obj;
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
    var obj = this.objectPool.acquire();
    obj.setAll(data, true);
    obj._state.onSave = ACTION.CREATE;
    return obj;
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
function ModelInstance (model, data) {

    this.__proto__._model = model;
    this.__proto__._data = {};

    var i, key;
    for(i = 0; i < model.definitionKeys.length; i++) {
        key = model.definitionKeys[i];
        model.definition[key].initializeProperty(this, key);
    }

    if (data != undefined) {
        this.setAll(data);
    }
}

/** @protected */
ModelInstance.prototype._model = null;

/** @protected */
ModelInstance.prototype._data = null;

/** @protected */
ModelInstance.prototype._state = {
    onSave : '',
    dirty : {}
};

/** @private */
ModelInstance.prototype.setAll = function (data, doDirtyFlag) {

    var dataType, k, keys = this._model.definitionKeys;
    for(var i = 0, len = keys.length; i < len; i++) {
        k = keys[i];
        dataType = this._model.definition[k];
        dataType.assignValue(this, k, (data)? data[k]:null, doDirtyFlag);
    }
};

/** @private */
ModelInstance.prototype.resetAll = function () {

    var dataType, k, keys = this._model.definitionKeys;
    for(var i = 0, len = keys.length; i < len; i++) {
        k = keys[i];
        dataType = this._model.definition[k];
        if (dataType.virtual) {
            this[k] = dataType.initialValue;
        }
        else {
            this._data[k] = dataType.initialValue;
        }
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
    var self = this;
    this._state.onSave = ACTION.DESTROY;
    return this.commit().then(function () {
        self._state.onSave = ACTION.DO_NOTHING;
        return self;
    });
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