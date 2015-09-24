var Transport = require('../Transport.js');
var util = require('../util.js');

/**
 * Base Data Type.
 * @mixes CoreObject
 */
var Any = util.CoreObject.extend({
    type : /\S+/,
    testType : function (other) {
        return other && (other.type ? this.type.test(other.type) : this.type.test(other));
    }
});

module.exports = Any;

/**
 * Property default value. Note that this value is being put through 'valueCopy' function to provide
 * a chance to handle copying non-primitive data types.
 * @type {*}
 */
Any.defaultValue = undefined;

/**
 * Called before value is assigned to instance and before any transformations.
 * Provide this function to wrap values into custom decorators.
 * @type {Function}
 */
Any.valueDecorator = null;

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
 * Invoked by the users when ModelInstance.serialized method is called.
 *
 * @type {Function}
 * @param {*} value
 * @param {string} valueName
 * @param {Object} destination
 *
 * @return {*|null|undefined} serializedValue - Returning nothing from this function
 * signals the underlying model that the implementor has assigned serialized value to
 * destination object manually and will skip assignment step.
 */
Any.serialized = null;

/**
 * Called before non-virtual data type property is assigned a new value.
 * Provide implementation for this function when you want to enforce rules for your data type.
 * @type {Function}
 *
 * @return {Boolean}
 */
Any.validate = null;

/**
 * Called when value for this data type is being assigned into its instance property.
 * Override this function if your data type handles non primitive data type that can't be simply
 * copied by value.
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
Any._validateValue = function (modelInstance, name, value) {

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
        this.defaultValue = valueProxy(this, this.defaultValue);
    }

    if ( this.virtual ) modelInstance[valueName] = this.defaultValue(modelInstance, valueName);
    else defineProperty(modelInstance, valueName);
};

function valueProxy (dataType, value) {
    return function () { return dataType.valueCopy(value); }
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
    var valid = this._validateValue(modelInstance, valueName, value);
    if (this.valueDecorator) valid = this.valueDecorator(valid, modelInstance, valueName);
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
    if (!this.virtual) {
        setValueToInstance(modelInstance, valueName, undefined, this.virtual, true);
    }
};

/**
 * @private
 * @param modelInstance
 * @param valueName
 * @param value
 */
Any.copyAssignValue = function (modelInstance, valueName, value) {

    var val = value === undefined ? this.defaultValue() : value;
    if (this.valueDecorator) val = this.valueDecorator(val, modelInstance, valueName);
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

    var definition = obj._model.definition[key];

    Object.defineProperty(obj, key, {
        enumerable : true,
        get : function () {
            return obj._state.dirty[key] !== undefined ? obj._state.dirty[key] : obj._data[key]
        },
        set : function (v) {

            if (definition.validate && !definition.validate(v)) {
                throw new Error('Assignment validation error: ' + key + ' = ' + v);
            }

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
    this.message = 'Non optional "'+ name +'" property is missing on the model instance.';
    this.stack = (new Error()).stack;
}
MissingData.prototype = Object.create(Error.prototype);