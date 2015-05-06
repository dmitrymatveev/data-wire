
var Transport = require('../Transport.js');
var util = require('../util.js');

/**
 * Base Data Type.
 * @mixes CoreObject
 */
var Any = util.CoreObject.extend({});
module.exports = Any;

/** @type {*} */
Any.defaultValue = undefined;

/**
 * Whether the property must be present when assigning values to the model instance or may be omitted.
 * @type {boolean} Default `true`
 */
Any.optional = true;

/**
 * Whether 'dirty' state should be tracked for this data type instance.
 * @type {boolean} Default `false`
 */
Any.virtual = false;

/**
 * @protected
 * @param value
 * @return {*}
 */
Any.valueCopy = function (value) {
    return value;
};

/**
 * Validate value before assignment.
 * @protected
 * @param name
 * @param value
 * @returns {*}
 */
Any.validate = function (name, value) {

    if ( value !== undefined && value !== null ) {
        return value;
    }
    else if ( !this.optional ) {
        throw new Error('Non optional '+ name +' property is missing on the model instance!');
    }
    else {
        return this.defaultValue();
    }
};

/**
 * @protected
 * @param a
 * @param b
 * @return {boolean}
 */
Any.isEqual = function (a, b) {
    return a === b;
};

/**
 * @private
 * @param modelInstance
 * @param valueName
 */
Any.initializeProperty = function (modelInstance, valueName) {

    if (typeof this.defaultValue !== 'function') {
        this.defaultValue = valueProxy(this.defaultValue);
    }

    if ( this.virtual ) modelInstance[valueName] = this.defaultValue();
    else defineProperty(modelInstance, valueName);
};

function valueProxy (value) {
    return function () { return value; }
}

/**
 * @private
 * @param {String} valueName
 * @param {ModelInstance} modelInstance
 * @param {*} value
 * @param {Boolean} setDirtyToValue
 */
Any.assignValue = function (modelInstance, valueName, value, setDirtyToValue) {
    var valid = this.validate(valueName, value);
    setValueToInstance(modelInstance, valueName, valid, this.virtual, setDirtyToValue);
};

/**
 * @private
 * @param {String} valueName
 * @param {ModelInstance} modelInstance
 */
Any.resetValue = function (modelInstance, valueName) {
    setValueToInstance(modelInstance, valueName, this.defaultValue(), this.virtual, false);
    setValueToInstance(modelInstance, valueName, this.defaultValue(), this.virtual, true);
};

/**
 * @private
 * @param modelInstance
 * @param valueName
 * @param value
 */
Any.copyAssignValue = function (modelInstance, valueName, value) {
    modelInstance._data[valueName] = (value === undefined) ?
        this.defaultValue() : this.valueCopy(value);
};

// =================================================================================================
// Helpers
// =================================================================================================

function defineProperty (obj, key) {

    Object.defineProperty(obj, key, {
        enumerable : true,
        get : function () { return obj._state.dirty[key]; },
        set : function (v) {
            if ( obj._data[key] !== v ) {
                obj._state.dirty[key] = v;
                obj._state.onSave = obj._state.onSave === Transport.ACTION.CREATE ?
                    Transport.ACTION.CREATE : Transport.ACTION.UPDATE;
            }
        }
    });
}

/**
 * @param {String} valueName
 * @param {ModelInstance} modelInstance
 * @param {*} value
 * @param {Boolean} isVirtual
 * @param {Boolean} setToDirty When true value would be assigned to actual state.
 */
function setValueToInstance (modelInstance, valueName, value, isVirtual, setToDirty ) {
    if (isVirtual) modelInstance[valueName] = value;
    else if (setToDirty) modelInstance._state.dirty[valueName] = value;
    else {
        modelInstance._state.dirty[valueName] = value;
        modelInstance._data[valueName] = value;
    }
}