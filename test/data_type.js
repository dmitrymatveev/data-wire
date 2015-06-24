
require('should');

var Promise = require('bluebird');
var datawire = require('../lib/index.js');
var Model = datawire.Model;
var Type = datawire.DataType;
var Transport = datawire.Transport;

describe('Data Type:', function () {

    it('basic definition', function () {

        var Example = new Model({
            id : Type.Number
        });

        var ex = Example.create();
        ex.should.have.property('id', 0);
    });

    it('do not allow instantiation without compulsory properties', function () {

        var Example = new Model({
            id : Type.Number.extend({optional:false, defaultValue : 'does not work this way'})
        });

        (function () {
            Example.create();
        }).should.throw({name : 'no_value'});

    });

    it('do not serialize virtual properties', function () {

        var Example = new Model({
            id : Type.Number.extend({optional:false}),
            name : Type.String.extend({virtual:true}),
            foo : function () {
                return 'foo';
            }
        });

        var ex = Example.create({id:1});
        ex.name = 'test';
        ex.serialized().should.containDeep({id:1});
    });

    it('set to default value', function () {

        var Example = new Model({
            id : Type.Number.extend({defaultValue : 100})
        });

        var ex = Example.create();
        ex.should.have.property('id', 100);
    });

});

describe('Counter value transform', function () {

    var Example = new Model({
        count : Type.Number.Counter
    }, {
        transport : Transport.extend({
            create : function () { return Promise.resolve(null) },
            update : function (o) { return Promise.resolve(o.serialized()) }
        })
    });

    it('correctly identify dirty state', function () {

        var ex = Example.create({ count : 0 });
        ex.commit()
            .then(function () {

                ex.isDirty('count').should.not.be.true;

                ex.count = 1;
                ex.isDirty('count').should.be.true;

                ex.count = 0;
                ex.isDirty('count').should.not.be.true;

                ex.count = 1;
                return ex.commit();
            })
            .then(function () {
                ex.isDirty('count').should.not.be.true;
            })
    });

    it('transform value on commit', function () {

        var ex = Example.create({ count : 0 });
        ex.commit()
            .then(function () {
                ex.count = 10;
                return ex.commit();
            })
            .then(function () {
                ex.count.should.equal(10);
                ex.count = 10;
                return ex.commit();
            })
            .then(function () {
                ex.count.should.equal(20);
            })
    });
});

describe('Non Primitive Data Types', function () {

    var TestTransport = Transport.extend({
        create : function () { return Promise.resolve(null) },
        update : function () { return Promise.resolve(null) }
    });

    var Example = new Model({
        arr : Type.Array,
        obj : Type.Object
    }, {
        transport : TestTransport
    });

    it('using revert with Array type', function () {

        var ex = Example.create({});
        ex.arr.push(1);

        ex.revert();
        ex.arr.should.have.length(0);

        ex.arr.push(1);

        ex.commit().then(function () {
            ex.arr.push(1);
            ex.arr.should.have.length(2);
            ex.revert();
            ex.arr.should.have.length(1);
        });
    });

    it('using revert with Object type', function () {

        var ex = Example.create({});
        ex.obj.foo = 'foo';

        ex.revert();
        ex.obj.should.not.have.property('foo');

        ex.obj.foo = 'foo';

        ex.commit().then(function (ex) {
            ex.obj.boo = 'boo';
            ex.obj.should.have.properties('foo', 'boo');

            ex.revert();
            ex.obj.should.have.property('foo');
            ex.obj.should.not.have.property('boo');
        });
    });

});

describe('Serialized data types', function () {

    var Serializable = Type.Any.extend({
        serialized : function (v) {
            return v + '_serialized';
        },
        deserialized : function (v) {
            return v.split('_')[0];
        }
    });

    var Example = new Model({
        serial : Serializable
    }, {
        transport : Transport.extend({
            read : function () {

                return Promise.resolve({serial : 'storedValue_serialized'});
            },
            create : function (model) {

                var serialized = model.serialized();
                serialized.serial.should.eql('newValue_serialized');

                return Promise.resolve({serial : 'newValue_serialized'});
            }
        })
    });

    it('returned deserialized', function () {

        Example.find('arbitrary criteria').then(function (example) {
            example.serial.should.eql('storedValue');
        });
    });

    it('serialize value on demand', function () {

        var example = Example.create({serial : 'newValue'});
        example.commit().then(function () {
            example.serial.should.eql('newValue');
        });
    });

});