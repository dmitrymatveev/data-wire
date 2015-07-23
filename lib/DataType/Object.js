
var util = require('util');

var Any = require('./Any');
module.exports = Any.extend({
    type : /Object/,
    defaultValue : {},
    valueTransform : null,
    valueCopy : function (v) {
        return util._extend({}, v);
    }
});