var path = require('path');

module.exports = {
    Model : require( path.resolve(__dirname, './lib/Model.js') ),
    DataType : require( path.resolve(__dirname, './lib/DataType.js') ),
    Transport : require( path.resolve(__dirname, './lib/Transport.js') ),
    ObjectPool : require( path.resolve(__dirname, './lib/ObjectPool.js') )
};