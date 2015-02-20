
var util = require('./util.js');

module.exports = util.CoreObject.extend({

    find : function (model, key) {
        return generateError(model, key);
    },

    update : function (obj) {
        return generateError(obj);
    },

    insert : function (obj) {
        return generateError(obj);
    }
});

function generateError () {
    throw new Error('not implemented');
}