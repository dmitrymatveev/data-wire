
var Any = require('./Any');
module.exports = Any.extend({
    defaultValue : function () {return []},

    valueCopy : function (v) {
        return v.slice(0);
    }
});