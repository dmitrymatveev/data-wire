
var Promise = require('bluebird');
var Datawire = require('../lib/');

var MyModel = new Datawire.Model({
    test : Datawire.DataType.Number.extend({optional:false}),
    foo : Datawire.DataType.String,
    boo : Datawire.DataType.Any,
    other : Datawire.DataType.Any.extend({virtual : true}),

    puted : Datawire.DataType.Computed(function () {
        return this.foo + this.boo;
    }),

    fnc : function () {
        return this.boo;
    }

}, {
    onInstanceInit : function (instance) {
        console.log('init instance ' + instance.foo);
    }
});

MyModel.setTransport(Datawire.Transport.extend({

    guineyPig : { test : 1, foo : 'foo' },

    read : function (key) {
        return Promise.resolve(this.guineyPig);
    },

    create : function (obj) {
        this.guineyPig = obj.serialized();
        return Promise.resolve(true);
    },

    update : function (obj) {
        this.guineyPig = obj.serialized();
        return Promise.resolve(true);
    },

    destroy : function (obj) {
        this.guineyPig = null;
        return Promise.resolve(true);
    }
}));

var m = MyModel.create({ test : 1, foo : 'foo' });

m.boo = 'text';
m.test = 22;

m.fnc();

console.log('BOO ' + m.fnc());

var p = m.puted();
//console.log(p);
//m.testFunction();

m.commit()
    .then(function (model) {

        //console.log(m);

        var keys = Object.keys(model);

        console.log(keys);

        m.release();

        return MyModel.find('');
    })
    .then(function (m) {

        console.log('')
        console.log(m)
        console.log('')

        console.log(m.test);
        console.log(m.foo);
        console.log(m.boo);

        m.boo = "blah";

        console.log(m.boo);
        console.log(m.serialized())

        m.revert();
        console.log(m.serialized())

        m.boo = "blahblah";
        m.revert();

        return m.commit();
    })
    .then(function (m) {

        console.log(m.serialized());
        m.boo = "blah";
        console.log(m.isDirty());
        console.log(m.serialized())

    });
