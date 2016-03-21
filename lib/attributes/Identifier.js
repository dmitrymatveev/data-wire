"use strict";

var BaseAttribute = require('./BaseAttribute');

class Identifier extends BaseAttribute {

	static get BASE_SCHEMA() {
		return {
			type: {
				attr: Identifier,
				params: {
					default: (res) => {return res.name}
				}
			},
			id: Identifier,
			meta: Identifier,
			links: {
				attr: Identifier,
				params: {
					optional: (ctx, dest, data) => {
						if (ctx.links.useSelfLinks) {
							dest.links = dest.links || {};
							dest.links.self = ctx.links.linkToSelf(data.id);
						}
					}
				}
			}
		}
	}

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