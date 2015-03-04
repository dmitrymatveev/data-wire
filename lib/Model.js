
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
    this.definitionKeys = Object.keys(def);
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
    return this.transport.read(key, meta || [], this).then(function (data) {
        if ( data !== null && data !== undefined ) {
            var obj = that.objectPool.acquire();
            obj.setAll(data, false);
            obj._state.onSave = Transport.ACTION.DO_NOTHING;
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
    obj._state.onSave = Transport.ACTION.CREATE;
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
    var values = this.__proto__._data = {};

    var key;
    for(var i = 0; i < model.definitionKeys.length; i++) {
        key = model.definitionKeys[i];

        if (PROTECTED_MODEL_KEYS.indexOf(key) >= 0) {
            continue;
        }

        if ( model.definition[key].virtual ) {
            this[key] = model.definition[key].defaultValue;
        }
        else {
            defineProperty(this, key, values);
        }
    }

    if (data != undefined) {
        this.setAll(data);
    }
}

function defineProperty (obj, key, values) {

    Object.defineProperty(obj, key, {
        enumerable : true,
        get : function () { return values[key]; },
        set : function (v) {
            if ( values[key] !== v ) {
                obj._state.dirty[key] = true;
                obj._state.onSave = Transport.ACTION.UPDATE;
            }
            values[key] = v;
        }
    });
}

/**
 * @param {String} name Property name.
 * @returns {Boolean} True if property has being modified.
 */
ModelInstance.prototype.isDirty = function (name) {
    var prop = this._state.dirty[name];
    return ( prop !== undefined )? prop : false;
};

/** @private */
ModelInstance.prototype._model = null;

/** @protected */
ModelInstance.prototype._state = {
    onSave : '',
    dirty : {}
};

/** @private */
ModelInstance.prototype.setAll = function (data, doFlagDirty) {

    var dataType, k, keys = this._model.definitionKeys;
    for(var i = keys.length; i; i--) {
        k = keys[i - 1];
        dataType = this._model.definition[k];

        var value = dataType.deserialize( dataType.validate( (data)? data[k]:null ) );

        if (dataType.virtual) this[k] = value;
        else if (doFlagDirty) this[k] = value;
        else {
            this._data[k] = value;
            this._state.dirty[k] = false;
        }
    }
};

/** @private */
ModelInstance.prototype.resetAll = function () {

    var dataType, k, keys = this._model.definitionKeys;
    for(var i = keys.length; i; i--) {
        k = keys[i - 1];
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
 * Marks the object for deletion.
 */
ModelInstance.prototype.destroy = function () {
    var self = this;
    this._state.onSave = Transport.ACTION.DESTROY;
    return this.commit().then(function () {
        self._state.onSave = Transport.ACTION.DO_NOTHING;
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