"use strict";

var BaseAttribute = require('./BaseAttribute');
var ServiceProvider = require('../ServiceProvider');
var klass = require('../util/klass');

let ResourceService = null;
let PRIVATE = new WeakMap();

class Relationship extends BaseAttribute {
	constructor(key, resource, params) {
		super(key, resource, params);
		klass.abstract('Relationship', new.target.name);
		PRIVATE.set(this, {
			related: null
		});
	}

	getRelatedResource() {
		let pm = PRIVATE.get(this);
		if (!pm.related) {
			pm.related = getResourceService().findResourceByName(
				ResourceService.Resource.toResourceID(this.key)
			);
		}
		return pm.related;
	}

	static getRelatedResource(resource, memberName) {
		let schema = getResourceService().getResourceMembers(resource).schema;
		let member = schema[memberName];

		if (!member || !Relationship.prototype.isPrototypeOf(member)) {
			return null;
		}
		else {
			return member.getRelatedResource();
		}
	}
}

class ToOne extends Relationship {
	constructor(k, r, p) {
		klass.final('ToOne', new.target.name);
		super(k, r, p);
	}

	toJsonApi(router, destination, data) {
		let relationships = destination.relationships = destination.relationships || {};
		let ref = relationships[this.key] = {};
		let value = data[this.key];

		if (value === undefined) {
			let links = ref.links = ref.links || {};
			//links.self = "relationship/link";
			links.related = "related/object/link";
			return;
		}
		else if (value === null) {
			ref.data = null;
			return;
		}

		ref.data = {
			type: this.getRelatedResource().name,
			id: data[this.key]
		}
	}
}

class ToMany extends Relationship {
	constructor(k, r, p) {
		klass.final('ToMany', new.target.name);
		super(k, r, p);
	}

	toJsonApi(router, destination, data) {
		let relationships = destination.relationships = destination.relationships || {};
		let ref = relationships[this.key] = {};
		let list = data[this.key];

		let related = this.getRelatedResource();
		let members = ServiceProvider.get('router').getRouterResourceState(router, related);

		if (list === undefined) {
			let links = ref.links = ref.links || {};
			//links.self = "relationship/link";
			links.related = "related/object/link";
			return;
		}
		else if (!list || list.length <= 0) {
			ref.data = [];
			return;
		}

		let type = related.name;
		ref.data = [];
		for(let id of list) {
			ref.data.push({type, id});
		}
	}

}

Relationship.ToOne = ToOne;
Relationship.ToMany = ToMany;
module.exports = Relationship;

function getResourceService() {
	if (!ResourceService) {
		ResourceService = ServiceProvider.get('resource');
	}
	return ResourceService;
}