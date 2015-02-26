
var Transport = require('./Transport.js');
var ObjectPool = require('./ObjectPool.js');

// =================================================================================================
// Model Definition
// =================================================================================================
module.exports = Model;

Model.transport = Transport.TransportInterface;
Model.objectPool = ObjectPool;

/**
 * Model definition
 * @class Model
 * @param def
 * @param {[Object]} params
 * @constructor
 */
function Model (def, params) {

    params = params || {};

    this.definition = def;
    this.transport = params.transport || Model.transport.extend({});

    this.objectPool = (params.pool || Model.objectPool).extend({
        generator : ModelInstance.bind(this, this, params)
    });

    this.objectPool.reset();
}

/**
 * Sends find request to model transport.
 * @param key
 * @returns {ModelInstance|null}
 */
Model.prototype.find = function (key) {
    var that = this;
    return this.transport.find(key, this).then(function (data) {
        if ( data !== null && data !== undefined ) {
            var obj = that.objectPool.acquire();
            obj.setAll(data);
            obj._state.onSave = Transport.ACTION.UPDATE;
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
    obj.setAll(data);
    obj._state.onSave = Transport.ACTION.INSERT;
    return obj;
};

// =================================================================================================
// Model Wrapper
// =================================================================================================

const PROTECTED_MODEL_KEYS = [
    'transport'
];

/**
 * @class ModelInstance
 * @param model
 * @param params
 * @param data
 * @constructor
 */
function ModelInstance (model, params, data) {

    this.__proto__._model = model;

    var key, keys = Object.keys(params);
    for(var i = 0; i < keys.length; i++) {
        key = keys[i];

        if (PROTECTED_MODEL_KEYS.indexOf(key) >= 0) {
            continue;
        }

        this.__proto__[key] = params[key];
    }

    if (data != undefined) {
        this.setAll(data);
    }
}

/** @private */
ModelInstance.prototype._model = null;

/** @private */
ModelInstance.prototype._state = {
    onSave : ''
};

/** @private */
ModelInstance.prototype.setAll = function (data) {

    var dataType, k, keys = Object.keys(this._model.definition);
    for(var i = keys.length; i; i--) {
        k = keys[i - 1];
        dataType = this._model.definition[k];
        this[k] = dataType.deserialize(
            dataType.validate(data[k])
        );
    }
};

/** @private */
ModelInstance.prototype.resetAll = function () {

    var dataType, k, keys = Object.keys(this._model.definition);
    for(var i = keys.length; i; i--) {
        k = keys[i - 1];
        dataType = this._model.definition[k];
        this[k] = dataType.initialValue;
    }
};

/**
 * Marks the object for deletion.
 */
ModelInstance.prototype.destroy = function () {
    this._state.onSave = Transport.ACTION.DESTROY;
};

/**
 * Send object to transport.
 * @returns {*}
 */
ModelInstance.prototype.commit = function () {
    return this._model.transport[this._state.onSave](this);
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