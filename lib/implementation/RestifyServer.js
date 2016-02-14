"use strict";

var AbstractHttpTransport = require('../AbstractHttpTransport');

let restify = require('restify');
let PRIVATE = new WeakMap();

/**
 * @class
 * @extends {AbstractHttpTransport}
 */
class RestifyServer extends AbstractHttpTransport {
	constructor() {
		super();

		let server = restify.createServer({});
		server.use(restify.queryParser());

		PRIVATE.set(this, {server});
	}

	get server() {return PRIVATE.get(this).server}

	GET(params, callback) {
		PRIVATE.get(this).server.get(params, callback)
	};

	POST(params, callback) {
		PRIVATE.get(this).server.post(params, callback)
	};

	PATCH(params, callback) {
		PRIVATE.get(this).server.patch(params, callback)
	};

	DELETE(params, callback) {
		PRIVATE.get(this).server.del(params, callback)
	};

	getQueryParams(req) { return req.query }

	toString(){
		let server = PRIVATE.get(this).server;
		let res = '';
		let text = [];
		var print = function (header) {
			text.sort();
			text = [header].concat(text);
			console.log(text.join('\n'));
			text = [];
		};

		server.router.routes.GET.forEach(function(value) {
			text.push(`GET /${value.spec.path}`);
		});
		print('== GET ==');

		server.router.routes.POST.forEach(function(value) {
			text.push(`POST /${value.spec.path}`);
		});
		print('== POST ==');

		server.router.routes.PATCH.forEach(function(value) {
			text.push(`patch /${value.spec.path}`);
		});
		print('== PATCH ==');

		server.router.routes.DELETE.forEach(function(value) {
			text.push(`DEL /${value.spec.path}`);
		});
		print('== DELETE ==');

		return res;
	}
}

module.exports = RestifyServer;