
var util = require('util');

var Any = require('./Any');
module.exports = Any.extend({
    defaultValue : function () {return {}},
    valueTransform : null,

    valueCopy : function (v) {
        return util._extend({}, v);
    }
});