
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
 * @param {Object} def Definition object
 * @param {[Object]} params Modifications declaration
 * @param {[TransportInterface]} params.transport Sets custom transport
 * @param {[function|Object]} params.custom Add any number of these to be appended to the object instance prototype when those are instantiated.
 *
 * @example
 * // Definition object
 *  {
 *      propertyName : DataType.String
 *      otherValue : DataType.Any
 *  }
 *
 *  @example
 *  var Jedi = new Model({
 *      name : DataType.String,
 *      age : DataType.Number
 *  }, {
 *      transport : MyCustomTransportImplementation,
 *
 *      describePerson : function () {
 *          return (this.age > 50) ? 'master ' + this.name : 'youngling ' + this.name;
 *      }
 *  });
 *
 *  var ben = Jedi.create({ age : 80, name : Obi-Wan Kenobi })
 *  ben.describe(); // 'master Obi-Wan Kenobi'
 *
 * @constructor
 */
function Model (def, params) {

    params = params || {};

    this.definition = def;
    this.transport = params.transport || Model.transport.extend({});

    this.objectPool = (params.pool || Model.objectPool).extend({
        generator : ModelInstance.bind(this, this)
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
    return this.transport.find(key, meta || [], this).then(function (data) {
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
 * An instance of the object described my the Model definition.
 * @class ModelInstance
 * @param {Model} model A reference to a Model definition instance.
 * @param {Object} data An actual data.
 * @constructor
 */
function ModelInstance (model, data) {

    this.__proto__._model = model;

    var key, keys = Object.keys(model.definition);
    for(var i = 0; i < keys.length; i++) {
        key = keys[i];

        if (PROTECTED_MODEL_KEYS.indexOf(key) >= 0) {
            continue;
        }

        this.__proto__[key] = model.definition[key];
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
            (data)? dataType.validate(data[k]) : null
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
    return this.commit().then(function (self) {
        self._state.onSave = Transport.ACTION.INVALID;
        return self;
    });
};

/**
 * Send object to transport.
 * @returns {Promise<ModelInstance>}
 */
ModelInstance.prototype.commit = function () {
    var self = this;
    return this._model.transport[this._state.onSave](this).then(function (data) {
        self._state.onSave = Transport.ACTION.UPDATE;
        if (data !== null && data !== undefined) {
            self.setAll(data);
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