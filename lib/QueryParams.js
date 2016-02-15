"use strict";

var isNullOrUndefined = require('util').isNullOrUndefined;
var isBoolean = require('util').isBoolean;
var copy = require('./util/objects').copy;
var ServiceProvider = require('./ServiceProvider');

let PRIVATE = new WeakMap();

class QueryParams {
	constructor() {
		PRIVATE.set(this, {
			include: false,
			sort: false,
			page: false,
			filter: false
		});
	}

	static createNotActivated(params) {
		params = params || {};
		let res = new QueryParams();
		let pm = PRIVATE.get(res);

		pm.include = params.include || null;
		pm.sort = params.sort || null;
		pm.page = params.page || null;
		pm.filter = params.filter || null;
		return res;
	}

	static createMerged(primary, secondary) {
		let pm = PRIVATE.get(primary);
		let sm = PRIVATE.get(secondary);
		let query = new QueryParams();
		let rm = PRIVATE.get(query);

		for(let key of Object.keys(pm)) {
			if (isNullOrUndefined(pm[key])) {
				rm[key] = sm[key];
			}
			else {
				rm[key] = pm[key];
			}
		}
		return query;
	}

	get params() {
		return copy(PRIVATE.get(this));
	}

	createQueryValidationFunction() {
		let pm = PRIVATE.get(this);

		return function (queryParams) {
			for(let param of Object.keys(queryParams)) {
				let rule = pm[param];
				if (rule === undefined || !rule) {
					return false;
				}
			}
			return true;
		}
	}

	/** @param {Boolean} v */
	setIncludeRelated(v) {
		if (!isBoolean(v)) throw new TypeError('Invalid query parameter argument.');
		PRIVATE.get(this).include = v;
	}

	/** @param {Boolean|Array.<string>|null} v */
	setSorting(v) {
		PRIVATE.get(this).sort = v;
	}

	/** @param {Boolean|Array.<string>|null} v */
	setPagination(v) {
		PRIVATE.get(this).page = v;
	}

	/** @param {Boolean|Array.<string>|null} v */
	setFiltering(v) {
		PRIVATE.get(this).filter = v;
	}
}

module.exports = QueryParams;