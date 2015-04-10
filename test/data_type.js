
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
        }).should.throw('Non optional id property is missing on the model instance!');

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