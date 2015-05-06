
var Any = require('./Any');
module.exports = Any.extend({
    callback : null,

    virtual : true,
    defaultValue : function () {},
    valueTransform : null,

    initializeProperty : function (model, name) {
        model[name] = this.callback || this.defaultValue;
    },

    assignValue : function () {},
    resetValue : function () {}
});