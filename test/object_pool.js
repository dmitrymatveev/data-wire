require('should');

var datawire = require('../lib/index.js');
var Model = datawire.Model;
var ObjectPool = datawire.ObjectPool;
var Type = datawire.DataType;

describe('Object Pool:', function () {

    it('create new instance on the pool', function () {

        var Example = new Model({id : Type.Number});
        var Other = new Model({id : Type.Number});

        var ex = Example.create();
        ex.release();

        Example.objectPool.idle.should.have.length(1);
        Other.objectPool.idle.should.have.length(0);
    });

    it('grab instance from the pool', function () {

        var Example = new Model({id : Type.Number});
        var ex = Example.create();
        ex.release();

        Example.objectPool.idle.should.have.length(1);

        ex = Example.create({id:1});
        Example.objectPool.idle.should.have.length(0);
    });

    it('only use pool up to a limit', function () {

        var Example = new Model({id : Type.Number});
        Example.setObjectPool(ObjectPool.extend({
            size : 2
        }));

        var ex1 = Example.create();
        var ex2 = Example.create();
        var ex3 = Example.create();

        ex1.release();
        Example.objectPool.idle.should.have.length(1);

        ex2.release();
        Example.objectPool.idle.should.have.length(2);

        ex3.release();
        Example.objectPool.idle.should.have.length(2);

        ex3 = Example.create();
        Example.objectPool.idle.should.have.length(1);

        ex3.release();
        Example.objectPool.idle.should.have.length(2);

        Example.create();
        Example.create();
        Example.create();
        Example.objectPool.idle.should.have.length(0);
    })

});