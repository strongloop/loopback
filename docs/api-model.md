### Model

A Loopback `Model` is a vanilla JavaScript class constructor with an attached set of properties and options. A `Model` instance is created by passing a data object containing properties to the `Model` constructor. A `Model` constructor will clean the object passed to it and only set the values matching the properties you define.

```js
// valid color
var Color = loopback.createModel('color', {name: String});
var red = new Color({name: 'red'});
console.log(red.name); // red

// invalid color
var foo = new Color({bar: 'bat baz'});
console.log(foo.bar); // undefined
```

**Properties**

A model defines a list of property names, types and other validation metadata. A [DataSource](#data-source) uses this definition to validate a `Model` during operations such as `save()`.

**Options**

Some [DataSources](#data-source) may support additional `Model` options.

Define A Loopbackmodel.

```js
var User = loopback.createModel('user', {
  first: String,
  last: String,
  age: Number
});
```

#### Validation (expiremental)

##### Model.validatesFormatOf(property, options)

Require a model to include a property that matches the given format.

```js
User.validatesFormat('name', {with: /\w+/});
```

##### Model.validatesPresenceOf(properties...)

Require a model to include a property to be considered valid.

```js
User.validatesPresenceOf('first', 'last', 'age');
```

##### Model.validatesLengthOf(property, options)

Require a property length to be within a specified range.

```js
User.validatesLengthOf('password', {min: 5, message: {min: 'Password is too short'}});
```

##### Model.validatesInclusionOf(property, options)

Require a value for `property` to be in the specified array.

```js
User.validatesInclusionOf('gender', {in: ['male', 'female']});
```

##### Model.validatesExclusionOf(property, options)

Require a value for `property` to not exist in the specified array.

```js
User.validatesExclusionOf('domain', {in: ['www', 'billing', 'admin']});
```

##### Model.validatesNumericalityOf(property, options)

Require a value for `property` to be a specific type of `Number`.

```js
User.validatesNumericalityOf('age', {int: true});
```

##### Model.validatesUniquenessOf(property, options)

Ensure the value for `property` is unique in the collection of models.

```js
User.validatesUniquenessOf('email', {message: 'email is not unique'});
```

**Note:** not available for all [connectors](#connectors).

Currently supported in these connectors:

 - [In Memory](#memory-connector)
 - [Oracle](http://github.com/strongloop/loopback-connector-oracle)
 - [MongoDB](http://github.com/strongloop/loopback-connector-mongodb)

##### myModel.isValid()

Validate the model instance.

```js
user.isValid(function (valid) {
    if (!valid) {
        console.log(user.errors);
        // => hash of errors
        // => {
        // =>   username: [errmessage, errmessage, ...],
        // =>   email: ...
        // => }    
    }
});
```

#### Model.properties

An object containing a normalized set of properties supplied to `loopback.createModel(name, properties)`.

Example:

```js
var props = {
  a: String,
  b: {type: 'Number'},
  c: {type: 'String', min: 10, max: 100},
  d: Date,
  e: loopback.GeoPoint
};

var MyModel = loopback.createModel('foo', props);

console.log(MyModel.properties);
```

Outputs:

```js
{
  "a": {type: String},
  "b": {type: Number},
  "c": {
    "type": String,
    "min": 10,
    "max": 100
  },
  "d": {type: Date},
  "e": {type: GeoPoint},
  "id": {
    "id": 1
  }
}
```

#### Model.attachTo(dataSource)

Attach a model to a [DataSource](#data-source). Attaching a [DataSource](#data-source) updates the model with additional methods and behaviors.

```js
var oracle = loopback.createDataSource({
  connector: require('loopback-connector-oracle'),
  host: '111.22.333.44',
  database: 'MYDB',
  username: 'username',
  password: 'password'
});

User.attachTo(oracle);
```
    
**Note:** until a model is attached to a data source it will **not** have any **attached methods**.

#### CRUD and Query Mixins

Mixins are added by attaching a vanilla model to a [data source](#data-source) with a [connector](#connectors). Each [connector](#connectors) enables its own set of operations that are mixed into a `Model` as methods. To see available methods for a data source call `dataSource.operations()`.

Log the available methods for a memory data source.

```js
var ops = loopback
    .createDataSource({connector: loopback.Memory})
    .operations();

console.log(Object.keys(ops));
```

Outputs:

```js
[ 'create',
  'updateOrCreate',
  'upsert',
  'findOrCreate',
  'exists',
  'findById',
  'find',
  'all',
  'findOne',
  'destroyAll',
  'deleteAll',
  'count',
  'include',
  'relationNameFor',
  'hasMany',
  'belongsTo',
  'hasAndBelongsToMany',
  'save',
  'isNewRecord',
  'destroy',
  'delete',
  'updateAttribute',
  'updateAttributes',
  'reload' ]
```
      
Here is the definition of the `count()` operation.

```js
{
  accepts: [ { arg: 'where', type: 'object' } ],
  http: { verb: 'get', path: '/count' },
  remoteEnabled: true,
  name: 'count'
}
```

#### Static Methods

**Note:** These are the default mixin methods for a `Model` attached to a data source. See the specific connector for additional API documentation.

##### Model.create(data, [callback])

Create an instance of Model with given data and save to the attached data source. Callback is optional.

```js
User.create({first: 'Joe', last: 'Bob'}, function(err, user) {
  console.log(user instanceof User); // true
});
```
    
**Note:** You must include a callback and use the created model provided in the callback if your code depends on your model being saved or having an `id`.

##### Model.count([query], callback)

Query count of Model instances in data source. Optional query param allows to count filtered set of Model instances.

```js
User.count({approved: true}, function(err, count) {
  console.log(count); // 2081
});
```

##### Model.find(filter, callback)

Find all instances of Model, matched by query. Fields used for filter and sort should be declared with `{index: true}` in model definition.

**filter**

 - **where** `Object` { key: val, key2: {gt: 'val2'}} The search criteria
   - Format: {key: val} or {key: {op: val}}
   - Operations:
     - gt: >
     - gte: >=
     - lt: <
     - lte: <=
     - between
     - inq: IN
     - nin: NOT IN
     - neq: !=
     - like: LIKE
     - nlike: NOT LIKE

 - **include** `String`, `Object` or `Array` Allows you to load relations of several objects and optimize numbers of requests.
    - Format:
      - 'posts': Load posts
      - ['posts', 'passports']: Load posts and passports
      - {'owner': 'posts'}: Load owner and owner's posts
      - {'owner': ['posts', 'passports']}: Load owner, owner's posts, and owner's passports
      - {'owner': [{posts: 'images'}, 'passports']}: Load owner, owner's posts, owner's posts' images, and owner's passports

 - **order** `String` The sorting order
   - Format: 'key1 ASC, key2 DESC'

 - **limit** `Number` The maximum number of instances to be returned
 - **skip** `Number` Skip the number of instances
 - **offset** `Number` Alias for skip

 - **fields** `Object|Array|String` The included/excluded fields
  - `['foo']` or `'foo'` - include only the foo property
  - `['foo', 'bar']` - include the foo and bar properties
  - `{foo: true}` - include only foo
  - `{bat: false}` - include all properties, exclude bat

Find the second page of 10 users over age 21 in descending order exluding the password property.

```js
User.find({
  where: {
    age: {gt: 21}},
    order: 'age DESC',
    limit: 10,
    skip: 10,
    fields: {password: false}
  },
  console.log
);
```

**Note:** See the specific connector's [docs](#connectors) for more info.

##### Model.destroyAll(callback)

Delete all Model instances from data source. **Note:** destroyAll method does not perform destroy hooks.

##### Model.findById(id, callback)

Find instance by id.

```js
User.findById(23, function(err, user) {
  console.info(user.id); // 23
});
```

##### Model.findOne(where, callback)

Find a single instance that matches the given where expression.

```js
User.findOne({id: 23}, function(err, user) {
  console.info(user.id); // 23
});
```
    
##### Model.upsert(data, callback)

Update when record with id=data.id found, insert otherwise. **Note:** no setters, validations or hooks applied when using upsert.

##### Custom Static Methods

Define a static model method.

```js
User.login = function (username, password, fn) {
  var passwordHash = hashPassword(password);
  this.findOne({username: username}, function (err, user) {
    var failErr = new Error('login failed');

    if(err) {
      fn(err);
    } else if(!user) {
      fn(failErr);
    } else if(user.password === passwordHash) {
      MySessionModel.create({userId: user.id}, function (err, session) {
        fn(null, session.id);
      });
    } else {
      fn(failErr);
    }
  });
}
```
    
Setup the static model method to be exposed to clients as a [remote method](#remote-method). 

```js
loopback.remoteMethod(
  User.login,
  {
    accepts: [
      {arg: 'username', type: 'string', required: true},
      {arg: 'password', type: 'string', required: true}
    ],
    returns: {arg: 'sessionId', type: 'any'},
    http: {path: '/sign-in'}
  }
);
```
    
#### Instance Methods

**Note:** These are the default mixin methods for a `Model` attached to a data source. See the specific connector for additional API documentation.

##### model.save([options], [callback])

Save an instance of a Model to the attached data source.

```js
var joe = new User({first: 'Joe', last: 'Bob'});
joe.save(function(err, user) {
  if(user.errors) {
    console.log(user.errors);
  } else {
    console.log(user.id);
  }
});
```

##### model.updateAttributes(data, [callback])
    
Save specified attributes to the attached data source.

```js
user.updateAttributes({
  first: 'updatedFirst',
  name: 'updatedLast'
}, fn);
```

##### model.destroy([callback])

Remove a model from the attached data source.

```js
model.destroy(function(err) {
  // model instance destroyed
});
```

##### Custom Instance Methods

Define an instance method.

```js
User.prototype.logout = function (fn) {
  MySessionModel.destroyAll({userId: this.id}, fn);
}
```
    
Define a remote model instance method.

```js
loopback.remoteMethod(User.prototype.logout)
```

#### Remote Methods

Both instance and static methods can be exposed to clients. A remote method must accept a callback with the conventional `fn(err, result, ...)` signature. 

##### loopback.remoteMethod(fn, [options])

Expose a remote method.

```js
Product.stats = function(fn) {
  var statsResult = {
    totalPurchased: 123456
  };
  var err = null;
  
  // callback with an error and the result
  fn(err, statsResult);
}

loopback.remoteMethod(
  Product.stats,
  {
    returns: {arg: 'stats', type: 'object'},
    http: {path: '/info', verb: 'get'}
  }
);
```

**Options**

 - **accepts** - (optional) an arguments description specifying the remote method's arguments.
 - **returns** - (optional) an arguments description specifying the remote methods callback arguments.
 - **http** - (advanced / optional, object) http routing info
  - **http.path** - the path relative to the model the method will be exposed at. May be a path fragment (eg. '/:myArg') which will be populated by an arg of the same name in the accepts description. For example the stats method above will be at the whole path `/products/stats`.
  - **http.verb** - (get, post, put, del, all) - the route verb the method will be available from.
 
**Argument Description**

An arguments description defines either a single argument as an object or an ordered set of arguments as an array.

```js
// examples
{arg: 'myArg', type: 'number'}

[
  {arg: 'arg1', type: 'number', required: true},
  {arg: 'arg2', type: 'array'}
]
```

**Types**

Each argument may define any of the [loopback types](#loopback-types).

**Notes:**

  - The callback is an assumed argument and does not need to be specified in the accepts array.
  - The err argument is also assumed and does not need to be specified in the returns array.

#### Remote Hooks

Run a function before or after a remote method is called by a client.

```js
// *.save === prototype.save
User.beforeRemote('*.save', function(ctx, user, next) {
  if(ctx.user) {
    next();
  } else {
    next(new Error('must be logged in to update'))
  }
});

User.afterRemote('*.save', function(ctx, user, next) {
  console.log('user has been saved', user);
  next();
});
```
    
Remote hooks also support wildcards. Run a function before any remote method is called.

```js
// ** will match both prototype.* and *.*
User.beforeRemote('**', function(ctx, user, next) {
  console.log(ctx.methodString, 'was invoked remotely'); // users.prototype.save was invoked remotely
  next();
});
```
    
Other wildcard examples

```js
// run before any static method eg. User.find
User.beforeRemote('*', ...);

// run before any instance method eg. User.prototype.save
User.beforeRemote('prototype.*', ...);

// prevent password hashes from being sent to clients
User.afterRemote('**', function (ctx, user, next) {
  if(ctx.result) {
    if(Array.isArray(ctx.result)) {
      ctx.result.forEach(function (result) {
        result.password = undefined;
      });
    } else {
      ctx.result.password = undefined;
    }
  }

  next();
});
```
    
#### Context

Remote hooks are provided with a Context `ctx` object which contains transport specific data (eg. for http: `req` and `res`). The `ctx` object also has a set of consistent apis across transports.

##### ctx.user

A `Model` representing the user calling the method remotely. **Note:** this is undefined if the remote method is not invoked by a logged in user.

##### ctx.result

During `afterRemote` hooks, `ctx.result` will contain the data about to be sent to a client. Modify this object to transform data before it is sent. 

##### Rest

When [loopback.rest](#loopbackrest) is used the following `ctx` properties are available.

###### ctx.req

The express ServerRequest object. [See full documentation](http://expressjs.com/api.html#req).

###### ctx.res

The express ServerResponse object. [See full documentation](http://expressjs.com/api.html#res).
    
#### Relationships

##### Model.hasMany(Model, options)

Define a "one to many" relationship.

```js
// by referencing model
Book.hasMany(Chapter);
// specify the name
Book.hasMany('chapters', {model: Chapter});
```
    
Query and create the related models.

```js
Book.create(function(err, book) {
  // create a chapter instance
  // ready to be saved in the data source
  var chapter = book.chapters.build({name: 'Chapter 1'});
  
  // save the new chapter
  chapter.save();
  
  // you can also call the Chapter.create method with
  // the `chapters` property which will build a chapter
  // instance and save the it in the data source
  book.chapters.create({name: 'Chapter 2'}, function(err, savedChapter) {
    // this callback is optional
  });

  // query chapters for the book using the 
  book.chapters(function(err, chapters) {
    // all chapters with bookId = book.id
    console.log(chapters);
  });
  
  book.chapters({where: {name: 'test'}, function(err, chapters) {
    // all chapters with bookId = book.id and name = 'test'
    console.log(chapters);
  });
});
```

##### Model.belongsTo(Model, options)

A `belongsTo` relation sets up a one-to-one connection with another model, such
that each instance of the declaring model "belongs to" one instance of the other
model. For example, if your application includes users and posts, and each post
can be written by exactly one user.

```js
    Post.belongsTo(User, {as: 'author', foreignKey: 'userId'});
```

The code above basically says Post has a reference called `author` to User using
the `userId` property of Post as the foreign key. Now we can access the author
in one of the following styles:

```js
    post.author(callback); // Get the User object for the post author asynchronously
    post.author(); // Get the User object for the post author synchronously
    post.author(user) // Set the author to be the given user
```

##### Model.hasAndBelongsToMany(Model, options)

A `hasAndBelongsToMany` relation creates a direct many-to-many connection with
another model, with no intervening model. For example, if your application
includes users and groups, with each group having many users and each user
appearing in many groups, you could declare the models this way,

```js
    User.hasAndBelongsToMany('groups', {model: Group, foreignKey: 'groupId'});
    user.groups(callback); // get groups of the user
    user.groups.create(data, callback); // create a new group and connect it with the user
    user.groups.add(group, callback); // connect an existing group with the user
    user.groups.remove(group, callback); // remove the user from the group
```
    
#### Shared Methods

Any static or instance method can be decorated as `shared`. These methods are exposed over the provided transport (eg. [loopback.rest](#rest)).
