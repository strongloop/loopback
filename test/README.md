# TOC
   - [app](#app)
     - [app.model(Model)](#app-appmodelmodel)
     - [app.models()](#app-appmodels)
   - [loopback](#loopback)
     - [loopback.createDataSource(options)](#loopback-loopbackcreatedatasourceoptions)
     - [loopback.remoteMethod(Model, fn, [options]);](#loopback-loopbackremotemethodmodel-fn-options)
   - [DataSource](#datasource)
     - [dataSource.createModel(name, properties, settings)](#datasource-datasourcecreatemodelname-properties-settings)
     - [dataSource.operations()](#datasource-datasourceoperations)
   - [Model](#model)
     - [Model.validatesPresenceOf(properties...)](#model-modelvalidatespresenceofproperties)
     - [Model.validatesLengthOf(property, options)](#model-modelvalidateslengthofproperty-options)
     - [Model.validatesInclusionOf(property, options)](#model-modelvalidatesinclusionofproperty-options)
     - [Model.validatesExclusionOf(property, options)](#model-modelvalidatesexclusionofproperty-options)
     - [Model.validatesNumericalityOf(property, options)](#model-modelvalidatesnumericalityofproperty-options)
     - [Model.validatesUniquenessOf(property, options)](#model-modelvalidatesuniquenessofproperty-options)
     - [myModel.isValid()](#model-mymodelisvalid)
     - [Model.attachTo(dataSource)](#model-modelattachtodatasource)
     - [Model.create([data], [callback])](#model-modelcreatedata-callback)
     - [model.save([options], [callback])](#model-modelsaveoptions-callback)
     - [model.updateAttributes(data, [callback])](#model-modelupdateattributesdata-callback)
     - [Model.upsert(data, callback)](#model-modelupsertdata-callback)
     - [model.destroy([callback])](#model-modeldestroycallback)
     - [Model.destroyAll(callback)](#model-modeldestroyallcallback)
     - [Model.find(id, callback)](#model-modelfindid-callback)
     - [Model.count([query], callback)](#model-modelcountquery-callback)
     - [Remote Methods](#model-remote-methods)
       - [Example Remote Method](#model-remote-methods-example-remote-method)
       - [Model.beforeRemote(name, fn)](#model-remote-methods-modelbeforeremotename-fn)
       - [Model.afterRemote(name, fn)](#model-remote-methods-modelafterremotename-fn)
       - [Remote Method invoking context](#model-remote-methods-remote-method-invoking-context)
         - [ctx.req](#model-remote-methods-remote-method-invoking-context-ctxreq)
         - [ctx.res](#model-remote-methods-remote-method-invoking-context-ctxres)
     - [Model.hasMany(Model)](#model-modelhasmanymodel)
<a name=""></a>
 
<a name="app"></a>
# app
<a name="app-appmodelmodel"></a>
## app.model(Model)
Expose a `Model` to remote clients..

```js
var memory = loopback.createDataSource({connector: loopback.Memory});
var Color = memory.createModel('color', {name: String});
app.model(Color);
assert.equal(app.models().length, 1);
```

<a name="app-appmodels"></a>
## app.models()
Get the app's exposed models..

```js
var Color = loopback.createModel('color', {name: String});
var models = app.models();

assert.equal(models.length, 1);
assert.equal(models[0].modelName, 'color');
```

<a name="loopback"></a>
# loopback
<a name="loopback-loopbackcreatedatasourceoptions"></a>
## loopback.createDataSource(options)
Create a data source with a connector..

```js
var dataSource = loopback.createDataSource({
  connector: loopback.Memory
});
assert(dataSource.connector());
```

<a name="loopback-loopbackremotemethodmodel-fn-options"></a>
## loopback.remoteMethod(Model, fn, [options]);
Setup a remote method..

```js
var Product = loopback.createModel('product', {price: Number});

Product.stats = function(fn) {
  // ...
}

loopback.remoteMethod(
  Product.stats,
  {
    returns: {arg: 'stats', type: 'array'},
    http: {path: '/info', verb: 'get'}
  }
);

assert.equal(Product.stats.returns.arg, 'stats');
assert.equal(Product.stats.returns.type, 'array');
assert.equal(Product.stats.http.path, '/info');
assert.equal(Product.stats.http.verb, 'get');
assert.equal(Product.stats.shared, true);
```

<a name="datasource"></a>
# DataSource
<a name="datasource-datasourcecreatemodelname-properties-settings"></a>
## dataSource.createModel(name, properties, settings)
Define a model and attach it to a `DataSource`..

```js
var Color = memory.createModel('color', {name: String});
assert.isFunc(Color, 'all');
assert.isFunc(Color, 'create');
assert.isFunc(Color, 'updateOrCreate');
assert.isFunc(Color, 'upsert');
assert.isFunc(Color, 'findOrCreate');
assert.isFunc(Color, 'exists');
assert.isFunc(Color, 'find');
assert.isFunc(Color, 'findOne');
assert.isFunc(Color, 'destroyAll');
assert.isFunc(Color, 'count');
assert.isFunc(Color, 'include');
assert.isFunc(Color, 'relationNameFor');
assert.isFunc(Color, 'hasMany');
assert.isFunc(Color, 'belongsTo');
assert.isFunc(Color, 'hasAndBelongsToMany');
assert.isFunc(Color.prototype, 'save');
assert.isFunc(Color.prototype, 'isNewRecord');
assert.isFunc(Color.prototype, 'destroy');
assert.isFunc(Color.prototype, 'updateAttribute');
assert.isFunc(Color.prototype, 'updateAttributes');
assert.isFunc(Color.prototype, 'reload');
```

<a name="datasource-datasourceoperations"></a>
## dataSource.operations()
List the enabled and disabled operations..

```js
// assert the defaults
// - true: the method should be remote enabled
// - false: the method should not be remote enabled
// - 
existsAndShared('_forDB', false);
existsAndShared('create', true);
existsAndShared('updateOrCreate', false);
existsAndShared('upsert', false);
existsAndShared('findOrCreate', false);
existsAndShared('exists', true);
existsAndShared('find', true);
existsAndShared('all', true);
existsAndShared('findOne', true);
existsAndShared('destroyAll', false);
existsAndShared('count', true);
existsAndShared('include', false);
existsAndShared('relationNameFor', false);
existsAndShared('hasMany', false);
existsAndShared('belongsTo', false);
existsAndShared('hasAndBelongsToMany', false);
existsAndShared('save', true);
existsAndShared('isNewRecord', false);
existsAndShared('_adapter', false);
existsAndShared('destroy', true);
existsAndShared('updateAttribute', true);
existsAndShared('updateAttributes', true);
existsAndShared('reload', true);

function existsAndShared(name, isRemoteEnabled) {
  var op = memory.getOperation(name);
  assert(op.remoteEnabled === isRemoteEnabled, name + ' ' + (isRemoteEnabled ? 'should' : 'should not') + ' be remote enabled');
}
```

<a name="model"></a>
# Model
<a name="model-modelvalidatespresenceofproperties"></a>
## Model.validatesPresenceOf(properties...)
Require a model to include a property to be considered valid..

```js
User.validatesPresenceOf('first', 'last', 'age');
var joe = new User({first: 'joe'});
assert(joe.isValid() === false, 'model should not validate');
assert(joe.errors.last, 'should have a missing last error');
assert(joe.errors.age, 'should have a missing age error');
```

<a name="model-modelvalidateslengthofproperty-options"></a>
## Model.validatesLengthOf(property, options)
Require a property length to be within a specified range..

```js
User.validatesLengthOf('password', {min: 5, message: {min: 'Password is too short'}});
var joe = new User({password: '1234'});
assert(joe.isValid() === false, 'model should not be valid');
assert(joe.errors.password, 'should have password error');
```

<a name="model-modelvalidatesinclusionofproperty-options"></a>
## Model.validatesInclusionOf(property, options)
Require a value for `property` to be in the specified array..

```js
User.validatesInclusionOf('gender', {in: ['male', 'female']});
var foo = new User({gender: 'bar'});
assert(foo.isValid() === false, 'model should not be valid');
assert(foo.errors.gender, 'should have gender error');
```

<a name="model-modelvalidatesexclusionofproperty-options"></a>
## Model.validatesExclusionOf(property, options)
Require a value for `property` to not exist in the specified array..

```js
User.validatesExclusionOf('domain', {in: ['www', 'billing', 'admin']});
var foo = new User({domain: 'www'});
var bar = new User({domain: 'billing'});
var bat = new User({domain: 'admin'});
assert(foo.isValid() ===  false);
assert(bar.isValid() === false);
assert(bat.isValid() === false);
assert(foo.errors.domain, 'model should have a domain error');
assert(bat.errors.domain, 'model should have a domain error');
assert(bat.errors.domain, 'model should have a domain error');
```

<a name="model-modelvalidatesnumericalityofproperty-options"></a>
## Model.validatesNumericalityOf(property, options)
Require a value for `property` to be a specific type of `Number`..

```js
User.validatesNumericalityOf('age', {int: true});
var joe = new User({age: 10.2});
assert(joe.isValid() === false);
var bob = new User({age: 0});
assert(bob.isValid() === true);
assert(joe.errors.age, 'model should have an age error');
```

<a name="model-modelvalidatesuniquenessofproperty-options"></a>
## Model.validatesUniquenessOf(property, options)
Ensure the value for `property` is unique..

```js
User.validatesUniquenessOf('email', {message: 'email is not unique'});

var joe = new User({email: 'joe@joe.com'});
var joe2 = new User({email: 'joe@joe.com'});

joe.save(function () {
  joe2.save(function (err) {
    assert(err, 'should get a validation error');
    assert(joe2.errors.email, 'model should have email error');
    
    done();
  });
});
```

<a name="model-mymodelisvalid"></a>
## myModel.isValid()
Validate the model instance..

```js
User.validatesNumericalityOf('age', {int: true});
var user = new User({first: 'joe', age: 'flarg'})
var valid = user.isValid();
assert(valid === false);
assert(user.errors.age, 'model should have age error');
```

Asynchronously validate the model..

```js
User.validatesNumericalityOf('age', {int: true});
var user = new User({first: 'joe', age: 'flarg'})
user.isValid(function (valid) {
  assert(valid === false);
  assert(user.errors.age, 'model should have age error');
  done();
});
```

<a name="model-modelattachtodatasource"></a>
## Model.attachTo(dataSource)
Attach a model to a [DataSource](#data-source).

```js
var MyModel = loopback.createModel('my-model', {name: String});

assert(MyModel.all === undefined, 'should not have data access methods');

MyModel.attachTo(memory);

assert(typeof MyModel.all === 'function', 'should have data access methods after attaching to a data source');
```

<a name="model-modelcreatedata-callback"></a>
## Model.create([data], [callback])
Create an instance of Model with given data and save to the attached data source..

```js
User.create({first: 'Joe', last: 'Bob'}, function(err, user) {
  assert(user instanceof User);
  done();
});
```

<a name="model-modelsaveoptions-callback"></a>
## model.save([options], [callback])
Save an instance of a Model to the attached data source..

```js
var joe = new User({first: 'Joe', last: 'Bob'});
joe.save(function(err, user) {
  assert(user.id);
  assert(!err);
  assert(!user.errors);
  done();
});
```

<a name="model-modelupdateattributesdata-callback"></a>
## model.updateAttributes(data, [callback])
Save specified attributes to the attached data source..

```js
User.create({first: 'joe', age: 100}, function (err, user) {
  assert(!err);
  assert.equal(user.first, 'joe');
  
  user.updateAttributes({
    first: 'updatedFirst',
    last: 'updatedLast'
  }, function (err, updatedUser) {
    assert(!err);
    assert.equal(updatedUser.first, 'updatedFirst');
    assert.equal(updatedUser.last, 'updatedLast');
    assert.equal(updatedUser.age, 100);
    done();
  });
});
```

<a name="model-modelupsertdata-callback"></a>
## Model.upsert(data, callback)
Update when record with id=data.id found, insert otherwise.

```js
User.upsert({first: 'joe', id: 7}, function (err, user) {
  assert(!err);
  assert.equal(user.first, 'joe');
  
  User.upsert({first: 'bob', id: 7}, function (err, updatedUser) {
    assert(!err);
    assert.equal(updatedUser.first, 'bob');
    done();
  });
});
```

<a name="model-modeldestroycallback"></a>
## model.destroy([callback])
Remove a model from the attached data source..

```js
User.create({first: 'joe', last: 'bob'}, function (err, user) {
  User.find(user.id, function (err, foundUser) {
    assert.equal(user.id, foundUser.id);
    foundUser.destroy(function () {
      User.find(user.id, function (err, notFound) {
        assert(!err);
        assert.equal(notFound, null);
        done();
      });
    });
  });
});
```

<a name="model-modeldestroyallcallback"></a>
## Model.destroyAll(callback)
Delete all Model instances from data source.

```js
(new TaskEmitter())
  .task(User, 'create', {first: 'jill'})
  .task(User, 'create', {first: 'bob'})
  .task(User, 'create', {first: 'jan'})
  .task(User, 'create', {first: 'sam'})
  .task(User, 'create', {first: 'suzy'})
  .on('done', function () {
    User.count(function (err, count) {
      assert.equal(count, 5);
      User.destroyAll(function () {
        User.count(function (err, count) {
          assert.equal(count, 0);
          done();
        });
      });
    });
  });
```

<a name="model-modelfindid-callback"></a>
## Model.find(id, callback)
Find instance by id..

```js
User.create({first: 'michael', last: 'jordan', id: 23}, function () {
  User.find(23, function (err, user) {
    assert.equal(user.id, 23);
    assert.equal(user.first, 'michael');
    assert.equal(user.last, 'jordan');
    done();
  });
});
```

<a name="model-modelcountquery-callback"></a>
## Model.count([query], callback)
Query count of Model instances in data source.

```js
(new TaskEmitter())
  .task(User, 'create', {first: 'jill', age: 100})
  .task(User, 'create', {first: 'bob', age: 200})
  .task(User, 'create', {first: 'jan'})
  .task(User, 'create', {first: 'sam'})
  .task(User, 'create', {first: 'suzy'})
  .on('done', function () {
    User.count({age: {gt: 99}}, function (err, count) {
      assert.equal(count, 2);
      done();
    });
  });
```

<a name="model-remote-methods"></a>
## Remote Methods
<a name="model-remote-methods-example-remote-method"></a>
### Example Remote Method
Call the method using HTTP / REST.

```js
request(app)
  .get('/users/sign-in?username=foo&password=bar')
  .expect('Content-Type', /json/)
  .expect(200)
  .end(function(err, res){
    if(err) return done(err);
    assert(res.body.$data === 123);
    done();
  });
```

<a name="model-remote-methods-modelbeforeremotename-fn"></a>
### Model.beforeRemote(name, fn)
Run a function before a remote method is called by a client..

```js
var hookCalled = false;

User.beforeRemote('*.save', function(ctx, user, next) {
  hookCalled = true;
  next();
});

// invoke save
request(app)
  .post('/users')
  .send({data: {first: 'foo', last: 'bar'}})
  .expect('Content-Type', /json/)
  .expect(200)
  .end(function(err, res) {
    if(err) return done(err);
    assert(hookCalled, 'hook wasnt called');
    done();
  });
```

<a name="model-remote-methods-modelafterremotename-fn"></a>
### Model.afterRemote(name, fn)
Run a function after a remote method is called by a client..

```js
var beforeCalled = false;
var afterCalled = false;

User.beforeRemote('*.save', function(ctx, user, next) {
  assert(!afterCalled);
  beforeCalled = true;
  next();
});
User.afterRemote('*.save', function(ctx, user, next) {
  assert(beforeCalled);
  afterCalled = true;
  next();
});

// invoke save
request(app)
  .post('/users')
  .send({data: {first: 'foo', last: 'bar'}})
  .expect('Content-Type', /json/)
  .expect(200)
  .end(function(err, res) {
    if(err) return done(err);
    assert(beforeCalled, 'before hook was not called');
    assert(afterCalled, 'after hook was not called');
    done();
  });
```

<a name="model-remote-methods-remote-method-invoking-context"></a>
### Remote Method invoking context
<a name="model-remote-methods-remote-method-invoking-context-ctxreq"></a>
#### ctx.req
The express ServerRequest object.

```js
var hookCalled = false;

User.beforeRemote('*.save', function(ctx, user, next) {
  hookCalled = true;
  assert(ctx.req);
  assert(ctx.req.url);
  assert(ctx.req.method);
  assert(ctx.res);
  assert(ctx.res.write);
  assert(ctx.res.end);
  next();
});
        
// invoke save
request(app)
  .post('/users')
  .send({data: {first: 'foo', last: 'bar'}})
  .expect('Content-Type', /json/)
  .expect(200)
  .end(function(err, res) {
    if(err) return done(err);
    assert(hookCalled);
    done();
  });
```

<a name="model-remote-methods-remote-method-invoking-context-ctxres"></a>
#### ctx.res
The express ServerResponse object.

```js
var hookCalled = false;

User.beforeRemote('*.save', function(ctx, user, next) {
  hookCalled = true;
  assert(ctx.req);
  assert(ctx.req.url);
  assert(ctx.req.method);
  assert(ctx.res);
  assert(ctx.res.write);
  assert(ctx.res.end);
  next();
});
        
// invoke save
request(app)
  .post('/users')
  .send({data: {first: 'foo', last: 'bar'}})
  .expect('Content-Type', /json/)
  .expect(200)
  .end(function(err, res) {
    if(err) return done(err);
    assert(hookCalled);
    done();
  });
```

<a name="model-modelhasmanymodel"></a>
## Model.hasMany(Model)
Define a one to many relationship..

```js
var Book = memory.createModel('book', {title: String, author: String});
var Chapter = memory.createModel('chapter', {title: String});

// by referencing model
Book.hasMany(Chapter);

Book.create({title: 'Into the Wild', author: 'Jon Krakauer'}, function(err, book) {
  // using 'chapters' scope for build:
  var c = book.chapters.build({title: 'Chapter 1'});
  book.chapters.create({title: 'Chapter 2'}, function () {
    c.save(function () {
      Chapter.count({bookId: book.id}, function (err, count) {
        assert.equal(count, 2);
        book.chapters({where: {title: 'Chapter 1'}}, function(err, chapters) {
          assert.equal(chapters.length, 1);
          assert.equal(chapters[0].title, 'Chapter 1');
          done();
        });
      });
    });
  });
});
```

