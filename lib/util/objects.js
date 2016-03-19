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

module.exports.copy = function (from, to) {
	let res = to || {};
	for(let k of Object.keys(from)) {
		res[k] = from[k];
	}
	return res;
};

module.exports.values = function (obj) {
	let values = [];
	for(let key of Object.keys(obj)) {
		values.push(obj[key]);
	}
	return values;
};