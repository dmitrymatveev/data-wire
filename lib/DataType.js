
var util = require('./util.js');

var Type = module.exports = {};

/**
 * @mixes CoreObject
 */
Type.Any = util.CoreObject.extend({});

Type.Any.defaultValue = undefined;
Type.Any.initialValue = null;

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
 * @param value
 * @returns {*}
 */
Type.Any.validate = function (value) {

    if ( value !== undefined && value !== null ) {
        return value;
    }
    else if ( !this.optional ) {
        throw new Error('Non optional property is missing on the model instance!');
    }
    else if ( this.defaultValue !== undefined ) {
        return this.defaultValue;
    }
    else {
        return this.initialValue;
    }
};

/**
 * @param value
 * @returns {*}
 */
Type.Any.deserialize = function (value) {
    return value;
};

/**
 * @param value
 * @returns {*}
 */
Type.Any.serialize = function (value) {
    return value;
};

// =================================================================================================
// Custom data type implementations.
// =================================================================================================

Type.Number = Type.Any.extend({ defaultValue : 0 });

Type.String = Type.Any.extend({
    defaultValue : '',
    deserialize : function (value) {
        return value.toString();
    },
    serialize : function (value) {
        return value.toString();
    }
});