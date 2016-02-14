"use strict";

var DataWire = require('./lib/DataWire');
var ResourceControllerInterface = require('./lib/ResourceControllerInterface');
var AbstractHttpTransport = require('./lib/AbstractHttpTransport');

var Data = require('./lib/attributes/Data');
var Relationship = require('./lib/attributes/Relationship');

module.exports = {
	DataWire,
	ResourceControllerInterface,
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