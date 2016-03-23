"use strict";

var BaseAttribute = require('./BaseAttribute');

class Identifier extends BaseAttribute {

	toJsonApi(ctx, destination, data) {

		let item = data[this.key];
		if (item) {
			destination[this.key] = item;
		}
		else {
			let params = this.params;
			if (params.default) {
				destination[this.key] = params.default(this.resource);
			}
			else if (params.optional) {
				params.optional(ctx, destination, data);
			}
		}
		return true;
	}
}

module.exports = Identifier;