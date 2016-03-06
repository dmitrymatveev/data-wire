"use strict";

var isString = require('util').isString;
var isObject = require('util').isObject;
var objects = require('../util/objects');
var ServiceProvider = require('../ServiceProvider');

let PRIVATE = new WeakMap();

class BaseAttribute {
	constructor(key, resource, params) {
		let Resource = ServiceProvider.get('resource').Resource;

		let isValid = isString(key) && isObject(params) &&
				Resource.prototype.isPrototypeOf(resource);

		if (isValid) {
			PRIVATE.set(this, { key, resource, params });
		}
		else {
			throw new Error('Invalid BaseAttribute constructor arguments.');
		}
	}

	get key() { return PRIVATE.get(this).key }
	get resource() { return PRIVATE.get(this).resource }
	get params() { return PRIVATE.get(this).params }

	toJsonApi(router, destination, data) {
		PRIVATE.get(this);
		throw new Error('not implemented');
	}

	toDatastore() {
		PRIVATE.get(this);
		throw new Error('not implemented');
	}
}

module.exports = BaseAttribute;