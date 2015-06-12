
var Any = require('./Any');
module.exports = Any.extend({
    type : /Array/,

    defaultValue : function () {return []},

    valueTransform : null,

    valueCopy : function (v) {
        return v.slice(0);
    }
});