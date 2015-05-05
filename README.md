
# Data Wire

[![NPM](https://nodei.co/npm/data-wire.png)](https://nodei.co/npm/data-wire/)

Simple data abstraction layer between the client and associated data storage whichever it might be.

Main purpose of this module is to provide an easy to use abstraction in the form of a simple interface
for managing local and remote resources.

In the spirit of simplicity this module does not provide implementations of the data transport layer or
any sort of ORM apart from the bare bones object descriptor.

Instead, Data Wire makes it possible to tie-in whichever data storage you may have into whatever data
representation on the client (consumer), allowing the said client to carry on with its own business.

	var Jedi = new Model({
		name : DataType.String,
		surname : DataType.String.extend({defaultValue: 'Kenobi'})

		fullName : function () {
			return this.name +' '+ this.surname;
		}
	});

	Jedi.find('Ben').then(function (jedi) {
		// got your jedi here
	});
	

## Global

#### module.exports
* Model
* DataType
* Transport
* ObjectPool

<a name="Model" />
## Model(definition, options)
Creates an instance of the Model definition.

* definition - A hash of [`DataTypes`](#DataType) defining a resource.
* options
	* options.transport - Set custom transport.
	* options.objectPool - Set custom object pool implementation .
	* options.onInstanceInit - Called when new instance is created.
	* options.onInstanceRevert - Called when instance is being reset to its default state.

#### Model.setTransport(transport)
Set to use provided [`transport`](#(Transport)

#### Model.setObjectPool(objectPool)
Set to use provided [`objectPool`](#(ObjectPool)

#### Model.create(obj)
Creates and return new [`ModelInstance`](#ModelInstance).

* obj {Object} - Object literal containing data which describes a new instance of the model.

#### Model.find(key[, meta])
Invokes `Transport.read` function. Returns `Promise<ModelInstance|null>`

* key {String} Identifier to use when searching for data
* meta {*} Anything that your transport implementation is expecting in place of this meta param.

<a name="DataType" />
## DataType
These are object literal mixins. It wraps most common data types and control the way data is handled.

### Any
This is a __base__ data type. Use it (or more specific ones for that matter) as a starting point in case you need a custom representation of data or you want a very general data location.

* Any.extend(obj)

Mixes references of all own properties in self into provided `obj` and returns it. This function has two uses,
creating slightly modified types (for example two strings that differ in its default values) or a more complex data representation.
	* obj {Object} - Mixin target

In practice the following 3 properties is all what needs to be modified when default values are not suitable.

* Any.defaultValue

Value to initialize to when assigned value was not defined. (Default `undefined`).

* Any.optional

Specifies that this piece of data can not be left undefined. (Default `true`).

* Any.virtual

Virtual data types would not be serialized by its model instance. (Default `false`).

When more complex data type is needed which does not come with DataWire the following set of function could be replaced with custom implementation.

* Any.validate(name, value)

Called when assigning value into a `ModelInstance`. Must throw an error when `value` is not legal.

* Any.valueCopy(value)

Called after committing changes and when a value is being copied over into a `ModelInstance`. In cases when `value` is not a primitive you might want to make sure you are handling references vs values correctly.


### Array
* Array.defaultValue : []

### Boolean
* Boolean.defaultValue : false

### Number
* Number.defaultValue : 0

### Object
* Object.defaultValue : {}

### String
* String.defaultValue : ''

### Computed
Computed is a special data type which is always set to be _virtual_ and is primarily used for attaching behaviour to the model instance. When invoked `this` context will always be set to the model instance.

#### Example use of data types
	
	var ExampleModel = new Model({
		id : DataType.Number.extend({optional:false}),
		name : DataType.String,
		type : DataType.String.extend({defaultValue:'example-type'}),
		references : DataType.Array,
		
		addReference : function (ref) {
			this.references.push(ref);
		},
		
		// This is the same as addReference which would end up being wrapped into
		// a Computed data type for you.
		foo : DataType.Computed.extend({
			callback : function () {
				return this.id;
			}
		}),

		someDataThatWeDontNeedToPersist : DataType.String.extend({virtual:true})
	});

	var ex = ExampleModel.create({
		id : 1, // not specifying this will cause throwing an error
		name : 'TestObject'
	})

	ex.id; // 1
	ex.name; // 'TestObject'
	ex.type; // 'example-type'
	ex.references; // []
	ex.addReference('boo'); // undefined - because we don't return anything from this fnc
	ex.foo(); // 1
	ex.someDataThatWeDontNeedToPersist; // ""

	ex.serialized(); // { id: 1, name: 'TestObject', type: 'example-type', references: ['boo'] }



<a name="ModelInstance" />
## ModelInstance(model)
Constructor is private. Use `Model.create` or `Model.find` to get one.

#### ModelInstance.serialized()
Returns an object literal containing all contents of non-virtual properties in this model. 

#### ModelInstance.destroy()
Marks this object to be sent to `Transport.destroy` on next call to 'ModelInstance.commit`.

#### ModelInstance.update()
Marks this object to be sent to `Transport.update`. Note that you don't have to call this function when any of the primitive datatypes are modified, model instance object will be set to be updated automatically. In cases when complex objects are modified (arrays or object literals) the hook to update will be called only when reference to the object is changed not the contents of the objects. In cases when such behaviour is preferable there is always an option of extending DataType and making sure it invokes this function.

#### ModelInstance.commit([meta])
Invokes appropriate method in `Transport` and propagates returned `Promise` by said Transport back to consumer.
* meta {*} Anything that your transport implementation is expecting in place of the meta param.

#### ModelInstance.revert()
Undo all the changes made since the last call to `ModelInstance.commit` function.

#### ModelInstance.release()
Resets this object to default values and stores the reference to it in the object pool for the current Model type.
Not calling this function when exiting the scope will _not_ cause a memory leak when using default ObjectPool but instead allow GC to do its thing.


<a name="Transport" />
## Transport
Transport is an abstract mixin responsible for providing implementation for storing and retrieving model instance data.

In cases when Transport is implemented partially an Error will be thrown while attempting to complete an operation which requires a missing function.

* Transport.extend(obj)
Mixes references of all own properties in self into provided `obj` and returns it. Use it to create custom transports.
	* obj {Object} - Mixin target

The following are the 4 core functions of Transport that must be implemented by consumer. These operations must all return __A+ compliant Promise__ which _resolves_ to an object literal matching the expected data structure defined by its [`Model`](#Model) definition or `null`. All rejections or thrown errors would be propagated to the consumer of `Model.find` or `ModelInstance.commit`.

* Transport.read(key[, meta])
* Transport.update(obj[, meta])
* Transport.create(obj[, meta])
* Transport.destroy(obj[, meta])

_Note_ : when resolving to a non-`null` in `update` or `create` function, the data will be used to override what is currently stored in the ModelInstance object.

##### E.g
	var Example = new Model({ name : DataType.String });
	Example.setTransport(Transport.extend({
		...
		update : function () {
			return Promise.resolve({ name : 'Name From Transport' });	
		}
		...
	}));
	
	var ex = Example.create({ name : 'This is example' });
	ex.name; // will return 'This is example' here.
	ex.commit().then(function () {
		ex.name; // will be 'Name From Transport' now
	}); 


<a name="ObjectPool" />
## ObjectPool
Instantiation of model instances could be a costly process due to the fact that properties defined in a Model are not bound the the prototype and instead are created on the fly. To reduce the overhead during runtime, Model stores a reference to the object pool for every Model definition and uses that to obtain previously created instances of an object.

* ObjectPool.extend(obj) : {ObjectPool}

Mixes references of all own properties in self into provided `obj` and returns it. Use it to create custom object pools.

obj {Object} - Mixin target

* ObjectPool.size {Number}

Maximum allowed object in the pool. Default `10`. Set this to `zero` in order to turn of object pooling. (Alternatively just simply don't call `ModelInstance.release` method which actually causes the object to be saved for later).

* ObjectPool.generator() :  {[`ModelInstance`](#ModelInstance)}

ModelInstance constructor function wrapper. Overwriting this will not have any effect since Model decides which constructor to use for instances.

* ObjectPool.acquire() : {[`ModelInstance`](#ModelInstance)}

Called when an instance of the object needs to be pulled from the pool. Must return a reference to the object.
A bare-bones implementation which avoids pooling would be to call constructor stored in ObjectPool.generator and return it.

* ObjectPool.store(obj : {[`ModelInstance`](#ModelInstance)})

Put `obj` into a pool.