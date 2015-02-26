
var util = require('./util.js');
var Type = module.exports = {};

Type.Any = util.CoreObject.extend({});

Type.Any.defaultValue = undefined;
Type.Any.initialValue = null;
Type.Any.isOptional = true;

Type.Any.validate = function (value) {

    if ( value !== undefined ) {
        return value;
    }
    else if ( !this.isOptional ) {
        throw new Error('Non optional property is missing on the model instance!');
    }
    else if ( this.defaultValue !== undefined ) {
        return this.defaultValue;
    }
    else {
        return this.initialValue;
    }
};

Type.Any.deserialize = function (value) {
    return value;
};

Type.Any.serialize = function (value) {
    return value;
};

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