"use strict";

var BaseQueryRule = require('./BaseQueryRule');
const KEY = 'sort';

class Sort extends BaseQueryRule {
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

Sort.KEY = KEY;
module.exports = Sort;