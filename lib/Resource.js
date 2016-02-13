"use strict";

var isObject = require('util').isObject;
var isFunction = require('util').isFunction;
var objects = require('./util/objects');
var string = require('./util/string');
var TransportInterface = require('./TransportInterface');
var ServiceProvider = require('./ServiceProvider');

var BaseAttribute = require('./attributes/BaseAttribute');
var Meta = require('./attributes/Meta');

var RESOURCES = new Map();
var PRIVATE = new WeakMap();

class Resource {

	constructor(v1, v2, v3) {
		var name = typeof v1 === 'string' ? v1 : new.target.name;
		var schema = typeof v1 === 'string' ? v2 : v1;

		if (!schema || !isObject(schema)) {
			throw new Error('Resource must include schema definition');
		}

		var options = v3 === undefined ? v2 || {} : v3;

		name = Resource.toResourceID(name);
		if (RESOURCES.has(name)) {
			throw new TypeError('Resource with the same name already exists.');
		}
		if (schema.hasOwnProperty('type') || schema.hasOwnProperty('id')) {
			throw new TypeError('Using reserved members in Resource schema.');
		}
		else {
			RESOURCES.set(name, this);
		}

		let RouterService = ServiceProvider.get('router');
		var strings = {
			toOne: RouterService.toUrlSingularForm(name),
			toMany: RouterService.toUrlPluralForm(name)
		};

		var routes = {
			resourceObject: {},
			relationships: []
		};

		let base = ServiceProvider.get('attributes').BASE_SCHEMA;
		schema = objects.merge(base, schema);
		schema = initializeSchema(this, schema);

		PRIVATE.set(this, {
			name,
			schema,
			strings,
			routes,
			version: options.version || '0.0.0',
			transport: options.transport
		});
	}

	static toResourceID(str) {
		var formatted = string.strategies.formatAsLowerCase(str);
		return string.pluralize(formatted, 1);
	}

	get name() { return PRIVATE.get(this).name }

	set transport(t) {
		if (!(t instanceof TransportInterface)) {
			throw new TypeError('Invalid transport type');
		}
		PRIVATE.get(this).transport = t;
	}

	find(key, params, callback) {
		let pm = PRIVATE.get(this);
		let transport = pm.transport;

		return new Promise((res, rej) => {
			props.transport.find(key, params, function (err, data) {
				if (err) rej(err);
				else res(toJsonApi(props.schema, data));
			});
		});
	};

	create() {
		return new Promise((res, rej) => {

		});
	}

	update() {}

	remove() {}
}

module.exports = Resource;

class ResourceService {
	static get Resource() { return Resource }

	static findResourceDefinitionByName(name) {
		let res = RESOURCES.get(Resource.toResourceID(name));
		if (!res) {
			throw new Error(`Resource '${res}' not found`);
		}
		return res;
	}

	static getResourceMembers(resource) {
		if (typeof resource === 'string') {
			resource = ResourceService.findResourceDefinitionByName(resource);
		}
		return PRIVATE.get(resource);
	}
}

ServiceProvider.set('resource', ResourceService);

function initializeSchema(resource, schema) {
	var definition = {};

	let instantiateAttribute = function (key, item) {
		let inst = new item.attr(key, resource, item.params || {});
		if (!(inst instanceof BaseAttribute)) {
			throw new TypeError('Not a BaseAttribute class constructor');
		}
		definition[key] = inst;
	};

	for(let key of Object.keys(schema)) {

		let item = schema[key];
		if (isFunction(item)) {
			item = {
				attr: item,
				params: null
			}
		}
		else if (!isFunction(item.attr)) {
			throw new TypeError('Not a BaseAttribute class constructor');
		}

		instantiateAttribute(key, item);
	}

	return definition;
}

function toJsonApi (schema, data) {
	if (json.id !== null) {
		return json;
	}

	for(let attr of objects.Iterator(schema)) {
		attr.toJsonApi(json, data);
	}
	return json;
}

function toData (resource, json) {
	return json;
}