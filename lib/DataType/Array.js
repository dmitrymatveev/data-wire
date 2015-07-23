
var Any = require('./Any');
module.exports = Any.extend({
    type : /Array/,
    defaultValue : [],
    valueTransform : null,
    valueCopy : function (v) {
        var copy = [];
        for(var i = 0, len = v.length; i < len; i++) copy[i] = v[i];
        return copy;
    }
});