
var util = require('./util.js');

/**
 * Stores re-usable objects.
 * @class ObjectPool
 */
var Pool = module.exports = util.CoreObject.extend({});

Pool.generator = null;
Pool.size = 10;
Pool.idle = null;

/**
 * Let goes of everything.
 */
Pool.reset = function () {
    this.idle = [];
};

/**
 * Fetch existing or creates new.
 * @return {ModelInstance}
 */
Pool.acquire = function () {
    var obj = this.idle.shift();
    if (obj === undefined) obj = this.generator();// new this.generator();
    return obj;
};

/**
 * Keeps provided object in memory.
 * @param {ModelInstance} obj
 */
Pool.release = function (obj) {
    if (this.idle.length < this.size) {
        this.idle.push(obj);
    }
};