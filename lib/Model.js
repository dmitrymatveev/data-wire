
var Transport = require('./Transport.js');
var ObjectPool = require('./ObjectPool.js');

// =================================================================================================
// Model Definition
// =================================================================================================
module.exports = Model;

Model.transport = Transport;
Model.objectPool = ObjectPool;

function Model (def, params) {

    params = params || {};

    this.definition = def;
    this.transport = params.transport || Model.transport.extend({});

    this.objectPool = (params.pool || Model.objectPool).extend({
        generator : ModelInstance.bind(this, this)
    });

    this.objectPool.reset();
}

Model.prototype.find = function (name, key) {
    var that = this;
    return this.transport.find(this, key).then(function (data) {
        var obj = that.objectPool.acquire();
        obj.setAll(data);
        obj._state.onSave = 'update';
        return obj;
    })
};

Model.prototype.create = function (data) {
    var obj = this.objectPool.acquire();
    obj.setAll(data);
    obj._state.onSave = 'insert';
    return obj;
};

// =================================================================================================
// Model Wrapper
// =================================================================================================

function ModelInstance (model, data) {

    this.__proto__._model = model;

    if (data != undefined) {
        this.setAll(data);
    }
}

ModelInstance.prototype._model = null;
ModelInstance.prototype._state = {
    onSave : ''
};

ModelInstance.prototype.setAll = function (data) {

    var dataType, k, keys = Object.keys(this._model.definition);
    for(var i = keys.length; i; i--) {
        k = keys[i - 1];
        dataType = this._model.definition[k];
        this[k] = dataType.serialize(
            dataType.validate(data[k])
        );
    }
};

ModelInstance.prototype.resetAll = function () {

    var dataType, k, keys = Object.keys(this._model.definition);
    for(var i = keys.length; i; i--) {
        k = keys[i - 1];
        dataType = this._model.definition[k];
        this[k] = dataType.initialValue;
    }
};

ModelInstance.prototype.commit = function () {
    return this._model.transport[this._state.onSave](this);
};

ModelInstance.prototype.release = function () {
    this.resetAll();
    this._model.objectPool.release(this);
};
