"use strict";

var BaseQueryRule = require('./BaseQueryRule');
const KEY = 'fields';

class SparseFields extends BaseQueryRule {
	constructor(use) {
		super(use);
	}

	validateQueryParams(resource, params) {
		return true;
	}

	validateResponseObject(resource, params, data) {
		return true;
	}
}

SparseFields.KEY = KEY;
module.exports = SparseFields;