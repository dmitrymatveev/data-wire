"use strict";

module.exports.flatten = function flatten (arr) {
	return arr.reduce(function (last, next) {
		if (Array.isArray(next)) {
			return last.concat(flatten(next));
		}
		else {
			return last.concat(next);
		}
	}, []);
};