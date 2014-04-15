## Model object

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

### Methods

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
    
NOTE: until a model is attached to a data source it will not have any attached methods.

### Properties

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

### CRUD and Query Mixins

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

### Static Methods

**Note:** These are the default mixin methods for a `Model` attached to a data source. See the specific connector for additional API documentation.

#### Model.create(data, [callback])

Create an instance of Model with given data and save to the attached data source. Callback is optional.

```js
User.create({first: 'Joe', last: 'Bob'}, function(err, user) {
  console.log(user instanceof User); // true
});
```
    
**Note:** You must include a callback and use the created model provided in the callback if your code depends on your model being saved or having an `id`.

#### Model.count([query], callback)

Query count of Model instances in data source. Optional query param allows to count filtered set of Model instances.

```js
User.count({approved: true}, function(err, count) {
  console.log(count); // 2081
});
```

#### Model.find(filter, callback)

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

#### Model.destroyAll([where], callback)

Delete all Model instances from data source. **Note:** destroyAll method does not perform destroy hooks.

```js
Product.destroyAll({price: {gt: 99}}, function(err) {
  // removed matching products
});
```

> **NOTE:* `where` is optional and a where object... do NOT pass a filter object

#### Model.findById(id, callback)

Find instance by id.

```js
User.findById(23, function(err, user) {
  console.info(user.id); // 23
});
```

#### Model.findOne(where, callback)

Find a single instance that matches the given where expression.

```js
User.findOne({where: {id: 23}}, function(err, user) {
  console.info(user.id); // 23
});
```
    
#### Model.upsert(data, callback)

Update when record with id=data.id found, insert otherwise. **Note:** no setters, validations or hooks applied when using upsert.

#### Custom static methods

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
      MyAccessTokenModel.create({userId: user.id}, function (err, accessToken) {
        fn(null, accessToken.id);
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
    
### Instance methods

**Note:** These are the default mixin methods for a `Model` attached to a data source. See the specific connector for additional API documentation.

#### model.save([options], [callback])

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

#### model.updateAttributes(data, [callback])
    
Save specified attributes to the attached data source.

```js
user.updateAttributes({
  first: 'updatedFirst',
  name: 'updatedLast'
}, fn);
```

#### model.destroy([callback])

Remove a model from the attached data source.

```js
model.destroy(function(err) {
  // model instance destroyed
});
```

#### Custom instance methods

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

### Relationships

#### Model.hasMany(Model, options)

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

#### Model.belongsTo(Model, options)

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

#### Model.hasAndBelongsToMany(Model, options)

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
    
### Validations

#### Model.validatesFormatOf(property, options)

Require a model to include a property that matches the given format.

```js
User.validatesFormat('name', {with: /\w+/});
```

#### Model.validatesPresenceOf(properties...)

Require a model to include a property to be considered valid.

```js
User.validatesPresenceOf('first', 'last', 'age');
```

#### Model.validatesLengthOf(property, options)

Require a property length to be within a specified range.

```js
User.validatesLengthOf('password', {min: 5, message: {min: 'Password is too short'}});
```

#### Model.validatesInclusionOf(property, options)

Require a value for `property` to be in the specified array.

```js
User.validatesInclusionOf('gender', {in: ['male', 'female']});
```

#### Model.validatesExclusionOf(property, options)

Require a value for `property` to not exist in the specified array.

```js
User.validatesExclusionOf('domain', {in: ['www', 'billing', 'admin']});
```

#### Model.validatesNumericalityOf(property, options)

Require a value for `property` to be a specific type of `Number`.

```js
User.validatesNumericalityOf('age', {int: true});
```

#### Model.validatesUniquenessOf(property, options)

Ensure the value for `property` is unique in the collection of models.

```js
User.validatesUniquenessOf('email', {message: 'email is not unique'});
```

**Note:** not available for all [connectors](#connectors).

Currently supported in these connectors:

 - [In Memory](#memory-connector)
 - [Oracle](http://github.com/strongloop/loopback-connector-oracle)
 - [MongoDB](http://github.com/strongloop/loopback-connector-mongodb)

#### myModel.isValid()

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

#### loopback.ValidationError

`ValidationError` is raised when the application attempts to save an invalid
model instance.

Example:

```js
{
  "name": "ValidationError",
  "status": 422,
  "message": "The Model instance is not valid. \
     See `details` property of the error object for more info.",
  "statusCode": 422,
  "details": {
    "context": "user",
    "codes": {
      "password": [
        "presence"
      ],
      "email": [
        "uniqueness"
      ]
    },
    "messages": {
      "password": [
        "can't be blank"
      ],
      "email": [
        "Email already exists"
      ]
    }
  },
}
```

You might run into situations where you need to raise a validation error
yourself, for example in a "before" hook or a custom model method.

```js
MyModel.prototype.preflight = function(changes, callback) {
  // Update properties, do not save to db
  for (var key in changes) {
    model[key] = changes[key];
  }

  if (model.isValid()) {
    return callback(null, { success: true });
  }

  // This line shows how to create a ValidationError
  err = new ValidationError(model);
  callback(err);
}
```

### Shared methods

Any static or instance method can be decorated as `shared`. These methods are exposed over the provided transport (eg. [loopback.rest](#rest)).
