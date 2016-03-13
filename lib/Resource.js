"use strict";

var isObject = require('util').isObject;
var isFunction = require('util').isFunction;
var objects = require('./util/objects');
var string = require('./util/string');
var AbstractResourceController = require('./AbstractResourceController');
var ServiceProvider = require('./ServiceProvider');
var QueryParams = require('./QueryParams');
var ResourceLinks = require('./ResourceLinks');

var BaseAttribute = require('./attributes/BaseAttribute');
var Identifier = require('./attributes/Identifier');
var Relationship = require('./attributes/Relationship');

var RESOURCES = new Map();
var PRIVATE = new WeakMap();

let GLOBAL_CONTROLLER = null;

class Resource extends AbstractResourceController {

	constructor(v1, v2, v3) {
		super();
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

		schema = objects.merge(Identifier.BASE_SCHEMA, schema);
		schema = initializeSchema(this, schema);

		PRIVATE.set(this, {
			name,
			schema,
			strings,
			links: new ResourceLinks(this),
			version: options.version || '0.0.0',
			controller: options.controller || GLOBAL_CONTROLLER,
			queryParams: new QueryParams()
		});

		this._name = name;
	}

	static toResourceID(str) {
		var formatted = string.strategies.formatAsLowerCase(str);
		return string.pluralize(formatted, 1);
	}

	get name() { return PRIVATE.get(this).name }
	get urlID() { return `${this.name}ID` }
	/** @type QueryParams */
	get queryParams() { return PRIVATE.get(this).queryParams }
	/** @type ResourceLinks */
	get links() { return PRIVATE.get(this).links }

	get version() { return PRIVATE.get(this).version }

	get eachRelationship() {
		let schema = PRIVATE.get(this).schema;
		let keys = Object.keys(schema);
		let index = 0;

		let next = function () {
			if (index < keys.length) {
				let value = schema[keys[index++]];
				return Relationship.prototype.isPrototypeOf(value) ? {value} : next();
			}
			else return {done: true};
		};

		return {
			[Symbol.iterator]() {return this},
			next
		}
	}


	static getGlobalController() { return GLOBAL_CONTROLLER; }

	static setGlobalController(controller) {
		if (!AbstractResourceController.prototype.isPrototypeOf(controller)) {
			throw new TypeError('Invalid ResourceControllerInterface');
		}
		GLOBAL_CONTROLLER = controller;
	}

	static getControllerForResource(resource) {
		let pm = PRIVATE.get(resource);
		let controller = pm.controller || GLOBAL_CONTROLLER;
		if (!controller) {
			throw new Error(`Controller for ${pm.name} not found.`);
		}
		return controller;
	}

	setController(controller) {
		if (!AbstractResourceController.prototype.isPrototypeOf(controller)) {
			throw new TypeError('Invalid ResourceControllerInterface');
		}
		let pm = PRIVATE.get(this);
		pm._builtQueryParams = null;
		pm.controller = controller;
	}

	find() {
		let type = this;
		let pm = PRIVATE.get(this);
		let controller = Resource.getControllerForResource(this);
		return function (router, params, query, callback) {
			controller.find(type, params, query, function (err, data) {
				if (err) callback(err);
				else toJsonApi(router, pm, data, callback);
			});
		}
	}

	create() {
		let type = this;
		let pm = PRIVATE.get(this);
		let controller = Resource.getControllerForResource(this);
		return function (params, query, callback) {
			controller.create(type, params, query, function (err, data) {
				if (err) callback(err);
				else toJsonApi(pm, data, callback);
			});
		}
	}

	update() {
		let type = this;
		let pm = PRIVATE.get(this);
		let controller = Resource.getControllerForResource(this);
		return function (params, query, callback) {
			controller.update(type, params, query, function (err, data) {
				if (err) callback(err);
				else toJsonApi(pm, data, callback);
			});
		}
	}

	remove() {
		let type = this;
		let pm = PRIVATE.get(this);
		let controller = Resource.getControllerForResource(this);
		return function (params, query, callback) {
			controller.remove(type, params, query, function (err, data) {
				if (err) callback(err);
				else toJsonApi(pm, data, callback);
			});
		}
	}
}

module.exports = Resource;

class ResourceService {
	static get Resource() { return Resource }

	static findResourceByName(name) {
		let resourceID = Resource.toResourceID(name);
		let resource = RESOURCES.get(resourceID);
		if (!resource) {
			throw new Error(`Resource '${resourceID}' not found`);
		}
		return resource;
	}

	static getResourceMembers(resource) {
		if (typeof resource === 'string') {
			resource = ResourceService.findResourceByName(resource);
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

function toJsonApi (router, resource, obj, callback) {
	let result = {};

	if (!obj || !obj.data || obj.data.length <= 0) {
		return result;
	}

	let err = parseResourceIdentifierObject(router, result, resource, obj);
	if (err) return callback(err);

	err = parseIncludedResources(router, result, resource, obj);
	if (err) return callback(err);

	callback(null, result);
}

function parseDataObject(router, resource, data) {
	let result = {};
	for(let next of objects.Iterator(resource.schema)) {
		next.toJsonApi(router, result, data);
	}
	return result;
}

function parseResourceIdentifierObject(router, destination, resource, obj) {

	if (Array.isArray(obj.data)) {
		destination.data = [];
		for(let item of obj.data) {
			let next = parseDataObject(router, resource, item);
			if (next === false) {
				return new Error(`Error parsing ${resource.name}`);
			}
			else {
				destination.data.push(next);
			}
		}
	}
	else if (isObject(obj.data)) {
		let next = parseDataObject(router, resource, obj.data);
		if (next === false) {
			return new Error(`Error parsing ${resource.name}`);
		}
		else {
			destination.data = next;
		}
	}
	else {
		return new Error(`Error parsing ${resource.name}`);
	}

	return null;
}

function parseIncludedResources(router, destination, resource, obj) {

	if (Array.isArray(obj.included)) {
		destination.included = [];
		for(let item of obj.included) {

			// TODO: optimize related resource lookup.
			let related = ResourceService.getResourceMembers(item.type);

			let next = parseDataObject(router, related, item);
			if (next === false) {
				return new Error(`Error parsing ${related.name}`);
			}
			else {
				destination.included.push(next);
			}
		}
	}
}