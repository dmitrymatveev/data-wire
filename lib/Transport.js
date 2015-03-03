
var util = require('./util.js');

module.exports.ACTION = {
    FIND : 'find',
    UPDATE : 'update',
    INSERT : 'insert',
    DESTROY : 'destroy',
    INVALID : '_invalid'
};

/**
 * Describes class responsible for handling the data storage.
 * @class
 */
module.exports.TransportInterface = util.CoreObject.extend(/** @lends TransportInterface */{

    /**
     * Return data that matches key.
     * @param {*} key Identifies data by this key.
     * @param {Array} meta Array of anything that transport might find useful to know.
     * @param {Model} model Type of the model requested.
     * @returns {Promise<ModelInstance>} object literal matching model definition properties.
     */
    find : function (key, meta, model) {
        return generateError(key, model, meta);
    },

    /**
     * Update underlying data storage.
     * @param {ModelInstance} obj model instance that needs to be updated.
     * @param {Array} meta Array of anything that transport might find useful to know.
     * @returns {Promise<ModelInstance>}
     */
    update : function (obj, meta) {
        return generateError();
    },

    /**
     * Create new object in data storage.
     * @param {ModelInstance} obj model instance that needs to be updated.
     * @param {Array} meta Array of anything that transport might find useful to know.
     * @returns {Promise<ModelInstance>}
     */
    insert : function (obj, meta) {
        return generateError();
    },

    /**
     * Remove from data storage
     * @param {ModelInstance} obj model instance that needs to be updated.
     * @param {Array} meta Array of anything that transport might find useful to know.
     * @returns {Promise<ModelInstance>}
     */
    destroy : function (obj, meta) {
        return generateError();
    },

    /**
     * Throws an error when consumer tried to commit an invalidated instance of the model.
     * @throws Invalid object
     * @private
     */
    _invalid : function () {
        return generateError();
    }
});

function generateError () {
    throw new Error('Invalid object');
}