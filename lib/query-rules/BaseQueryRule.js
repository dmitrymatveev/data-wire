"use strict";

const DEFAULT_KEY = 'rule_key_not_set';

class BaseQueryRule {
	constructor(use, constraints) {
		this.use = use;
		this.constraints = constraints || null;
	}

	validateQueryParams(resource, params) {throw new TypeError('Not implemented')}
	validateResponseObject(resource, params, data) {throw new TypeError('Not implemented')}
}

BaseQueryRule.KEY = DEFAULT_KEY;
module.exports = BaseQueryRule;