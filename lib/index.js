var path = require('path');

module.exports = {
    Model : require( path.resolve(__dirname, './Model.js') ),
    DataType : require( path.resolve(__dirname, './DataType.js') ),
    Transport : require( path.resolve(__dirname, './Transport.js')).TransportInterface,
    ObjectPool : require( path.resolve(__dirname, './ObjectPool.js') )
};