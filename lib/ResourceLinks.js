"use strict";

var ServiceProvider = require('./ServiceProvider');
var isNullOrUndefined = require('util').isNullOrUndefined;
var copyObject = require('./util/objects').copy;

var PRIVATE = new WeakMap();

class ResourceLinks {
	constructor(resource, router) {
		PRIVATE.set(this, {
			state: {
				resource: resource || null,
				router: router || null
			},
			path: null,
			options: {
				useLinks: null
			},
			reference: {
				ToOne: null,
				ToMany: null
			},
			routes: {
				resourceObject: new Map(),
				relationships: new Map()
			}
		});
	}

	get isValid() {
		let self = PRIVATE.get(this);
		return !(isNullOrUndefined(self.state.resource) || isNullOrUndefined(self.state.router));
	}

	get routes() {
		return PRIVATE.get(this).routes;
	}

	clone() {
		let links = new ResourceLinks();
		copyObject(PRIVATE.get(this).state, PRIVATE.get(links).state);
		return links;
	}

	mixin(links) {
		let self = PRIVATE.get(this).state;
		let mix = PRIVATE.get(links).state;

		if (isNullOrUndefined(self.resource) || isNullOrUndefined(mix)) {
			throw new Error('Invalid ResourceLinks mixin.');
		}

		for(let key of Object.keys(self)) {
			self[key] = isNullOrUndefined(self[key]) ? mix[key] : self[key];
		}
		return this;
	}

	setGenerateLinks(v) {
		PRIVATE.get(this).options.useLinks = v;
	}

	get isGenerateLinks() {
		return PRIVATE.get(this).options.useLinks;
	}
}

class ResourceLinksService {
	static initialize(links) {
		let self = PRIVATE.get(links);
		if (!links.isValid) {
			throw new Error('Invalid ResourceObject state.')
		}

		let router = self.state.router;
		let resource = self.state.resource;

		self.reference.ToOne = router.toUrlFormat(resource.name);
		self.reference.ToMany = router.toUrlFormat(resource.name, 2);
		self.path = `${router.urlPrefix}${self.reference.ToMany}`;
	}

	static build(links) {
		let self = PRIVATE.get(links);
		if (!links.isValid) {
			throw new Error('Invalid ResourceObject state.')
		}

		buildResourceObjectRoutes(self);
		for(let attribute of self.state.resource.eachRelationship) {
			buildRelationshipsRoutes(self, attribute);
		}
	}
}

ServiceProvider.set('links', ResourceLinksService);

module.exports = ResourceLinks;

function buildResourceObjectRoutes(links) {
	let paramID = `:${links.state.resource.urlID}`;
	links.routes.resourceObject.set(links.state.resource, {
		collection: () => {return links.path},
		identifier: (id) => {return `${links.path}/${id || paramID}`}
	});
}

function buildRelationshipsRoutes(links, attribute) {

	let related = PRIVATE.get(
		ServiceProvider.get('router').getRouterResourceState(
			links.state.router,
			attribute.getRelatedResource()
		).links
	);

	let paramID = `:${links.state.resource.urlID}`;
	let reference = related.reference[attribute.constructor.name];

	links.routes.resourceObject.set(related.state.resource, {
		related: links.state.resource,
		collection: (id) => {return `${links.path}/${id || paramID}/${reference}`}
	});

	links.routes.relationships.set(related, {
		collection: (id) => {return `${links.path}/${id || paramID}/relationships/${reference}`}
	});
}