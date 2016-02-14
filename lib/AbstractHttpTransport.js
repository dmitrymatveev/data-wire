"use strict";

var ServiceProvider = require('./ServiceProvider');

class AbstractHttpTransport {
	GET(params, callback) {throw new TypeError('Not implemented')};
	POST(params, callback) {throw new TypeError('Not implemented')};
	PATCH(params, callback) {throw new TypeError('Not implemented')};
	DELETE(params, callback) {throw new TypeError('Not implemented')};
	getQueryParams(req) {throw new TypeError('Not implemented')}
}

ServiceProvider.set('http', {
	useResourceRoutes(server, resource) {
		resourceObjectRoutes(server, resource);
		relationshipsRoutes(server, resource);
	}
});

module.exports = AbstractHttpTransport;

function resourceObjectRoutes(server, resource) {
	//let pm = ServiceProvider.get('resource').getResourceMembers(resource);
	let version = resource.members.version;
	let routes = resource.routes.resourceObject;
	let cb = createResourceObjectCallbacks(resource);

	for(let path of routes.find) {
		server.GET({path, version}, cb.find);
	}

	for(let path of routes.create) {
		server.POST({path, version}, cb.create);
	}

	for(let path of routes.update) {
		server.PATCH({path, version}, cb.update);
	}

	for(let path of routes.remove) {
		server.DELETE({path, version}, cb.remove);
	}
}

function relationshipsRoutes(server, resource) {
	let version = resource.members.version;
	let cb = createRelationshipsCallbacks(resource);

	resource.routes.relationships.forEach(function (routes) {
		for(let path of routes.find) {
			server.GET({path, version}, cb.find);
		}

		for(let path of routes.create) {
			server.POST({path, version}, cb.create);
		}

		for(let path of routes.update) {
			server.PATCH({path, version}, cb.update);
		}

		for(let path of routes.remove) {
			server.DELETE({path, version}, cb.remove);
		}
	});
}

function createResourceObjectCallbacks(resource) {

	let find = function (req, res, next) {
		console.log();
		res.send(200)
	};

	let create = function () {

	};

	let update = function () {

	};

	let remove = function () {

	};

	return {find, create, update, remove};
}

function createRelationshipsCallbacks(resource) {
	let pm = ServiceProvider.get('resource').getResourceMembers(resource);

	let find = function () {

	};

	let create = function () {

	};

	let update = function () {

	};

	let remove = function () {

	};

	return {find, create, update, remove};
}