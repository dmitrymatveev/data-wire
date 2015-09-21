
var should = require('should');

var Promise = require('bluebird');
var datawire = require('../lib/index.js');
var Model = datawire.Model;
var Type = datawire.DataType;
var Transport = datawire.Transport;

describe('Model:', function () {

    var PersistentDataStorage = null;
    var TestTransport = null;

    before(function () {

        PersistentDataStorage = {
            item_1 : {
                id : 1,
                name : 'test',
                meta : true,
                data : []
            }
        };

        TestTransport = Transport.extend({
            readAll: function () {
                return Promise.resolve([{id:1}, {id:2}]);
            },
            read : function (key) {
                return Promise.resolve(PersistentDataStorage[key]);
            },
            create : function (obj) {
                PersistentDataStorage[obj.id] = obj.serialized();
                return Promise.resolve(null);
            },
            update  : function (obj) {
                return this.create(obj);
            },
            destroy : function (obj) {
                PersistentDataStorage[obj.id] = null;
            }
        });
    });

    it('define a model', function () {

        var Example = new Model({
            id : Type.Number,
            name : Type.String
        });

        var definition = Example.definition;
        definition.should.have.properties('id', 'name');
    });

    it('create instance of a model', function () {

        var Example = new Model({
            id : Type.Number,
            name : Type.String,
            idName : function () {
                return this.id + this.name;
            }
        });

        var example = Example.create({
            id : 1,
            name : 'test'
        });

        example.should.have.property('id', 1);
        example.should.have.property('name', 'test');
        example.should.have.property('idName');
        example.idName().should.be.equal('1test');
    });

    it('create partially filled instance and commit', function (done) {

        var Example = new Model({
            id : Type.Number.extend({optional:false}),
            name : Type.String
        }, {
            transport : TestTransport.extend({
                create : function (obj) {
                    PersistentDataStorage[obj.id] = obj.serialized();
                    PersistentDataStorage[obj.id].name = 'instance_'+obj.id;
                    return Promise.resolve(PersistentDataStorage[obj.id]);
                }
            })
        });

        var example = Example.create({
            id : 1
        });

        example.commit().then(function () {
            example.should.have.property('id', 1);
            example.should.have.property('name', 'instance_1');
        })
            .then(done)
            .catch(done);
    });

    it('revert changes in local copy', function (done) {

        var Example = new Model({id : Type.Number});
        Example.setTransport(Transport.extend({
            read : function () {
                return Promise.resolve({id:1});
            },
            update : function () {
                return Promise.resolve(null);
            }
        }));

        Example.find(1)
            .then(function (ex) {

                ex.id = 100;
                ex.id.should.equal(100);
                ex.revert();

                ex.id.should.equal(1);
                ex.id = 100;

                return ex.commit();
            })
            .then(function (ex) {

                ex.id = 50;
                ex.revert();
                ex.id.should.equal(100);
            })
            .then(done)
            .catch(done);
    });

    it('get keys', function () {

        var Example = new Model({
            id: Type.Number,
            other: Type.String.extend({virtual: true})
        });

        Example.setTransport(TestTransport);

        var ex = Example.create({id : 1, other: 'other'});
        var keys = ex.propertyFilter();

        keys.should.containEql('id');
        keys.should.not.containEql('other');
    });

    it('get dirty keys only', function (done) {

        var Example = new Model({id : Type.Number, foo : Type.String});
        Example.setTransport(TestTransport);

        var ex = Example.create({id : 1});
        var keys = ex.propertyFilter({dirty: true});
        keys.should.containEql('id', 'foo');

        ex.commit()
            .then(function () {
                keys = ex.propertyFilter({dirty: true});
                should.not.exist(keys);

                ex.foo = "boo";
                keys = ex.propertyFilter({dirty: true});
                keys.should.containEql('foo');

                return ex.commit();
            })
            .then(function () {
                keys = ex.propertyFilter({dirty: true});
                should.not.exist(keys);
            })
            .then(done)
            .catch(done);
    });

    it('get filtered keys', function () {

        var Example = new Model({id : Type.Number, foo : Type.String});
        var ex = Example.create();

        var keys = ex.propertyFilter({type: Type.Number});

        keys.should.have.length(1);
        keys.should.containEql('id');
    });

    it('create filtered serialized object', function () {

        var Example = new Model({id : Type.Number, foo : Type.String});
        var ex = Example.create();

        var keys = ex.propertyFilter({type: Type.Number});
        var obj = ex.serialized(keys);

        obj.should.have.keys('id');
    });

    it('initialize model instance array', function () {
        var Example = new Model({id : Type.Number}, {transport: TestTransport});

        Example.findAll([], null).then(function (res) {
            res.should.have.length(2);
            res[0].should.have.property('id', 1);
            res[1].should.have.property('id', 2);
        })
    });
});
