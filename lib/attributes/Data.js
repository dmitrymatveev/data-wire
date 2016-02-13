"use strict";

var BaseAttribute = require('./BaseAttribute');

var PRIVATE = new WeakMap();

class Data extends BaseAttribute {
	toJsonApi(destination, data) {

		let res = destination.data = destination.data || {};
		res[this.key]
	}
}

module.exports = Data;