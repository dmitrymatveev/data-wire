"use strict";

var dw = require('../index');
var morgan  = require('morgan');
var RestifyServer = dw.implementation.RestifyServer;

class Transport extends dw.ResourceControllerInterface {
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

let Router = dw.DataWire.getRouter();

Router.queryParams.setIncludeRelated(true);

var Review = Router.resource('Review', {
	text: dw.attributes.Data,
	book: dw.attributes.Relationship.ToOne
});

var Author = Router.resource('Author', {
	name: dw.attributes.Data,
	books: dw.attributes.Relationship.ToMany
});

var Book = Router.resource('Book', {
	name: dw.attributes.Data,
	author: dw.attributes.Relationship.ToOne,
	reviews: dw.attributes.Relationship.ToMany
});

dw.DataWire.setGlobalController(new Transport());

var restify = new RestifyServer();
restify.server.use(morgan('dev'));
dw.DataWire.build(restify);
restify.server.listen(8080, () => {
	console.log('%s listening at %s', restify.server.name, restify.server.url);
});