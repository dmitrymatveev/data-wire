
var should = require('should');

var Promise = require('bluebird');
var datawire = require('../lib/index.js');
var Model = datawire.Model;
var Type = datawire.DataType;
var Transport = datawire.Transport;

describe('Transport:', function () {

    var PersistentDataStorage = null;
    var Example = null;

    beforeEach(function () {

        PersistentDataStorage = {
            item_1 : {
                id : 1,
                name : 'test',
                meta : true,
                data : []
            }
        };

        Example = new Model({
            id : Type.Number,
            name : Type.String
        });

    });

    it('throw when transport is not properly defined', function () {

        Example.setTransport(Transport.extend({}));

        (function () {
            Example.find(1);
        }).should.throw();

        Example.setTransport(Transport.extend({
            read : function () {}
        }));

        (function () {
            Example.find(1);
        }).should.throw();

        Example.setTransport(Transport.extend({
            read : function () {
                return Promise.resolve(null);
            }
        }));

        (function () {
            Example.find(1);
        }).should.not.throw();
    });

    it('invokes create with correct params', function (done) {

        Example.setTransport(Transport.extend({
            create : function (obj, meta) {
                should.exists(obj);
                meta.should.containDeep({foo: 'foo'});
                obj.created = true;
                return Promise.resolve(null);
            }
        }));

        var ex = Example.create();
        ex.commit({foo:'foo'})
            .then(function () {
                ex.should.have.property('created', true);
            })
            .then(done)
            .catch(done);
    });

    it('invokes read with correct params', function (done) {

        Example.setTransport(Transport.extend({
            read : function (key, meta, model) {
                key.should.equal('item_1');
                meta.should.containDeep({foo: 'foo'});
                model.should.equal(Example);
                return Promise.resolve(PersistentDataStorage[key]);
            }
        }));

        Example.find('item_1', {foo:'foo'})
            .then(function (ex) {
                ex.should.have.property('id', 1);
                ex.should.have.property('name', 'test');
            })
            .then(done)
            .catch(done);
    });

    it('invokes update with correct params', function (done) {

        Example.setTransport(Transport.extend({
            read : function (key, meta, model) {
                return Promise.resolve(PersistentDataStorage[key]);
            },
            update : function (obj, meta) {
                should.exist(obj);
                meta.should.containDeep({foo: 'foo'});
                obj['updated'] = true;
                return Promise.resolve(null);
            }
        }));

        Example.find('item_1')
            .then(function (ex) {
                should.exist(ex);
                ex.name = 'blah';
                return ex.commit({foo:'foo'});
            })
            .then(function (ex) {
                ex.should.have.property('updated', true);
            })
            .then(done)
            .catch(done);

    });

    it('invokes destroy with correct params', function (done) {

        Example.setTransport(Transport.extend({
            read : function (key, meta, model) {
                return Promise.resolve(PersistentDataStorage[key]);
            },
            destroy : function (obj, meta) {
                should.exist(obj);
                meta.should.containDeep({foo: 'foo'});
                obj['destroyed'] = true;
                PersistentDataStorage['item_' + obj.id] = null;
                return Promise.resolve(null);
            }
        }));

        Example.find('item_1')
            .then(function (ex) {
                ex.destroy();
                ex.commit({foo:'foo'});
            })
            .then(Example.find('item_1'))
            .then(function (ex) {
                should.not.exist(ex);
            })
            .then(done)
            .catch(done);
    });

    it('update instance properties by returning data object from transport', function (done) {

        Example.setTransport(Transport.extend({
            read : function (key, meta, model) {
                return Promise.resolve(PersistentDataStorage[key]);
            },
            create : function (obj) {
                var key = 'item_' + obj.id;
                obj.name = "created name";
                PersistentDataStorage[key] = obj.serialized();
                return Promise.resolve(PersistentDataStorage[key]);
            },
            update : function (obj) {
                var key = 'item_' + obj.id;
                obj.name = "updated name";
                PersistentDataStorage[key] = obj.serialized();
                return Promise.resolve(PersistentDataStorage[key]);
            }
        }));

        var findStuff = Example.find('item_1')
            .then(function (ex) {
                should.exist(ex);
                ex.name.should.equal('test');
                ex.update();

                return ex.commit();
            })
            .then(function (ex) {
                ex.name.should.equal('updated name');
            });

        var createStuff = findStuff
            .then(function () {
                return Example.create({id:2}).commit();
            })
            .then(function (ex) {
                ex.name.should.equal('created name');
            });

        createStuff
            .then(done)
            .catch(done);
    });

});