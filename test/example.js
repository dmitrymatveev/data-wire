"use strict";

var dw = require('../index');
var restify = require('restify');

class Server extends dw.ServerInterface {
	constructor() {
		super();
		this.server = restify.createServer({});
	}

	start() {
		var morgan  = require('morgan');
		this.server.use(morgan('dev'));

		this.server.listen(8080, () => {
			console.log('%s listening at %s', this.server.name, this.server.url);
		});
	}

	GET(params, callback) {this.server.get(params, callback)};
	POST(params, callback) {this.server.post(params, callback)};
	PATCH(params, callback) {this.server.patch(params, callback)};
	DELETE(params, callback) {this.server.del(params, callback)};
}

class Transport extends dw.TransportInterface {
	constructor() {
		super();
		this.db = require('./database');
	}

	find(type, id, options, next) {
		next(null, {
			data: [{
				id: "record:1",
				name: "First Record",
				author: "author:1"
			}],
			included: [{
				id: "author:1",
				name: "Smith",
				records: ['record:1', 'record:2']
			}]
		})
	}
}

class Review extends dw.Resource {
	constructor() {
		super({
			text: dw.attributes.Data,
			//records: dw.attributes.Relationship.ToOne
		});
	}
}

class Author extends dw.Resource {
	constructor() {
		super({
			name: dw.attributes.Data,
			//records: dw.attributes.Relationship.ToMany
		});
	}
}

var Book = new dw.Resource(
	'Book',
	{
		name: dw.attributes.Data,
		author: dw.attributes.Relationship.ToOne,
		reviews: {attr: dw.attributes.Relationship.ToMany, params: {}}
	},
	{
		transports: {
			resource: new Transport(),
			relationship: new Transport()
		}
	}
);

var router = new dw.Router();
router.use(Book);
router.use(new Author());
router.use(new Review());

var server = new Server();
server.use(router);
server.start();

var list = listAllRoutes(server.server);
console.log(list);

function listAllRoutes(server){
	var res = '';
	var text = [];
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
