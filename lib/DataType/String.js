
var Any = require('./Any');
module.exports = Any.extend({
    type : /String/,
    defaultValue : function () {return ''},
    valueTransform : null
});