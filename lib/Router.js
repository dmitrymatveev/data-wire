"use strict";

var string = require('./util/string');
var objects = require('./util/objects');
var Iterator = require('./util/objects').Iterator;
var Relationship = require('./attributes/Relationship');
var Resource = require('./Resource');
var ServiceProvider = require('./ServiceProvider');
var QueryParams = require('./QueryParams');

let PRIVATE = new WeakMap();

let CONFIG = {
	formatFunction: string.strategies.formatAsDashed
};

const DEFAULT_PATH = 'api';

class Router {

	constructor(params) {
		params = params || {};
		PRIVATE.set(this, {
			/** @type {Map<string, Resource>} */
			resources: new Map(),
			path: params.path || DEFAULT_PATH,
			queryParams: new QueryParams()
		});
	}

	get path() {PRIVATE.get(this).path}

	/** @returns {QueryParams} */
	get queryParams() { return PRIVATE.get(this).queryParams }

	use() {
		let resources = PRIVATE.get(this).resources;

		let attach = function (resource) {
			if (Resource.prototype.isPrototypeOf(resource)) {
				if (resources.has(resource.name)) {
					throw new Error('Resource already exists');
				}

				let members = ServiceProvider.get('resource').getResourceMembers(resource);
				let routes = {resourceObject: {}, relationships: []};
				resources.set(resource.name, {resource, members, routes});
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

		for(let entry of pm.resources.values()) {
			buildRoutes(pm, entry);
		}

		return pm.resources;
	}
}

ServiceProvider.set('router', RouterService);

function buildRoutes(router, entry) {

	buildResourceObjectRoutes(router, entry);

	for(let attribute of Iterator(entry.members.schema)) {
		if (Relationship.prototype.isPrototypeOf(attribute)) {
			buildRelationshipsRoutes(router, entry, attribute);
		}
	}
}

function makeRoutesDescriptor(obj) {
	obj.find = obj.find || [];
	obj.create = obj.create || [];
	obj.update = obj.update || [];
	obj.remove = obj.remove || [];
	return obj;
}

function buildResourceObjectRoutes(router, entry) {

	let prefix = router.path.length > 0 ? `${router.path}/` : '';
	let resourceID = `:${entry.members.name}ID`;
	let path = `${prefix}${entry.members.strings.toMany}`;

	let routes = makeRoutesDescriptor(entry.routes.resourceObject);
	routes.create.push(path);
	routes.find.push(path);
	routes.find.push(`${path}/${resourceID}`);
	routes.remove.push(`${path}/${resourceID}`);
	routes.update.push(`${path}/${resourceID}`);
}

function buildRelationshipsRoutes(router, entry, attribute) {

	let prefix = router.path.length > 0 ? `${router.path}/` : '';
	let resourceID = `:${entry.members.name}ID`;
	let path = `${prefix}${entry.members.strings.toMany}`;
	let type = Relationship.ToOne.prototype.isPrototypeOf(attribute) ? 'toOne' : 'toMany';

	let routes = makeRoutesDescriptor({});
	entry.routes.relationships.push(routes);

	let related = router.resources.get(Resource.toResourceID(attribute.key));
	let reference = related.members.strings[type];
	let relation = makeRoutesDescriptor(related.routes.resourceObject);

	routes.find.push(`${path}/${resourceID}/relationships/${reference}`);
	relation.find.push(`${path}/${resourceID}/${reference}`);
	routes.create.push(`${path}/${resourceID}/relationships/${reference}`);
	routes.update.push(`${path}/${resourceID}/relationships/${reference}`);
	routes.remove.push(`${path}/${resourceID}/relationships/${reference}`);
}