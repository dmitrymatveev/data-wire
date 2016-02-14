"use strict";

var BaseAttribute = require('./BaseAttribute');
var finalize = require('../util/klass').finalize;

class Relationship extends BaseAttribute {}

class ToOne extends Relationship {
	constructor(k, r, p) {
		finalize('ToOne', new.target);
		super(k, r, p);
	}

	toJsonApi() {

	}
}

class ToMany extends Relationship {
	constructor(k, r, p) {
		finalize('ToMany', new.target);
		super(k, r, p);
	}
}

Relationship.ToOne = ToOne;
Relationship.ToMany = ToMany;
module.exports = Relationship;