"use strict";

var BaseAttribute = require('./BaseAttribute');

class Identifier extends BaseAttribute {

	static get BASE_SCHEMA() {
		return {
			type: {attr: Identifier, params: {
				default: (res) => { return res.name } }
			},
			id: Identifier
		}
	}

	toJsonApi(ctx, destination, data) {

		let item = data[this.key];
		if (item) {
			destination[this.key] = item;
		}
		else {
			let def = this.params.default;
			if (def) {
				destination[this.key] = def(this.resource);
			}
		}
	}
}

module.exports = Identifier;