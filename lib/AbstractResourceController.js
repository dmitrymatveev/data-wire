"use strict";

var klass = require('./util/klass');
var QueryParams = require('./QueryParams');

let PRIVATE = new WeakMap();

class AbstractResourceController {

	constructor() {
		klass.abstract('AbstractResourceController', new.target.name);

		PRIVATE.set(this, {
			queryParams: QueryParams.createDefault()
		});
	}

	find() {throw new TypeError('Not implemented')};
	create() {throw new TypeError('Not implemented')};
	update() {throw new TypeError('Not implemented')};
	remove() {throw new TypeError('Not implemented')};

	/** @returns {QueryParams} */
	get queryParams() { return PRIVATE.get(this).queryParams }
}

module.exports = AbstractResourceController;