"use strict";

var TransportInterface = require('./lib/TransportInterface');
var Router = require('./lib/Router');
var ServerInterface = require('./lib/ServerInterface');
var Resource = require('./lib/Resource');

var Data = require('./lib/attributes/Data');
var Relationship = require('./lib/attributes/Relationship');

module.exports = {
	TransportInterface,
	Router,
	ServerInterface,
	Resource,

	attributes: {
		Data,
		Relationship
	}
};