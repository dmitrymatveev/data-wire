var path = require('path');

/**
 * A+ compliant promise object.
 * @name Promise
 * @typedef {Object} Promise
 */

/**
 * @type {{Model: *, DataType: *, Transport: (exports.TransportInterface|*), ObjectPool: *}}
 */
module.exports = {
    Model : require( path.resolve(__dirname, './Model.js') ),
    DataType : require( path.resolve(__dirname, './DataType.js') ),
    Transport : require( path.resolve(__dirname, './Transport.js')).TransportInterface,
    ObjectPool : require( path.resolve(__dirname, './ObjectPool.js') )
};