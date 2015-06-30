var Transport = require('../Transport.js');
var util = require('../util.js');

/**
 * Base Data Type.
 * @mixes CoreObject
 */
var Any = util.CoreObject.extend({
    type : /\S+/,
    testType : function (other) {
        return other && other.type && this.type.test(other.type);
    }
});

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
 * Called on values coming from Transport
 * @type {Function}
 * @param {*} value
 * @return deserializedValue
 */
Any.deserialized = null;

/**
 * Called on value before sending to Transport (see ModelInstance.serialized method)
 * @type {Function}
 * @param {*} value
 * @return serializedValue
 */
Any.serialized = null;

/**
 * Called when value for this data type is being assigned into the current value position.
 *
 * @protected
 * @param value
 * @return {*}
 */
Any.valueCopy = function (value) {
    return value;
};

/**
 * Called on values returned from Transport after commit operation. Returned value will be assigned
 * in place of an "old" value.
 *
 * Note: When extending DataType, it is possible to set this property to NULL in order to avoid
 * a function call when transformation is not needed.
 *
 * @protected
 * @param {*} current
 * @param {*} old
 * @return {*}
 */
Any.valueTransform = function (current, old) {
    return current;
};

/**
 * Validate value before assignment.
 *
 * @protected
 * @param modelInstance
 * @param name
 * @param value
 * @returns {*}
 */
Any.validate = function (modelInstance, name, value) {

    if ( value !== undefined && value !== null ) {
        return value;
    }
    else if ( !this.optional ) {
        throw new MissingData(name);
    }
    else {
        return this.defaultValue(modelInstance, name);
    }
};

/**
 * Compare two values for equality. Used to determine when the value of this Data Type is dirty.
 *
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

    if ( this.virtual ) modelInstance[valueName] = this.defaultValue(modelInstance, valueName);
    else defineProperty(modelInstance, valueName);
};

function valueProxy (value) {
    return function () { return value; }
}

/**
 * Called once when value of this Data Type is initialized (fresh out from the model ObjectPool).
 * TODO maybe validation should be done not only during the initial assignment
 *
 * @private
 * @param {String} valueName
 * @param {ModelInstance} modelInstance
 * @param {*} value
 * @param {Boolean} setDirtyToValue
 */
Any.assignValue = function (modelInstance, valueName, value, setDirtyToValue) {
    var valid = this.validate(modelInstance, valueName, value);
    setValueToInstance(modelInstance, valueName, valid, this.virtual, setDirtyToValue);
};

/**
 * @private
 * @param {String} valueName
 * @param {ModelInstance} modelInstance
 */
Any.resetValue = function (modelInstance, valueName) {
    var defValue = this.defaultValue(modelInstance, valueName);
    setValueToInstance(modelInstance, valueName, defValue, this.virtual, false);
    setValueToInstance(modelInstance, valueName, defValue, this.virtual, true);
};

/**
 * @private
 * @param modelInstance
 * @param valueName
 * @param value
 */
Any.copyAssignValue = function (modelInstance, valueName, value) {

    var val = value === undefined ? this.defaultValue() : value;
    var old;

    if (this.valueTransform !== null) {

        modelInstance._state.dirty[valueName] = undefined;
        old = modelInstance._data[valueName] || this.defaultValue();
        val = this.valueTransform(val, old);
    }
    else {
        modelInstance._state.dirty[valueName] = val;
    }

    modelInstance._data[valueName] = this.valueCopy(val);
};

// =================================================================================================
// Helpers
// =================================================================================================

function defineProperty (obj, key) {

    Object.defineProperty(obj, key, {
        enumerable : true,
        get : function () {
            return obj._state.dirty[key] !== undefined ? obj._state.dirty[key] : obj._data[key]
        },
        set : function (v) {
            obj._state.dirty[key] = v;
            obj._state.onSave = obj._state.onSave === Transport.ACTION.CREATE ?
                Transport.ACTION.CREATE : Transport.ACTION.UPDATE;
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
    else {

        if (setToDirty) {
            modelInstance._state.dirty[valueName] = value;
        }
        else {
            modelInstance._data[valueName] = value;
        }
    }
}

function MissingData (name) {
    this.name = 'no_value';
    this.message = 'Non optional '+ name +' property is missing on the model instance.';
}
MissingData.prototype = Object.create(Error.prototype);