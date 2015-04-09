
var Transport = require('./Transport.js');
var util = require('./util.js');

var Type = module.exports = {};

/**
 * @mixes CoreObject
 */
Type.Any = util.CoreObject.extend({});

/** @type {*} */
Type.Any.defaultValue = undefined;

/** @private */
Type.Any.initialValue = undefined;

/**
 * Whether the property must be present when assigning values to the model instance or may be omitted.
 * @type {boolean} Default `true`
 */
Type.Any.optional = true;

/**
 * Whether 'dirty' state should be tracked for this data type instance.
 * @type {boolean} Default `false`
 */
Type.Any.virtual = false;

/**
 * Validate value before assignment.
 * @private
 * @param name
 * @param value
 * @returns {*}
 */
Type.Any.validate = function (name, value) {

    if ( value !== undefined && value !== null ) {
        return value;
    }
    else if ( !this.optional ) {
        throw new Error('Non optional '+ name +' property is missing on the model instance!');
    }
    else if ( this.defaultValue !== undefined ) {
        return this.defaultValue();
    }
    else {
        return this.initialValue();
    }
};

Type.Any.initializeProperty = function (modelInstance, valueName) {

    if (typeof this.defaultValue !== 'function') {
        this.defaultValue = valueProxy(this.defaultValue);
    }

    if (this.initialValue === undefined || typeof this.initialValue !== 'function') {
        this.initialValue = valueProxy(this.initialValue);
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
Type.Any.assignValue = function (modelInstance, valueName, value, setDirtyToValue) {
    var valid = this.validate(valueName, value);
    setValueToInstance(modelInstance, valueName, valid, this.virtual, setDirtyToValue);
};

/**
 * @private
 * @param {String} valueName
 * @param {ModelInstance} modelInstance
 */
Type.Any.resetValue = function (modelInstance, valueName) {
    setValueToInstance(modelInstance, valueName, this.initialValue(), this.virtual, false);
    setValueToInstance(modelInstance, valueName, this.initialValue(), this.virtual, true);
};

// =================================================================================================
// Custom data type implementations.
// =================================================================================================

Type.Number = Type.Any.extend({ defaultValue : 0 });

Type.String = Type.Any.extend({ defaultValue : '' });

Type.Json = Type.Any.extend({ defaultValue : function () {return {}} });

Type.Array = Type.Any.extend({ defaultValue : function () {return []} });

Type.Boolean = Type.Any.extend({ defaultValue : false });

Type.Computed = function (callback) {
    return Type.Any.extend({
        callback : callback,

        virtual : true,
        defaultValue : function () {},
        initialValue : function () {},

        initializeProperty : function (model, name) {
            model[name] = this.callback || this.defaultValue;
        },

        assignValue : function () {},
        resetValue : function () {}
    });
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