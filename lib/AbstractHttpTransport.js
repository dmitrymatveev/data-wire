"use strict";

var ServiceProvider = require('./ServiceProvider');
var QueryParams = require('./QueryParams');

class AbstractHttpTransport {
	GET(params, callback) {throw new TypeError('Not implemented')};
	POST(params, callback) {throw new TypeError('Not implemented')};
	PATCH(params, callback) {throw new TypeError('Not implemented')};
	DELETE(params, callback) {throw new TypeError('Not implemented')};
	getQueryParams(req) {throw new TypeError('Not implemented')}
}

ServiceProvider.set('http', {
	useResourceRoutes(server, router, resource) {

		let query = QueryParams.createMerged(
			resource.members.queryParams,
			router.queryParams
		);

		resourceObjectRoutes(server, resource, query);
		relationshipsRoutes(server, resource, query);
	}
});

module.exports = AbstractHttpTransport;

function resourceObjectRoutes(server, resource, query) {
	let version = resource.members.version;
	let routes = resource.routes.resourceObject;
	let cb = createResourceObjectCallbacks(server, resource);

	let before = beforeStack(server, resource, query);
	let after = afterStack(server, resource, query);

	for(let path of routes.find) {
		server.GET({path, version}, [before, cb.find, after]);
	}

	for(let path of routes.create) {
		server.POST({path, version}, [before, cb.create, after]);
	}

	for(let path of routes.update) {
		server.PATCH({path, version}, [before, cb.update, after]);
	}

	for(let path of routes.remove) {
		server.DELETE({path, version}, [before, cb.remove, after]);
	}
}

function relationshipsRoutes(server, resource, query) {
	let version = resource.members.version;
	let cb = createRelationshipsCallbacks(server, resource);

	let before = beforeStack(server, resource, query);
	let after = afterStack(server, resource, query);

	resource.routes.relationships.forEach(function (routes) {
		for(let path of routes.find) {
			server.GET({path, version}, [before, cb.find, after]);
		}

		for(let path of routes.create) {
			server.POST({path, version}, [before, cb.create, after]);
		}

		for(let path of routes.update) {
			server.PATCH({path, version}, [before, cb.update, after]);
		}

		for(let path of routes.remove) {
			server.DELETE({path, version}, [before, cb.remove, after]);
		}
	});
}

function beforeStack(server, resource, query) {
	let isValidQuery = query.createQueryValidationFunction();
	return function (req, res, next) {
		let params = server.getQueryParams(req);
		let valid = isValidQuery(params);
		if (!valid) return res.send(400, 'Invalid query params');
		else next();
	}
}

function afterStack(server, response, query) {
	return [];
}

function createResourceObjectCallbacks(server, resource) {

	let find = function (req, res, next) {
		res.send('done');
	};

	let create = function () {

	};

	let update = function () {

	};

	let remove = function () {

	};

	return {find, create, update, remove};
}

function createRelationshipsCallbacks(server, resource) {
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