
var util = require('./util.js');
var Pool = module.exports = util.CoreObject.extend({});

Pool.generator = null;
Pool.size = 10;
Pool.idle = null;

Pool.reset = function () {
    this.idle = [];
};

Pool.acquire = function () {
    var obj = this.idle.shift();
    if (obj === undefined) obj = new this.generator();
    return obj;
};

Pool.release = function (obj) {
    if (this.idle.length < this.poolSize) {
        this.idle.push(obj);
    }
};