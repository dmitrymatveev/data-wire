"use strict";

var BaseAttribute = require('./BaseAttribute');
var Data = require('./Data');
var Identifier = require('./Identifier');
var Relationship = require('./Relationship');

var objects = require('../util/objects');
var isFunction = require('util').isFunction;

const BASE_SCHEMA = {
	type: {
		attr: Identifier,
		params: {
			default: (res) => {return res.name}
		}
	},
	id: Identifier,
	meta: Identifier,
	links: {
		attr: Identifier,
		params: {
			optional: (ctx, dest, data) => {
				if (ctx.links.useSelfLinks) {
					dest.links = dest.links || {};
					dest.links.self = ctx.links.linkToSelf(data.id);
				}
			}
		}
	}
};

module.exports = {
	BaseAttribute,
	Data,
	Identifier,
	Relationship,

	get RESERVED_ATTRIBUTE_NAMES() {
		return Object.keys(BASE_SCHEMA);
	},

	createSchemaDefinition(resource, mixin) {
		let schema = objects.merge(objects.copy(BASE_SCHEMA, {}), mixin);
		return initializeSchema(resource, schema);
	},

	createRelationshipsIterator(schema) {
		let keys = Object.keys(schema);
		let index = 0;
		let isRelationship = Relationship.prototype.isPrototypeOf.bind(Relationship.prototype);

		return {
			[Symbol.iterator]() {return this},
			next: function next() {
				if (index < keys.length) {
					let value = schema[keys[index++]];
					return isRelationship(value) ? {value, done:false} : next();
				}
				else return {done: true};
			}
		}
	}
};

function initializeSchema(resource, schema) {
	var definition = {};

	let instantiateAttribute = function (key, item) {
		let inst = new item.attr(key, resource, item.params || {});
		if (!(inst instanceof BaseAttribute)) {
			throw new TypeError('Not a BaseAttribute class constructor');
		}
		definition[key] = inst;
	};

	for(let key of Object.keys(schema)) {

		let item = schema[key];
		if (isFunction(item)) {
			item = {
				attr: item,
				params: null
			}
		}
		else if (!isFunction(item.attr)) {
			throw new TypeError('Not a BaseAttribute class constructor');
		}

		instantiateAttribute(key, item);
	}

	return definition;
}