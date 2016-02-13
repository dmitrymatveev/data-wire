"use strict";

class ServerInterface {
	GET(params, callback) {throw new TypeError('Not implemented')};
	POST(params, callback) {throw new TypeError('Not implemented')};
	PATCH(params, callback) {throw new TypeError('Not implemented')};
	DELETE(params, callback) {throw new TypeError('Not implemented')};

	start() {throw new TypeError('Not implemented')};

	use(router) {
		router.attach(this);
	}
}

module.exports = ServerInterface;