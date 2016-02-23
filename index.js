"use strict";

var DataWire = require('./lib/DataWire');
var AbstractResourceController = require('./lib/AbstractResourceController');
var AbstractHttpTransport = require('./lib/AbstractHttpTransport');

var Data = require('./lib/attributes/Data');
var Relationship = require('./lib/attributes/Relationship');

module.exports = {
	DataWire,
	AbstractResourceController,
	AbstractHttpTransport,

	attributes: {
		Data,
		Relationship
	},

	implementation: {
		get RestifyServer() {
			return require('./lib/implementation/RestifyServer');
		}
	}
};