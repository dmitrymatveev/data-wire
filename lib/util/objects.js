"use strict";

module.exports.Iterator = function (obj) {
	let index = 0;
	let keys = Object.keys(obj);
	return {
		[Symbol.iterator]() {
			return this;
		},
		next() {
			return index < keys.length ?
			{value: obj[keys[index++]]} :
			{done: true}
		}
	}
};

module.exports.merge = function (to, from) {
	let keys = Object.keys(from);
	for(let k of keys) {
		to[k] = from[k];
	}
	return to;
};

module.exports.copy = function (from) {
	let res = {};
	for(let k of Object.keys(from)) {
		res[k] = from[k];
	}
	return res;
};