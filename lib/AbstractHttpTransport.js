"use strict";

var ServiceProvider = require('./ServiceProvider');
var QueryParams = require('./QueryParams');

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
	useResourceRoutes(server, router, resource) {

		let params = {server, router, resource};

		resourceObjectRoutes(params);
		relationshipsRoutes(params);
	}
});

module.exports = AbstractHttpTransport;

function resourceObjectRoutes(opt) {
	let resource = opt.resource.resource;
	let version = opt.resource.members.version;
	let routes = opt.resource.routes.resourceObject;

	let before = beforeStack(opt);
	let after = afterStack(opt);

	for(let r of routes.find) {
		opt.server.GET({path: r.path, version}, [
			before,
			function (req, res, next) {
				resource.find()(req.params, req.query, function (err, data) {
					req.result = data;
					console.log(data);
					next();
				})
			},
			after
		]);
	}

	for(let r of routes.create) {
		opt.server.POST({path: r.path, version}, [before, after]);
	}

	for(let r of routes.update) {
		opt.server.PATCH({path: r.path, version}, [before, after]);
	}

	for(let r of routes.remove) {
		opt.server.DELETE({path: r.path, version}, [before, after]);
	}
}

function relationshipsRoutes(opt) {
	let version = opt.resource.members.version;

	let before = beforeStack(opt);
	let after = afterStack(opt);

	opt.resource.routes.relationships.forEach(function (routes) {
		for(let r of routes.find) {
			opt.server.GET({path: r.path, version}, [before, after]);
		}

		for(let r of routes.create) {
			opt.server.POST({path: r.path, version}, [before, after]);
		}

		for(let r of routes.update) {
			opt.server.PATCH({path: r.path, version}, [before, after]);
		}

		for(let r of routes.remove) {
			opt.server.DELETE({path: r.path, version}, [before, after]);
		}
	});
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
	let query = QueryParams.createMerged(opt.router.queryParams, opt.resource.resource.queryParams);
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
	let query = QueryParams.createMerged(opt.router.queryParams, opt.resource.resource.queryParams);
	let isValidObject = query.createResponseValidationFunction(opt.resource);
	let getQueryParams = opt.server.getQueryParams;
	let getResultData = opt.server.getResultData;

	return function (req, res, next) {
		let params = getQueryParams(req);
		let result = getResultData(req);
		let valid = isValidObject(params, result);
		if (!valid) return res.send(500, 'Response object did not satisfy query params.');
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