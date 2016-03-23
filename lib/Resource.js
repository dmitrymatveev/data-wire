"use strict";

var isObject = require('util').isObject;
var Iterator = require('./util/objects').Iterator;
var string = require('./util/string');
var AbstractResourceController = require('./AbstractResourceController');
var ServiceProvider = require('./ServiceProvider');
var QueryParams = require('./QueryParams');
var ResourceLinks = require('./ResourceLinks');

var attributes = require('./attributes');

let RESOURCES = new Map();
let PRIVATE = new WeakMap();

let GLOBAL_CONTROLLER = null;
let RouterService = null;

class Resource extends AbstractResourceController {

	constructor(v1, v2, v3) {
		super();

		var name = Resource.toResourceID(typeof v1 === 'string' ? v1 : new.target.name);
		var schema = typeof v1 === 'string' ? v2 : v1;
		var options = v3 === undefined ? v2 || {} : v3;

		// temp... just handy for debug logs
		this._name = name;

		if (RESOURCES.has(name)) {
			throw new Error('Resource with the same name already exists.');
		}

		if (!schema || !isObject(schema)) {
			throw new Error('Resource must include schema definition');
		}

		RESOURCES.set(name, this);
		PRIVATE.set(this, {
			name,
			schema: attributes.createSchemaDefinition(this, schema),
			links: new ResourceLinks(this),
			version: options.version || '0.0.0',
			controller: options.controller || GLOBAL_CONTROLLER,
			queryParams: new QueryParams()
		});

		RouterService = RouterService || ServiceProvider.get('router');
	}

	static toResourceID(str) {
		var formatted = string.strategies.formatAsLowerCase(str);
		return string.pluralize(formatted, 1);
	}

	get name() { return PRIVATE.get(this).name }
	get urlID() { return `${this.name}ID` }
	get queryParams() { return PRIVATE.get(this).queryParams }
	get links() { return PRIVATE.get(this).links }
	get version() { return PRIVATE.get(this).version }

	get eachRelationship() {
		let schema = PRIVATE.get(this).schema;
		return attributes.createRelationshipsIterator(schema);
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
		let controller = Resource.getControllerForResource(this);
		return function (ctx, params, query, callback) {
			controller.find(type, params, query, function (err, data) {
				if (err) callback(err);
				else toJsonApi(type, ctx, data, callback);
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

function toJsonApi (resource, ctx, obj, callback) {
	let result = {};

	if (!obj || !obj.data || obj.data.length <= 0) {
		return result;
	}

	let err = parseResourceIdentifierObject(resource, ctx, result, obj);
	if (err) return callback(err);

	err = parseIncludedResources(ctx, result, obj);
	if (err) return callback(err);

	callback(null, result);
}

function parseDataObject(ctx, resource, data) {
	let result = {};
	for(let next of Iterator(PRIVATE.get(resource).schema)) {
		if (!next.toJsonApi(ctx, result, data)) {
			return result;
		}
	}
	return result;
}

function parseResourceIdentifierObject(resource, ctx, destination, obj) {

	if (Array.isArray(obj.data)) {
		destination.data = [];
		for(let item of obj.data) {
			let next = parseDataObject(ctx, resource, item);
			if (next === false) {
				return new Error(`Error parsing ${resource.name}`);
			}
			else {
				destination.data.push(next);
			}
		}
	}
	else if (isObject(obj.data)) {
		let next = parseDataObject(ctx, resource, obj.data);
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

function parseIncludedResources(ctx, destination, obj) {

	if (Array.isArray(obj.included)) {
		destination.included = [];
		for(let item of obj.included) {

			// TODO: optimize related resource lookup.
			let related = RESOURCES.get(item.type);
			let relatedCtx = RouterService.getRouterResourceState(ctx.links.router, related);

			let next = parseDataObject(relatedCtx, related, item);
			if (next === false) {
				return new Error(`Error parsing ${related.name}`);
			}
			else {
				destination.included.push(next);
			}
		}
	}
}