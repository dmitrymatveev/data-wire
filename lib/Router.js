"use strict";

var string = require('./util/string');
var objects = require('./util/objects');
var Iterator = require('./util/objects').Iterator;
var Relationship = require('./attributes/Relationship');
var Resource = require('./Resource');
var ServiceProvider = require('./ServiceProvider');
var QueryParams = require('./QueryParams');
var ResourceLinks = require('./ResourceLinks');

let PRIVATE = new WeakMap();

let CONFIG = {
	formatFunction: string.strategies.formatAsDashed
};

const DEFAULT_PATH = 'api';
const DEFAULT_FORMAT = string.strategies.formatAsDashed;

class Router {

	constructor(params) {
		params = params || {};

		let path = params.path || DEFAULT_PATH;
		let links = new ResourceLinks(null, this);

		PRIVATE.set(this, {
			/** @type {Map<string, Resource>} */
			resources: new Map(),
			queryParams: QueryParams.createDefault(),
			formatFunction: DEFAULT_FORMAT,
			path,
			links
		});
	}

	get path() {return PRIVATE.get(this).path}
	get urlPrefix() {
		let path = PRIVATE.get(this).path;
		return path.length > 0 ? `${path}/` : '';
	}

	/** @type ResourceLinks */
	get links() {return PRIVATE.get(this).links};

	setUrlFormat(v) {
		let self = PRIVATE.get(this);
		let fnc = string.strategies[string.FORMAT[format]];
		if (!fnc) {
			throw new Error('Invalid format function.');
		}
		self.formatFunction = fnc;
	}

	toUrlFormat(v, count) {
		return PRIVATE.get(this).formatFunction(string.pluralize(v, count || 1));
	}

	/**
	 * @arguments {Resource[]|Resource} args
	 */
	use() {
		let resources = PRIVATE.get(this).resources;

		let attach = function (resource) {
			if (Resource.prototype.isPrototypeOf(resource)) {
				if (resources.has(resource.name)) {
					throw new Error('Resource already exists');
				}

				resources.set(resource, {
					query: null,
					links: null
				});
			}
			else {
				throw new TypeError('Not a resource type');
			}
		};

		var list = Array.isArray(arguments[0]) ? arguments[0] : arguments;
		for(let res of list) {
			attach(res);
		}
	}

	/** @returns {QueryParams} */
	get queryParams() { return PRIVATE.get(this).queryParams }

	/**
	 * @param {string} name
	 * @param {object} schema
	 * @param {object} [params]
	 * @returns {Resource}
	 */
	resource(name, schema, params) {
		let res = new Resource(name, schema, params);
		this.use(res);
		return res;
	}
}

module.exports = Router;

class RouterService {
	static setUrlFormat(format) {
		CONFIG.formatFunction = string.strategies[string.FORMAT[format]];
	}

	static toUrlSingularForm(value) {
		return CONFIG.formatFunction(string.pluralize(value, 1));
	}

	static toUrlPluralForm(value) {
		return CONFIG.formatFunction(string.pluralize(value, 2));
	}

	static buildResourceRoutes(router) {
		let pm = PRIVATE.get(router);

		for(let entry of pm.resources.entries()) {
			let resource = entry[0];
			let state = entry[1];

			state.links = resource.links.clone().mixin(router.links);
			state.links.build();

			state.query = resource.queryParams.clone().mixin(router.queryParams);
		}

		return pm.resources;
	}

	static getRouterResourceState(router, resource) {
		return PRIVATE.get(router).resources.get(resource.name);
	}
}

ServiceProvider.set('router', RouterService);