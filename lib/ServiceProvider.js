"use strict";

let object = require('./util/objects');
let SERVICES = new Map();

module.exports = {
	has(name) { return SERVICES.has(name) },

	get(serviceName) {
		var service = SERVICES.get(serviceName);
		if (!service) {
			throw new Error(`Service '${serviceName}' does not exist.`);
		}
		return service;
	},

	set(name, service) {
		if (SERVICES.has(name)) {
			throw new Error(`Service '${name}' already registered.`);
		}
		SERVICES.set(name, service);
	},

	add(name, service) {
		if (this.has(name)) {
			object.merge(this.get(name), service);
		}
		else {
			this.set(name, service);
		}
	}
};