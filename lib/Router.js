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

class Router {

	constructor() {
		PRIVATE.set(this, {
			/** @type {Map<string, Resource>} */
			resources: new Map()
		})
	}

	use(resource) {
		let resources = PRIVATE.get(this).resources;

		if (resource instanceof Resource) {

			if (resources.has(resource.name)) {
				throw new Error('Resource already exists');
			}

			resources.set(resource.name, resource);
		}
		else {
			throw new TypeError('Not a resource type');
		}
	}

	/**
	 * @param {ServerInterface} toServer
	 */
	attach(toServer) {
		let resources = PRIVATE.get(this).resources;

		for(let it of resources.entries()) {
			buildRoutes(it[1]);
		}

		for(let it of resources.entries()) {
			registerResourceRoutes(toServer, it[1]);
			registerRelationshipsRoutes(toServer, it[1]);
		}
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
}

ServiceProvider.set('router', RouterService);

function buildRoutes(resource) {
	// resource private members
	var rpm = ServiceProvider.get('resource').getResourceMembers(resource);

	buildResourceObjectRoutes(rpm);
	for(let item of Iterator(rpm.schema)) {
		if (item instanceof Relationship) {
			buildRelationshipsRoutes(rpm, item)
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

function buildResourceObjectRoutes(self) {

	let resourceID = `:${self.name}ID`;
	let path = `${self.strings.toMany}`;
	let routes = makeRoutesDescriptor(self.routes.resourceObject);

	routes.create.push(path);
	routes.find.push(path);
	routes.find.push(`${path}/${resourceID}`);
	routes.remove.push(`${path}/${resourceID}`);
	routes.update.push(`${path}/${resourceID}`);
}

function buildRelationshipsRoutes(self, attr) {

	let resourceID = `:${self.name}ID`;
	let path = `${self.strings.toMany}`;
	let type = attr instanceof Relationship.ToOne ? 'toOne' : 'toMany';

	let routes = makeRoutesDescriptor({});
	self.routes.relationships.push(routes);

	let related = ServiceProvider.get('resource').getResourceMembers(attr.key);
	let reference = related.strings[type];
	let relation = makeRoutesDescriptor(related.routes.resourceObject);

	routes.find.push(`${path}/${resourceID}/relationships/${reference}`);
	relation.find.push(`${path}/${resourceID}/${reference}`);

	routes.create.push(`${path}/${resourceID}/relationships/${reference}`);

	routes.update.push(`${path}/${resourceID}/relationships/${reference}`);

	routes.remove.push(`${path}/${resourceID}/relationships/${reference}`);
}

function registerResourceRoutes(server, resource) {
	let pm = ServiceProvider.get('resource').getResourceMembers(resource);
	let version = pm.version;
	let routes = pm.routes.resourceObject;

	let find = function (req, res, next) {
		next();
	};

	let create = function (req, res, next) {

	};

	let update = function (req, res, next) {

	};

	let remove = function (req, res, next) {

	};

	for(let path of routes.find) {
		server.GET({path, version}, find);
	}

	for(let path of routes.create) {
		server.POST({path, version}, create);
	}

	for(let path of routes.update) {
		server.PATCH({path, version}, update);
	}

	for(let path of routes.remove) {
		server.DELETE({path, version}, remove);
	}
}

function registerRelationshipsRoutes(server, resource) {
	let pm = ServiceProvider.get('resource').getResourceMembers(resource);
	let version = pm.version;

	let find = function (req, res, next) {
		next();
	};

	let create = function (req, res, next) {

	};

	let update = function (req, res, next) {

	};

	let remove = function (req, res, next) {

	};

	pm.routes.relationships.forEach(function (routes) {
		for(let path of routes.find) {
			server.GET({path, version}, find);
		}

		for(let path of routes.create) {
			server.POST({path, version}, create);
		}

		for(let path of routes.update) {
			server.PATCH({path, version}, update);
		}

		for(let path of routes.remove) {
			server.DELETE({path, version}, remove);
		}
	});
}