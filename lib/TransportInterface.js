"use strict";

class TransportInterface {
	find() {throw new TypeError('Not implemented')};
	create() {throw new TypeError('Not implemented')};
	update() {throw new TypeError('Not implemented')};
	remove() {throw new TypeError('Not implemented')};
}

module.exports = TransportInterface;