
var util = require('./util.js');

/**
 * Map of transport interface actions.
 * @type {{CREATE: string, READ: string, UPDATE: string, DESTROY: string, DO_NOTHING: string}}
 */
module.exports.ACTION = {
    CREATE : 'create',
    READ : 'read',
    UPDATE : 'update',
    DESTROY : 'destroy',
    DO_NOTHING : '_do_nothing'
};

/**
 * Describes class responsible for handling the data storage.
 * @class TransportInterface
 */
module.exports.TransportInterface = util.CoreObject.extend({

    /**
     * Return data that matches key.
     * @param {*} key Key to search data by.
     * @param {Array} [meta] Array of anything that transport might find useful to know.
     * @param {Model} model Type of the model requested.
     * @returns {Promise<ModelInstance>} object literal matching model definition properties.
     */
    read : function (key, meta, model) {
        return generateError(key, meta, model);
    },

    /**
     * Update underlying data storage.
     * @param {ModelInstance} obj model instance that needs to be updated.
     * @param {Array} [meta] Array of anything that transport might find useful to know.
     * @returns {Promise<ModelInstance>}
     */
    update : function (obj, meta) {
        return generateError(obj, meta);
    },

    /**
     * Create new object in data storage.
     * @param {ModelInstance} obj model instance that needs to be updated.
     * @param {Array} [meta] Array of anything that transport might find useful to know.
     * @returns {Promise<ModelInstance>}
     */
    create : function (obj, meta) {
        return generateError(obj, meta);
    },

    /**
     * Remove from data storage
     * @param {ModelInstance} obj model instance that needs to be updated.
     * @param {Array} [meta] Array of anything that transport might find useful to know.
     * @returns {Promise<ModelInstance>}
     */
    destroy : function (obj, meta) {
        return generateError(obj, meta);
    },

    /**
     * Throws an error when consumer tried to commit an invalidated instance of the model.
     * @throws Invalid object
     * @private
     */
    _do_nothing : function () {
        return {
            then : function (cb) {
                process.nextTick(cb);
            }
        }
    }

});

function generateError () {
    throw new Error('Invalid object');
}