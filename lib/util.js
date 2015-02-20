
module.exports.CoreObject = {

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