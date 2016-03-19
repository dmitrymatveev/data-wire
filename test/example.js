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
				about: ['footnote:1']
				//reviews: ['review:1', 'review:2']
			},
			included: [{
				type: "author",
				id: "author:1",
				name: "Smith",
				books: ['book:1', 'book:2']
			}]
		})
	}
}

let Router = dw.DataWire.getRouter();
Router.queryParams.setIncludeRelated(true);
Router.links.setGenerateLinks(false);

var Review = Router.resource('Review', {
	text: dw.attributes.Data,
	book: dw.attributes.Relationship.ToOne
});

var Author = Router.resource('Author', {
	name: dw.attributes.Data,
	books: dw.attributes.Relationship.ToMany,
	reviews: dw.attributes.Relationship.ToMany
});

var Footnote = Router.resource('Footnote', {
	text: dw.attributes.Data,
	about: dw.attributes.Relationship.ToOne.as('book')
});

var Book = Router.resource('Book', {
	name: dw.attributes.Data,
	about: dw.attributes.Relationship.ToOne.as('footnote'),
	author: dw.attributes.Relationship.ToOne,
	reviews: dw.attributes.Relationship.ToMany
});

var transport = new Transport();

dw.DataWire.setGlobalController(transport);

var restify = new RestifyServer();
restify.server.use(morgan('dev'));
dw.DataWire.build(restify);

console.log(restify.toString());

restify.server.listen(8888, () => {
	console.log('%s listening at %s', restify.server.name, restify.server.url);
});