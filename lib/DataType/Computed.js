
var Any = require('./Any');
module.exports = Any.extend({
    callback : null,

    virtual : true,
    defaultValue : function () {},
    //initialValue : function () {},

    initializeProperty : function (model, name) {
        model[name] = this.callback || this.defaultValue;
    },

    assignValue : function () {},
    resetValue : function () {}
});