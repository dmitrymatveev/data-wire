"use strict";

var ServiceProvider = require('./ServiceProvider');
var isNullOrUndefined = require('util').isNullOrUndefined;
var copyObject = require('./util/objects').copy;

var PRIVATE = new WeakMap();

const LINK_TARGET = {
	RESOURCE_OBJECT: 'obj',
	RELATIONSHIP: 'rel'
};

class ResourceLinks {
	constructor(resource, router) {
		PRIVATE.set(this, {
			state: {
				resource: resource || null,
				router: router || null
			},
			path: null,
			options: {
				useSelfLinks: null,
				useRelationLinks: null
			},
			reference: {
				ToOne: null,
				ToMany: null
			},
			routes: {
				[LINK_TARGET.RESOURCE_OBJECT]: new Map(),
				[LINK_TARGET.RELATIONSHIP]: new Map()
			}
		});
	}

	get isValid() {
		let self = PRIVATE.get(this);
		return !(isNullOrUndefined(self.state.resource) || isNullOrUndefined(self.state.router));
	}

	get resource() {
		return PRIVATE.get(this).state.resource;
	}

	get router() {
		return PRIVATE.get(this).state.router;
	}

	get resourceRoutes() {
		return PRIVATE.get(this).routes[LINK_TARGET.RESOURCE_OBJECT];
	}

	get relationshipRoutes() {
		return PRIVATE.get(this).routes[LINK_TARGET.RELATIONSHIP];
	}

	clone() {
		let links = new ResourceLinks();
		copyObject(PRIVATE.get(this).state, PRIVATE.get(links).state);
		copyObject(PRIVATE.get(this).options, PRIVATE.get(links).options);
		return links;
	}

	mixin(links) {
		let self = PRIVATE.get(this);
		let mix = PRIVATE.get(links);

		if (isNullOrUndefined(self.state.resource) || isNullOrUndefined(mix)) {
			throw new Error('Invalid ResourceLinks mixin.');
		}

		mixinNullOrUndefined(mix.state, self.state);
		mixinNullOrUndefined(mix.options, self.options);
		return this;
	}

	setIncludeSelfLinks(v) {
		PRIVATE.get(this).options.useSelfLinks = v;
	}

	setIncludeRelationLinks(v) {
		PRIVATE.get(this).options.useRelationLinks = v;
	}

	get useSelfLinks() { return PRIVATE.get(this).options.useSelfLinks }
	get useRelationLinks() { return PRIVATE.get(this).options.useRelationLinks }

	static linkToCollection(id, related, routes) {
		let route = routes.get(related);
		return route ? route.collection(id) : null;
	}

	linkToSelf(id) {
		let route = this.resourceRoutes.get(this.resource);
		return route ? route.identifier(id) : null;
	}

	linkToRelatedObject(id, related) {
		return ResourceLinks.linkToCollection(id, related, this.resourceRoutes);
	}

	linkToRelationship(id, related) {
		return ResourceLinks.linkToCollection(id, related, this.relationshipRoutes);
	}
}

ResourceLinks.LINK_TARGET = LINK_TARGET;

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

function mixinNullOrUndefined (from, to) {
	for(let key of Object.keys(from)) {
		let next = to[key];
		if (isNullOrUndefined(next)) {
			to[key] = from[key];
		}
	}
}

function buildResourceObjectRoutes(links) {
	let paramID = `:${links.state.resource.urlID}`;
	links.routes[LINK_TARGET.RESOURCE_OBJECT].set(links.state.resource, {
		collection: () => {return links.path},
		identifier: (id) => {return `${links.path}/${id || paramID}`}
	});
}

function buildRelationshipsRoutes(links, attribute) {

	let relatedResource = attribute.getRelatedResource();
	let relatedLinks = PRIVATE.get(
		ServiceProvider.get('router').getRouterResourceState(
			links.state.router,
			relatedResource
		).links
	);

	let paramID = `:${links.state.resource.urlID}`;
	let reference = relatedLinks.reference[attribute.constructor.name];

	links.routes[LINK_TARGET.RESOURCE_OBJECT].set(relatedLinks.state.resource, {
		relatedLinks: links.state.resource,
		collection: (id) => {return `${links.path}/${id || paramID}/${reference}`}
	});

	links.routes[LINK_TARGET.RELATIONSHIP].set(relatedResource, {
		collection: (id) => {return `${links.path}/${id || paramID}/relationships/${reference}`}
	});
}