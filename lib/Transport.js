
var Q = require('kew');
var util = require('./util.js');

var Transport = module.exports = util.CoreObject.extend({});

Transport.find = function (model, key) {
    return generateError(model, key);
};

Transport.update = function (obj) {
    return generateError(obj);
};

Transport.insert = function (obj) {
    return generateError(obj);
};

function generateError () {
    return Q.reject(new Error('not implemented'));
}