"use strict";

var BaseAttribute = require('./BaseAttribute');
let RESERVED_ATTRIBUTE_NAMES = null;

class Data extends BaseAttribute {

	constructor(key, resource, params) {
		super(key, resource, params);

		if (RESERVED_ATTRIBUTE_NAMES === null) {
			RESERVED_ATTRIBUTE_NAMES = require('./index').RESERVED_ATTRIBUTE_NAMES;
		}

		if (RESERVED_ATTRIBUTE_NAMES.indexOf(key) >= 0) {
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