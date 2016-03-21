"use strict";

var BaseAttribute = require('./BaseAttribute');

class Data extends BaseAttribute {

	static get RESERVED_ATTRIBUTE_NAMES() {
		return ['id', 'type', 'meta'];
	}

	constructor(key, resource, params) {
		super(key, resource, params);
		if (Data.RESERVED_ATTRIBUTE_NAMES.indexOf(key) >= 0) {
			throw new Error(`Reserved member name ${key} not allowed`);
		}
	}

	toJsonApi(ctx, destination, data) {
		let attributes = destination.attributes = destination.attributes || {};
		attributes[this.key] = data[this.key];
		return true;
	}
}

module.exports = Data;