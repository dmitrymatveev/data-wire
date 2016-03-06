"use strict";

var isNullOrUndefined = require('util').isNullOrUndefined;

let PRIVATE = new WeakMap();

class ResourceLinks {
	constructor() {
		PRIVATE.set(this, {
			useLinks: null
		})
	}

	static createMerged(primary, secondary) {
		let pm = PRIVATE.get(primary);
		let sm = PRIVATE.get(secondary);
		let res = new ResourceLinks();
		let rm = PRIVATE.get(res);

		if (isNullOrUndefined(pm) || isNullOrUndefined(sm)) {
			throw new Error('Undefined ResourceLinks params object.');
		}

		for(let key of Object.keys(pm)) {
			if (!isNullOrUndefined(sm[key])) {
				rm[key] = sm[key];
			}
			else {
				rm[key] = pm[key];
			}
		}
		return res;
	}

	copy(fromLinks) {
		let from = PRIVATE.get(fromLinks);
		if (isNullOrUndefined(from)) {
			throw new Error('Undefined links object.');
		}

		let self = PRIVATE.get(this);
		for(let key of Object.keys(self)) {
			let next = self[key];
			if (isNullOrUndefined(next)) {
				self[key] = from[key];
			}
		}
	}

	setGenerateLinks(v) {
		PRIVATE.get(this).useLinks = v;
	}

	get useLinks() {
		let use = PRIVATE.get(this).useLinks;
		return use === null ? false : use;
	}

	self(id) {
		return `self-link/${id}`;
	}
}

module.exports = ResourceLinks;