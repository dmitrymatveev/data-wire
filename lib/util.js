
module.exports.mixin = mixin;
function mixin (from, to) {

    var key, keys = Object.keys(from);

    for (var i = 0, len = keys.length; i < len; i++) {
        key = keys[i];

        if (to[key] === undefined) {
            to[key] = from[key];
        }
    }

    return to;
}

/**
 * This provides method to extend object literals with custom properties.
 * @mixin
 */
module.exports.CoreObject = {

    /**
     * Extend object by mixin in own properties into the provided child
     * @param {Object} child
     * @returns {Object} Modified child object.
     */
    extend : function (child) {
        return mixin(this, child);
    }
};