"use strict";

var dw = require('../index');
var morgan  = require('morgan');
var RestifyServer = dw.implementation.RestifyServer;

class Transport extends dw.AbstractResourceController {
	constructor() {
		super();
		this.db = require('./database');
	}

	find(type, id, options, next) {
		next(null, {
			data: {
				id: "book:1",
				name: "First Book",
				author: "author:1",
				reviews: ['review:1', 'review:2']
			},
			included: [{
				id: "author:1",
				name: "Smith",
				records: ['record:1', 'record:2']
			}]
		})
	}
}

let Router = dw.DataWire.getRouter();

var Review = Router.resource('Review', {
	text: dw.attributes.Data,
	book: dw.attributes.Relationship.ToOne
});

var Author = Router.resource('Author', {
	name: dw.attributes.Data,
	books: dw.attributes.Relationship.ToMany,
	reviews: dw.attributes.Relationship.ToMany
});

var Book = Router.resource('Book', {
	name: dw.attributes.Data,
	author: dw.attributes.Relationship.ToOne,
	reviews: dw.attributes.Relationship.ToMany
});

var transport = new Transport();
transport.queryParams.setIncludeRelated(true);

dw.DataWire.setGlobalController(transport);

var restify = new RestifyServer();
restify.server.use(morgan('dev'));
dw.DataWire.build(restify);
//console.log(restify.toString());
restify.server.listen(8888, () => {
	console.log('%s listening at %s', restify.server.name, restify.server.url);
});