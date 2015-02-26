
var util = require('./util.js');

module.exports.ACTION = {
    FIND : 'find',
    UPDATE : 'update',
    INSERT : 'insert',
    DESTROY : 'destroy'
};

/** @class */
module.exports.TransportInterface = util.CoreObject.extend(/** @lends TransportInterface */{

    find : function (model, key) {
        return generateError(key, model);
    },

    update : function (obj) {
        return generateError(obj);
    },

    insert : function (obj) {
        return generateError(obj);
    },

    destroy : function (obj) {
        return generateError(obj);
    }
});

function generateError () {
    throw new Error('not implemented');
}