"use strict";

var klass = require('./util/klass');

class AbstractResourceController {

	constructor() {
		klass.abstract('AbstractResourceController', new.target.name);
	}

	find() {throw new TypeError('Not implemented')};
	create() {throw new TypeError('Not implemented')};
	update() {throw new TypeError('Not implemented')};
	remove() {throw new TypeError('Not implemented')};
}

module.exports = AbstractResourceController;