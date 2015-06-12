
var Any = require('./Any');
var NumberType = module.exports = Any.extend({
    type : /Number/,
    defaultValue : 0,
    valueTransform : null
});

NumberType.Transform = {
    Counter : function (a, b) { return b + a }
};