"use strict";

var BaseQueryRule = require('./BaseQueryRule');
const KEY = 'filter';

class Filter extends BaseQueryRule {
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

Filter.KEY = KEY;
module.exports = Filter;