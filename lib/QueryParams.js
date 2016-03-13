"use strict";

var isNullOrUndefined = require('util').isNullOrUndefined;
var copy = require('./util/objects').copy;
var ServiceProvider = require('./ServiceProvider');
var rules = require('./query-rules/');

let PRIVATE = new WeakMap();

class QueryParams {
	constructor() {
		PRIVATE.set(this, {
			[rules.include.KEY]: null,
			[rules.sort.KEY]: null,
			[rules.page.KEY]: null,
			[rules.filter.KEY]: null,
			[rules.fields.KEY]: new rules.fields()
		});
	}

	static createDefault() {
		let res = new QueryParams();
		PRIVATE.set(res, {
			[rules.include.KEY]: new rules.include(),
			[rules.sort.KEY]: new rules.sort(),
			[rules.page.KEY]: new rules.page(),
			[rules.filter.KEY]: new rules.filter(),
			[rules.fields.KEY]: new rules.fields()
		});
		return res;
	}

	//static createMerged(primary, secondary) {
	//	let pm = PRIVATE.get(primary);
	//	let sm = PRIVATE.get(secondary);
	//	let query = new QueryParams();
	//	let rm = PRIVATE.get(query);
	//
	//	if (isNullOrUndefined(pm) || isNullOrUndefined(sm)) {
	//		throw new Error('Undefined query params object.');
	//	}
	//
	//	for(let key of Object.keys(pm)) {
	//		if (!isNullOrUndefined(sm[key])) {
	//			rm[key] = sm[key];
	//		}
	//		else {
	//			rm[key] = pm[key];
	//		}
	//	}
	//	return query;
	//}

	get params() {
		return copy(PRIVATE.get(this));
	}

	clone() {
		let params = QueryParams.createDefault();
		let self = PRIVATE.get(this);
		for(let key of Object.keys(self)) {
			PRIVATE.get(params)[key] = self[key];
		}
		return params;
	}

	mixin(params) {
		let self = PRIVATE.get(this);
		let mix = PRIVATE.get(params);

		if (isNullOrUndefined(self) || isNullOrUndefined(mix)) {
			throw new Error('Invalid QueryParams mixin.');
		}

		for(let key of Object.keys(self)) {
			self[key] = isNullOrUndefined(self[key]) ? mix[key] : self[key];
		}
		return this;
	}

	createQueryValidationFunction(resource) {
		let queryRules = PRIVATE.get(this);
		return validationFunction(queryRules, resource, rules.getter.validateQueryParams);
	}

	createResponseValidationFunction(resource) {
		let queryRules = PRIVATE.get(this);
		return validationFunction(queryRules, resource, rules.getter.validateResponseObject);
	}

	/**
	 * @param {Boolean} v
	 * @param {Number} [nestingLimit]
	 */
	setIncludeRelated(v, nestingLimit) {
		let include = getRule(this, rules.include);
		if (!isNullOrUndefined(nestingLimit)) {
			if (nestingLimit <= 0) {
				v = false;
			}
			include.constraints = nestingLimit;
		}
		include.use = v;
	}

	/** @param {Boolean|Array.<string>|null} v */
	setSorting(v) {
		PRIVATE.get(this).sort.use = v;
	}

	/** @param {Boolean|Array.<string>|null} v */
	setPagination(v) {
		PRIVATE.get(this).page.use = v;
	}

	/** @param {Boolean|Array.<string>|null} v */
	setFiltering(v) {
		PRIVATE.get(this).filter.use = v;
	}
}

module.exports = QueryParams;

function getRule(params, rule) {
	let pm = PRIVATE.get(params);
	if (!pm[rule.KEY]) {
		pm[rule.KEY] = new rule();
	}
	return pm[rule.KEY];
}

function validationFunction (rules, resource, getter) {
	return function (queryParams, data) {
		for(let param of Object.keys(queryParams)) {
			let next = rules[param];
			if (next === undefined || !next.use) {
				return false;
			}
			else if (!getter(next, resource, queryParams, data)) {
				return false
			}
		}
		return true;
	}
}