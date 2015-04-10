var path = require('path');

/**
 * A+ compliant promise object.
 * @name Promise
 * @typedef {Object} Promise
 */

/**
 *
 * @type {{
 *  Model: (Model),
 *  DataType: (DataType),
 *  Transport: {TransportInterface},
 *  ObjectPool: (ObjectPool)
 * }}
 */
module.exports = {
    Model : require('./Model'),
    DataType : require('./DataType/'),
    Transport : require('./Transport.js').TransportInterface,
    ObjectPool : require('./ObjectPool.js')
};