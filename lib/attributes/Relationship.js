"use strict";

var Data = require('./Data');
var ServiceProvider = require('../ServiceProvider');
var klass = require('../util/klass');

let ResourceService = null;
let PRIVATE = new WeakMap();

const RES_ID = 'resID';
const RELATIONSHIPS = 'relationships';

class Relationship extends Data {
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
			let resID = getResourceService().Resource.toResourceID(this.params[RES_ID] || this.key);
			pm.related = ResourceService.findResourceByName(resID);
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

	static as(attr, asResource) {
		return {attr, params: {[RES_ID]:asResource}}
	}
}

class ToOne extends Relationship {
	constructor(k, r, p) {
		klass.final('ToOne', new.target.name);
		super(k, r, p);
	}

	static as(asResource) {
		return Relationship.as(ToOne, asResource);
	}

	toJsonApi(ctx, destination, data) {
		let key = this.key;
		let value = data[key];
		// Make sure value is not propagated as a collection in a ToOne relationship.
		if (Array.isArray(value)) {
			value = value[0];
		}

		let related = this.getRelatedResource();

		if (value === undefined && ctx.state.links.options.useLinks) {
			let relatedCollection = ctx.state.links.routes.resourceObject.get(related).collection;
			let ref = getRelationshipsMember(destination, key);
			let links = ref.links = ref.links || {};
			links.related = relatedCollection(data.id);
		}
		else if (value === null) {
			let ref = getRelationshipsMember(destination, key);
			ref.data = null;
		}
		else {
			let ref = getRelationshipsMember(destination, key);
			ref.data = {type: related.name, id: value};
		}
	}
}

class ToMany extends Relationship {
	constructor(k, r, p) {
		klass.final('ToMany', new.target.name);
		super(k, r, p);
	}

	static as(asResource) {
		return Relationship.as(ToMany, asResource);
	}

	toJsonApi(ctx, destination, data) {
		let key = this.key;
		let list = data[key];
		let related = this.getRelatedResource();

		if (list === undefined && ctx.state.links.isGenerateLinks) {
			createRelationshipLinks(related, destination, key);
		}
		else if (!list || list.length <= 0) {
			let ref = getRelationshipsMember(destination, key);
			ref.data = [];
		}
		else {
			let type = related.name;
			let ref = getRelationshipsMember(destination, key);

			if (list.length > 0) {
				ref.data = [];
				for(let id of list) {
					ref.data.push({type, id});
				}
			}
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

function getRelationshipsMember(root, key) {
	let relationship = root[RELATIONSHIPS] ? root[RELATIONSHIPS] : root[RELATIONSHIPS] = {};
	return relationship[key] ? relationship[key] : relationship[key] = {};
}

function createRelationshipLinks(related, destination, key) {
	let relatedCollection = ctx.state.links.routes.resourceObject.get(related).collection;
	let ref = getRelationshipsMember(destination, key);
	let links = ref.links = ref.links || {};
	links.related = relatedCollection(data.id);
}