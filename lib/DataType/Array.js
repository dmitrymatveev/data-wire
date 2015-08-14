
var Any = require('./Any');
module.exports = Any.extend({
    type : /Array/,
    defaultValue : [],
    valueTransform : null,
    valueDecorator: function (value, modelInstance) {
        var arr = new SubArray();
        arr.model = modelInstance;
        arr.push.apply(arr, value);
        return arr;
    },
    valueCopy : function (v) {
        var copy = [];
        for(var i = 0, len = v.length; i < len; i++) copy[i] = v[i];
        return copy;
    }
});

/**
 * @return {Array}
 * @constructor
 *
 * @see {@link http://perfectionkills.com/how-ecmascript-5-still-does-not-allow-to-subclass-an-array/|source}
 */
function SubArray() {
    this.model = null;
    var arr = [ ];
    arr.push.apply(arr, arguments);
    arr.__proto__ = SubArray.prototype;
    return arr;
}
SubArray.prototype = Object.create(Array.prototype);

SubArray.prototype.pop = function () {
    this.model.update();
    return Array.prototype.pop.call(this);
};

SubArray.prototype.push = function () {
    this.model.update();
    return Array.prototype.push.apply(this, arguments);
};

SubArray.prototype.reverse = function () {
    this.model.update();
    Array.prototype.reverse.call(this);
};

SubArray.prototype.shift = function () {
    this.model.update();
    return Array.prototype.shift.call(this);
};

SubArray.prototype.splice = function () {
    this.model.update();
    return Array.prototype.splice.apply(this, arguments);
};

SubArray.prototype.unshift = function () {
    this.model.update();
    return Array.prototype.unshift.call(this);
};