"use strict";

module.exports.finalize = function (target, expected) {
	if (target.name === expected) return true;
	throw new TypeError(`${target.name} can't extend final class ${expected}.`);
};