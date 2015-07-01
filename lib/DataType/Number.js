var Any = require('./Any');
var NumberType = module.exports = Any.extend({
    type : /Number/,
    defaultValue : 0,
    valueTransform : null
});

NumberType.Counter = NumberType.extend({
    type : /NumberCounter/,
    valueTransform  : function (a, b) { return b + a },
    isEqual : function (a, b) { return ((a + b) - a) === 0 }
});