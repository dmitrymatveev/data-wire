"use strict";

var string = require('./util/string');
var objects = require('./util/objects');
var Iterator = require('./util/objects').Iterator;
var Relationship = require('./attributes/Relationship');
var Resource = require('./Resource');
var ServiceProvider = require('./ServiceProvider');

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
			path: params.path || DEFAULT_PATH
		});
	}

	get path() {PRIVATE.get(this).path}

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
	let resourceID = `:${entry.resource.urlID}`;
	let path = `${prefix}${entry.members.strings.toMany}`;

	let routes = makeRoutesDescriptor(entry.routes.resourceObject);
	routes.create.push({path});
	routes.find.push({path});
	routes.find.push({path:`${path}/${resourceID}`});
	routes.remove.push({path:`${path}/${resourceID}`});
	routes.update.push({path:`${path}/${resourceID}`});
}

function buildRelationshipsRoutes(router, entry, attribute) {

	let prefix = router.path.length > 0 ? `${router.path}/` : '';
	let path = `${prefix}${entry.members.strings.toMany}/:${entry.resource.urlID}`;
	let type = Relationship.ToOne.prototype.isPrototypeOf(attribute) ? 'toOne' : 'toMany';

	let routes = makeRoutesDescriptor({});
	entry.routes.relationships.push(routes);

	let relatedResource = router.resources.get(Resource.toResourceID(attribute.key));
	let relation = relatedResource.resource;

	let referencePath = relatedResource.members.strings[type];
	let relationshipsPath = `${path}/relationships/${referencePath}`;

	let relatedRoute = makeRoutesDescriptor(relatedResource.routes.resourceObject);
	relatedRoute.find.push({path:`${path}/${referencePath}`, relation});

	routes.find.push({path: relationshipsPath, relation});
	routes.create.push({path: relationshipsPath, relation});
	routes.update.push({path: relationshipsPath, relation});
	routes.remove.push({path: relationshipsPath, relation});
}