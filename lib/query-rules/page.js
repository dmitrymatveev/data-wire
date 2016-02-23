"use strict";

var BaseQueryRule = require('./BaseQueryRule');
const KEY = 'page';

class Page extends BaseQueryRule {
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

Page.KEY = KEY;
module.exports = Page;
