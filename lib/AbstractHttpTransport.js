"use strict";

var ServiceProvider = require('./ServiceProvider');
var QueryParams = require('./QueryParams');

var arrays = require('./util/arrays');
var objects = require('./util/objects');

class AbstractHttpTransport {
	GET(params, callback) {throw new TypeError('Not implemented')};
	POST(params, callback) {throw new TypeError('Not implemented')};
	PATCH(params, callback) {throw new TypeError('Not implemented')};
	DELETE(params, callback) {throw new TypeError('Not implemented')};

	getQueryParams(req) {throw new TypeError('Not implemented')};
	getUrlParams(req) {throw new TypeError('Not implemented')};
	getResultData(req) {throw new TypeError('Not implemented')};
}

ServiceProvider.set('http', {
	useResourceRoutes(server, router, resource, state) {
		let params = {server, router, resource, state};
		resourceObjectRoutes(params);
		relationshipsRoutes(params);
	}
});

module.exports = AbstractHttpTransport;

function resourceObjectRoutes(opt) {
	let version = opt.resource.version;
	let before = beforeStack(opt);
	let after = afterStack(opt);

	let create = function (path) {
		opt.server.POST({path, version}, [before, after]);
	};

	let find = function (path, resource) {
		opt.server.GET({path, version}, [
			before,
			function (req, res, next) {
				resource.find()(opt.router, req.params, req.query, function (err, data) {
					req.result = data;
					console.log(data);
					next();
				});

			},
			after
		]);
	};

	let update = function (path, resource) {
		opt.server.PATCH({path, version}, [before, after]);
	};

	let remove = function (path, resource) {
		opt.server.DELETE({path, version}, [before, after]);
	};

	for(let entry of opt.state.links.routes.resourceObject.entries()) {
		let resource = entry[0];
		let ref = entry[1];

		if (ref.related !== undefined) {
			find(ref.collection, resource);
		}
		else {
			create(ref.collection, resource);
			find(ref.collection, resource);
			find(ref.identifier, resource);
			update(ref.identifier, resource);
			remove(ref.identifier, resource);
		}
	}
}

function relationshipsRoutes(opt) {
	let version = opt.resource.version;
	let before = beforeStack(opt);
	let after = afterStack(opt);

	for(let entry of opt.state.links.routes.relationships.entries()) {
		let resource = entry[0];
		let path = entry[1].collection;

		opt.server.GET({path, version}, [before, after]);
		opt.server.POST({path, version}, [before, after]);
		opt.server.PATCH({path, version}, [before, after]);
		opt.server.DELETE({path, version}, [before, after]);
	}
}

function beforeStack(opt) {
	return [
		validateQueryParams(opt)
	]
}

function afterStack(opt) {
	return [
		validateResponseObject(opt),
		function (req, res) {
			res.send(req.result);
		}
	];
}

function validateQueryParams(opt) {
	let query = opt.state.query;
	let isValidQuery = query.createQueryValidationFunction(opt.resource);
	let getQueryParams = opt.server.getQueryParams;

	return function (req, res, next) {
		let params = getQueryParams(req);
		let valid = isValidQuery(params);
		if (!valid) return res.send(400, 'Invalid query params.');
		else next();
	}
}

function validateResponseObject(opt) {
	let query = opt.state.query;
	let isValidObject = query.createResponseValidationFunction(opt.resource);
	let getQueryParams = opt.server.getQueryParams;
	let getResultData = opt.server.getResultData;

	return function (req, res, next) {
		let params = getQueryParams(req);
		let result = getResultData(req);
		let valid = isValidObject(params, result);
		if (!valid) return res.send(500, 'Response object violates query param rules.');
		else next();
	}
}

function useResource(opt, fnc) {

	let getQueryParams = opt.server.getQueryParams;
	let getResultData = opt.server.getUrlParams;

	return function (req, res, next) {
		fnc()
	}
}