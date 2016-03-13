"use strict";

var ServiceProvider = require('./ServiceProvider');
var isNullOrUndefined = require('util').isNullOrUndefined;

var PRIVATE = new WeakMap();

class ResourceLinks {
	constructor(resource, router) {
		PRIVATE.set(this, {
			state: {
				useLinks: null,
				resource: resource || null,
				router: router || null
			},
			path: null,
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
		let self = PRIVATE.get(this);
		for(let key of Object.keys(self)) {
			PRIVATE.get(links)[key] = self[key];
		}
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

	build() {
		let self = PRIVATE.get(this);
		if (!this.isValid) {
			throw new Error('Invalid ResourceObject state.')
		}

		let router = self.state.router;
		let resource = self.state.resource;

		self.reference.ToOne = router.toUrlFormat(resource.name);
		self.reference.ToMany = router.toUrlFormat(resource.name, 2);
		self.path = `${router.urlPrefix}${self.reference.ToMany}`;

		buildResourceObjectRoutes(self);

		for(let attribute of resource.eachRelationship) {
			buildRelationshipsRoutes(self, attribute);
		}
	}

	setGenerateLinks(v) {
		PRIVATE.get(this).useLinks = v;
	}
}

module.exports = ResourceLinks;

function buildResourceObjectRoutes(links) {
	links.routes.resourceObject.set(links.state.resource, {
		collection: links.path,
		identifier: `${links.path}/:${links.state.resource.urlID}`
	});
}

function buildRelationshipsRoutes(links, attribute) {

	let path = `${links.path}/:${links.state.resource.urlID}`;
	let reference = links.reference[attribute.constructor.name];
	let related = attribute.getRelatedResource();

	links.routes.resourceObject.set(related, {
		related: links.state.resource,
		collection: `${path}/${reference}`
	});

	links.routes.relationships.set(related, {
		collection: `${path}/relationships/${reference}`
	});
}