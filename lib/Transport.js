
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
    read : function (key, meta, model) {
        return generateError(key, model, meta);
    },

    /**
     * Update underlying data storage.
     * @param {ModelInstance} obj model instance that needs to be updated.
     * @returns {Promise<ModelInstance>}
     */
    update : function (obj) {
        return generateError();
    },

    /**
     * Create new object in data storage.
     * @param {ModelInstance} obj model instance that needs to be updated.
     * @returns {Promise<ModelInstance>}
     */
    create : function (obj) {
        return generateError();
    },

    /**
     * Remove from data storage
     * @param {ModelInstance} obj model instance that needs to be updated.
     * @returns {Promise<ModelInstance>}
     */
    destroy : function (obj) {
        return generateError();
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