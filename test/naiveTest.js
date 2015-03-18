
var Promise = require('bluebird');
var Datawire = require('../lib/');

var MyModel = new Datawire.Model({
    test : Datawire.DataType.Number.extend({optional:false}),
    foo : Datawire.DataType.String,
    boo : Datawire.DataType.Any,
    other : Datawire.DataType.Any.extend({virtual : true}),

    puted : Datawire.DataType.Computed(function () {
        return this.foo + this.boo;
    })

});

MyModel.setTransport(Datawire.Transport.extend({

    read : function (key) {
        return Promise.resolve({ test : 1, foo : 'foo' });
    },

    create : function (obj) {
        console.log(obj);
        return Promise.resolve({ test : 1, foo : 'foo' });
    },

    update : function (obj) {
        console.log(obj);
        return Promise.resolve({ test : 1, foo : 'foo' });
    },

    destroy : function (obj) {
        console.log(obj);
        return Promise.resolve({ test : 1, foo : 'foo' });
    }
}));

var m = MyModel.create({ test : 1, foo : 'foo' });

m.boo = 'text';

var p = m.puted();
console.log(p);
//m.testFunction();

m.commit().then(function (model) {

    console.log(m);

    var keys = Object.keys(model);

    console.log(keys);

    m.release();

});