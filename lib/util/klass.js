"use strict";

module.exports.abstract = function (expected, actual) {
	if (actual !== expected) return true;
	throw new TypeError(`Can't instantiate abstract class ${expected}.`);
};

module.exports.final = function (expected, actual) {
	if (actual === expected) return true;
	throw new TypeError(`${actual.name} can't extend final class ${expected}.`);
};

module.exports.static = function (expected) {
	throw new Error(`Cat't instantiate static class ${expected}`);
};