"use strict";

var cache = require('memory-cache');
var BaseQueryRule = require('./BaseQueryRule');
var Relationship = require('../attributes/Relationship');

const KEY = 'include';
const RELATION_DELIMITER = ',';
const RELATION_PATH_DELIMITER = '.';

const TTL = 600000; // 10 minutes
const DEFAULT_NESTING_LIMIT = 2;

class IncludeRelated extends BaseQueryRule {
	constructor(use) {
		super(use, DEFAULT_NESTING_LIMIT);
	}

	validateQueryParams(resource, params) {
		let param = params[KEY];
		let selfName = resource.name;
		let cacheKey = `${selfName}:${param}`;
		let cached = cache.get(cacheKey);

		if (cached) {
			params[KEY] = cached;
			return true;
		}

		let relations = param.split(RELATION_DELIMITER);
		for(let i = 0; i < relations.length; i++) {
			let relation = relations[i];
			let includePath = relation.split(RELATION_PATH_DELIMITER);

			if (includePath.length > this.constraints) {
				return false;
			}

			let related = null;
			for(let path of includePath) {

				if (path === selfName) {
					return false;
				}

				related = Relationship.getRelatedResource(resource, path);
				if (related === null) {
					return false;
				}
			}

			relations[i] = includePath;
		}

		cache.put(cacheKey, relations, TTL);
		params[KEY] = relations;
		return true;
	}

	validateResponseObject(resource, params, data) {
		return true;
	}
}

IncludeRelated.KEY = KEY;
module.exports = IncludeRelated;