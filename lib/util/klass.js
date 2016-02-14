"use strict";

module.exports.finalize = function (expected, actual) {
	if (actual.name === expected) return true;
	throw new TypeError(`${actual.name} can't extend final class ${expected}.`);
};

module.exports.static = function (expected) {
	throw new Error(`Cat't instantiate static class ${expected}`);
};