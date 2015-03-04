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

        var key, keys = Object.keys(this);

        for (var i = 0, len = keys.length; i < len; i++) {
            key = keys[i];

            if (child[key] === undefined) {
                child[key] = this[key];
            }
        }

        return child;
    }
};