"use strict";

var klass = require('./util/klass');
var Resource = require('./Resource');
var Router = require('./Router');
var ServiceProvider = require('./ServiceProvider');
var AbstractHttpTransport = require('./AbstractHttpTransport');

const DEFAULT_ROUTER = 'api';
let ROUTERS = new Map();

class DataWire {
	constructor() {
		klass.static('Main');
	}

	static setGlobalController(controller) {
		Resource.setGlobalController(controller);
	}

	/**
	 * @param {string} [path]
	 * @returns {Router}
	 */
	static getRouter(path) {
		path = path ? path : DEFAULT_ROUTER;
		if (ROUTERS.has(path)) {
			return ROUTERS.get(path);
		}
		else {
			let router = new Router({path});
			ROUTERS.set(path, router);
			return router;
		}
	}

	static addRouter(router) {
		if (ROUTERS.has(router.path)) {
			throw new Error(`Router '/${router.path}' already in use.`)
		}
		ROUTERS.set(router.path, router);
	}

	static build(httpTransport) {

		if (!AbstractHttpTransport.prototype.isPrototypeOf(httpTransport)) {
			throw new TypeError('Must be an instance of AbstractHttpTransport.');
		}

		let RouterService = ServiceProvider.get('router');
		let HttpService = ServiceProvider.get('http');

		for(let router of ROUTERS.values()) {
			let resources = RouterService.buildResourceRoutes(router);

			for(let entry of resources.entries()) {
				let resource = entry[0];
				let state = entry[1];
				HttpService.useResourceRoutes(httpTransport, router, resource, state);
			}
		}
	}
}

module.exports = DataWire;