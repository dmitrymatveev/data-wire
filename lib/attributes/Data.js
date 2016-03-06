"use strict";

var BaseAttribute = require('./BaseAttribute');

class Data extends BaseAttribute {
	toJsonApi(router, destination, data) {
		let attributes = destination.attributes = destination.attributes || {};
		attributes[this.key] = data[this.key];
	}
}

module.exports = Data;