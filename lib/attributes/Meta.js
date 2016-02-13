"use strict";

var ServiceProvider = require('../ServiceProvider');
var BaseAttribute = require('./BaseAttribute');

class Meta extends BaseAttribute {
	toJsonApi(destination, data) {
		destination[this.key] = data.key;
	}
}

ServiceProvider.add('attributes', {
	get BASE_SCHEMA() {
		return {
			type: Meta,
			id: Meta
		}
	}
});

module.exports = Meta;