# loopback

v0.9.0

## Install

    slnode install loopback -g
    
## Server API

 - [App](#app)
 - [Model](#model)
 - [DataSource](#data-source)
 - [Connectors](#connectors)
 - [Loopback Types](#loopback-types)
  - [GeoPoint](#geo-point)
 - [REST Router](#rest-router)
 - [Bundled Models](#bundled-models)
  - [User](#user-model)
  - [Session](#session-model) 
  - [Email](#email-model)

## Client API

_TODO_

### App

Create a Loopback application.

    var loopback = require('loopback');
    var app = loopback();

    app.get('/', function(req, res){
      res.send('hello world');
    });

    app.listen(3000);
    
**Notes:**

 - extends [express](http://expressjs.com/api.html#express)
 - see [express docs](http://expressjs.com/api.html) for details
 - supports [express / connect middleware](http://expressjs.com/api.html#middleware) 

#### app.model(Model)

Expose a `Model` to remote clients.

    // create a testing data source
    var memory = loopback.memory();
    var Color = memory.createModel('color', {name: String});
    Color.attachTo(memory);

    app.model(Color);
    app.use(loopback.rest());
    
**Note:** this will expose all [shared methods](#shared-methods) on the model.
    
#### app.models()

Get the app's exposed models.

    var models = app.models();
    
    models.forEach(function (Model) {
      console.log(Model.modelName); // color
    });
    
#### app.docs(options)

Enable swagger REST api documentation.

**Options**

 - `basePath` The basepath for your API - eg. 'http://localhost:3000'.

**Example**
   
    // enable docs
    app.docs({basePath: 'http://localhost:3000'});
    
Run your app then navigate to [the api explorer](http://petstore.swagger.wordnik.com/). Enter your API basepath to view your generated docs.
    
### Model

A Loopback `Model` is a vanilla JavaScript class constructor with an attached set of properties and options. A `Model` instance is created by passing a data object containing properties to the `Model` constructor. A `Model` constructor will clean the object passed to it and only set the values matching the properties you define.

    // valid color
    var Color = loopback.createModel('color', {name: String});
    var red = new Color({name: 'red'});
    console.log(red.name); // red
    
    // invalid color
    var foo = new Color({bar: 'bat baz'});
    console.log(foo.bar); // undefined

**Properties**

A model defines a list of property names, types and other validation metadata. A [DataSource](#data-source) uses this definition to validate a `Model` during operations such as `save()`.

**Options**

Some [DataSources](#data-source) may support additional `Model` options.

Define A Loopbackmodel.

    var User = loopback.createModel('user', {
      first: String,
      last: String,
      age: Number
    });

### Validation (expiremental)

#### Model.validatesFormatOf(property, options)

Require a model to include a property that matches the given format.

    User.validatesFormat('name', {with: /\w+/});

#### Model.validatesPresenceOf(properties...)

Require a model to include a property to be considered valid.

    User.validatesPresenceOf('first', 'last', 'age');

#### Model.validatesLengthOf(property, options)

Require a property length to be within a specified range.

    User.validatesLengthOf('password', {min: 5, message: {min: 'Password is too short'}});

#### Model.validatesInclusionOf(property, options)

Require a value for `property` to be in the specified array.

    User.validatesInclusionOf('gender', {in: ['male', 'female']});

#### Model.validatesExclusionOf(property, options)

Require a value for `property` to not exist in the specified array.

    User.validatesExclusionOf('domain', {in: ['www', 'billing', 'admin']});

#### Model.validatesNumericalityOf(property, options)

Require a value for `property` to be a specific type of `Number`.

    User.validatesNumericalityOf('age', {int: true});

#### Model.validatesUniquenessOf(property, options)

Ensure the value for `property` is unique in the collection of models.

    User.validatesUniquenessOf('email', {message: 'email is not unique'});

**Note:** not available for all [connectors](#connectors).

Currently supported in these connectors:

 - [In Memory](#memory-connector)
 - [Oracle](http://github.com/strongloop/loopback-connector-oracle)
 - [MongoDB](http://github.com/strongloop/loopback-connector-mongodb)

#### myModel.isValid()

Validate the model instance.

    user.isValid(function (valid) {
        if (!valid) {
            user.errors // hash of errors {attr: [errmessage, errmessage, ...], attr: ...}    
        }
    });

#### Model.properties

An object containing a normalized set of properties supplied to `loopback.createModel(name, properties)`.

Example:

    var props = {
      a: String,
      b: {type: 'Number'},
      c: {type: 'String', min: 10, max: 100},
      d: Date,
      e: loopback.GeoPoint
    };

    var MyModel = loopback.createModel('foo', props);

    console.log(MyModel.properties);
    
Outputs:

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

#### Model.attachTo(dataSource)

Attach a model to a [DataSource](#data-source). Attaching a [DataSource](#data-source) updates the model with additional methods and behaviors.

    var oracle = loopback.createDataSource({
      connector: require('loopback-connector-oracle'),
      host: '111.22.333.44',
      database: 'MYDB',
      username: 'username',
      password: 'password'
    });

    User.attachTo(oracle);
    
**Note:** until a model is attached to a data source it will **not** have any **attached methods**.

#### CRUD and Query Mixins

Mixins are added by attaching a vanilla model to a [data source](#data-source) with a [connector](#connectors). Each [connector](#connectors) enables its own set of operations that are mixed into a `Model` as methods. To see available methods for a data source call `dataSource.operations()`.

Log the available methods for a memory data source.

    var ops = loopback
        .createDataSource({connector: loopback.Memory})
        .operations();
    
    console.log(Object.keys(ops));
    
Outputs:

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
      
Here is the definition of the `count()` operation.

    {
      accepts: [ { arg: 'where', type: 'object' } ],
      http: { verb: 'get', path: '/count' },
      remoteEnabled: true,
      name: 'count'
    }

#### Static Methods

**Note:** These are the default mixin methods for a `Model` attached to a data source. See the specific connector for additional API documentation.

##### Model.create(data, [callback])

Create an instance of Model with given data and save to the attached data source. Callback is optional.

    User.create({first: 'Joe', last: 'Bob'}, function(err, user) {
      console.log(user instanceof User); // true
    });
    
**Note:** You must include a callback and use the created model provided in the callback if your code depends on your model being saved or having an `id`.

##### Model.count([query], callback)

Query count of Model instances in data source. Optional query param allows to count filtered set of Model instances.

    User.count({approved: true}, function(err, count) {
      console.log(count); // 2081
    });

##### Model.find(filter, callback)

Find all instances of Model, matched by query. Fields used for filter and sort should be declared with `{index: true}` in model definition.

**filter**

 - **where** `Object` { key: val, key2: {gt: 'val2'}}
 - **include** `String`, `Object` or `Array`.
 - **order** `String`
 - **limit** `Number`
 - **skip** `Number`
 - **fields** `Object|Array|String`
  - `['foo']` or `'foo'` - include only the foo property 
  - `['foo', 'bar']` - include the foo and bar properties
  - `{foo: true}` - include only foo
  - `{bat: false}` - include all properties, exclude bat

Find the second page of 10 users over age 21 in descending order exluding the password property.

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

**Note:** See the specific connector's [docs](#connectors) for more info.

##### Model.destroyAll(callback)

Delete all Model instances from data source. **Note:** destroyAll method does not perform destroy hooks.

##### Model.findById(id, callback)

Find instance by id.

    User.findById(23, function(err, user) {
      console.info(user.id); // 23
    });

##### Model.findOne(where, callback)

Find a single instance that matches the given where expression.

    User.findOne({id: 23}, function(err, user) {
      console.info(user.id); // 23
    });
    
##### Model.upsert(data, callback)

Update when record with id=data.id found, insert otherwise. **Note:** no setters, validations or hooks applied when using upsert.

##### Custom Static Methods

Define a static model method.

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
    
Setup the static model method to be exposed to clients as a [remote method](#remote-method). 

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
    
#### Instance Methods

**Note:** These are the default mixin methods for a `Model` attached to a data source. See the specific connector for additional API documentation.

##### model.save([options], [callback])

Save an instance of a Model to the attached data source.

    var joe = new User({first: 'Joe', last: 'Bob'});
    joe.save(function(err, user) {
      if(user.errors) {
        console.log(user.errors);
      } else {
        console.log(user.id);
      }
    });

##### model.updateAttributes(data, [callback])
    
Save specified attributes to the attached data source.

    user.updateAttributes({
      first: 'updatedFirst',
      name: 'updatedLast'
    }, fn);

##### model.destroy([callback])

Remove a model from the attached data source.

    model.destroy(function(err) {
      // model instance destroyed
    });

##### Custom Instance Methods

Define an instance method.

    User.prototype.logout = function (fn) {
      MySessionModel.destroyAll({userId: this.id}, fn);
    }
    
Define a remote model instance method.

    loopback.remoteMethod(User.prototype.logout);

#### Remote Methods

Both instance and static methods can be exposed to clients. A remote method must accept a callback with the conventional `fn(err, result, ...)` signature. 

##### loopback.remoteMethod(fn, [options]);

Expose a remote method.

    Product.stats = function(fn) {
      var calc = require('./stats');
      
      Product.find(function(err, products) {
        var productStats = calc(products);
        fn(null, productStats);
      });
    }
    
    loopback.remoteMethod(
      Product.stats,
      {
        returns: {arg: 'stats', type: 'object'},
        http: {path: '/info', verb: 'get'}
      }
    );

**Options**

 - **accepts** - (optional) an arguments description specifying the remote method's arguments. A
 - **returns** - (optional) an arguments description specifying the remote methods callback arguments.
 - **http** - (advanced / optional, object) http routing info
  - **http.path** - the path relative to the model the method will be exposed at. May be a path fragment (eg. '/:myArg') which will be populated by an arg of the same name in the accepts description. For example the stats method above will be at the whole path `/products/stats`.
  - **http.verb** - (get, post, put, del, all) - the route verb the method will be available from.
 
**Argument Description**

An arguments description defines either a single argument as an object or an ordered set of arguments as an array.

    // examples
    {arg: 'myArg', type: 'number'}

    [
      {arg: 'arg1', type: 'number', required: true},
      {arg: 'arg2', type: 'array'}
    ]

**Types**

Each argument may define any of the [loopback types](#loopback-types).

**Notes:**

  - The callback is an assumed argument and does not need to be specified in the accepts array.
  - The err argument is also assumed and does not need to be specified in the returns array.

#### Remote Hooks

Run a function before or after a remote method is called by a client.

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
    
Remote hooks also support wildcards. Run a function before any remote method is called.

    // ** will match both prototype.* and *.*
    User.beforeRemote('**', function(ctx, user, next) {
      console.log(ctx.methodString, 'was invoked remotely'); // users.prototype.save was invoked remotely
      next();
    });
    
Other wildcard examples

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

Access the raw `req` object for the remote method call.
    
#### Relationships

##### Model.hasMany(Model)

Define a "one to many" relationship.

    // by referencing model
    Book.hasMany(Chapter);
    // specify the name
    Book.hasMany('chapters', {model: Chapter});
    
Query and create the related models.

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
    
#### Shared Methods

Any static or instance method can be decorated as `shared`. These methods are exposed over the provided transport (eg. [loopback.rest](#rest)).

### Data Source

A Loopback `DataSource` provides [Models](#model) with the ability to manipulate data. Attaching a `DataSource` to a `Model` adds [instance methods](#instance-methods) and [static methods](#static-methods) to the `Model`. The added methods may be [remote methods](#remote-methods).

Define a data source for persisting models.

    var oracle = loopback.createDataSource({
      connector: 'oracle',
      host: '111.22.333.44',
      database: 'MYDB',
      username: 'username',
      password: 'password'
    });
    
#### dataSource.createModel(name, properties, options)

Define a model and attach it to a `DataSource`.

    var Color = oracle.createModel('color', {name: String});

#### dataSource.discoverModelDefinitions([username], fn)

Discover a set of model definitions (table or collection names) based on tables or collections in a data source.

    oracle.discoverModelDefinitions(function (err, models) {
      models.forEach(function (def) {
        // def.name ~ the model name
        oracle.discoverSchema(null, def.name, function (err, schema) {
          console.log(schema);
        });
      });
    });
    
#### dataSource.discoverSchema([owner], name, fn)

Discover the schema of a specific table or collection.

**Example schema from oracle connector:**

    {
      "name": "Product",
      "options": {
        "idInjection": false,
        "oracle": {
          "schema": "BLACKPOOL",
          "table": "PRODUCT"
        }
      },
      "properties": {
        "id": {
          "type": "String",
          "required": true,
          "length": 20,
          "id": 1,
          "oracle": {
            "columnName": "ID",
            "dataType": "VARCHAR2",
            "dataLength": 20,
            "nullable": "N"
          }
        },
        "name": {
          "type": "String",
          "required": false,
          "length": 64,
          "oracle": {
            "columnName": "NAME",
            "dataType": "VARCHAR2",
            "dataLength": 64,
            "nullable": "Y"
          }
        },
        "audibleRange": {
          "type": "Number",
          "required": false,
          "length": 22,
          "oracle": {
            "columnName": "AUDIBLE_RANGE",
            "dataType": "NUMBER",
            "dataLength": 22,
            "nullable": "Y"
          }
        },
        "effectiveRange": {
          "type": "Number",
          "required": false,
          "length": 22,
          "oracle": {
            "columnName": "EFFECTIVE_RANGE",
            "dataType": "NUMBER",
            "dataLength": 22,
            "nullable": "Y"
          }
        },
        "rounds": {
          "type": "Number",
          "required": false,
          "length": 22,
          "oracle": {
            "columnName": "ROUNDS",
            "dataType": "NUMBER",
            "dataLength": 22,
            "nullable": "Y"
          }
        },
        "extras": {
          "type": "String",
          "required": false,
          "length": 64,
          "oracle": {
            "columnName": "EXTRAS",
            "dataType": "VARCHAR2",
            "dataLength": 64,
            "nullable": "Y"
          }
        },
        "fireModes": {
          "type": "String",
          "required": false,
          "length": 64,
          "oracle": {
            "columnName": "FIRE_MODES",
            "dataType": "VARCHAR2",
            "dataLength": 64,
            "nullable": "Y"
          }
        }
      }
    }

#### dataSource.enableRemote(operation)

Enable remote access to a data source operation. Each [connector](#connector) has its own set of set remotely enabled and disabled operations. You can always list these by calling `dataSource.operations()`.
    

#### dataSource.disableRemote(operation)

Disable remote access to a data source operation. Each [connector](#connector) has its own set of set enabled and disabled operations. You can always list these by calling `dataSource.operations()`.

    // all rest data source operations are
    // disabled by default
    var oracle = loopback.createDataSource({
      connector: require('loopback-connector-oracle'),
      host: '...',
      ...
    });
    
    // or only disable it as a remote method
    oracle.disableRemote('destroyAll');

**Notes:**

 - disabled operations will not be added to attached models
 - disabling the remoting for a method only affects client access (it will still be available from server models)
 - data sources must enable / disable operations before attaching or creating models

#### dataSource.operations()

List the enabled and disabled operations.

    console.log(oracle.operations());
    
Output:

    {
      find: {
        remoteEnabled: true,
        accepts: [...],
        returns: [...]
        enabled: true
      },
      save: {
        remoteEnabled: true,
        prototype: true,
        accepts: [...],
        returns: [...],
        enabled: true
      },
      ...
    }

#### Connectors

Create a data source with a specific connector. See **available connectors** for specific connector documentation. 

    var memory = loopback.createDataSource({
      connector: loopback.Memory
    });
    
**Available Connectors**
 
 - [In Memory](#memory-connector)
 - [REST](http://github.com/strongloop/loopback-connector-rest)
 - [Oracle](http://github.com/strongloop/loopback-connector-oracle)
 - [MongoDB](http://github.com/strongloop/loopback-connector-mongodb)
 - TODO - [MySQL](http://github.com/strongloop/loopback-connector-mysql)
 - TODO - [SQLite3](http://github.com/strongloop/loopback-connector-sqlite)
 - TODO - [Postgres](http://github.com/strongloop/loopback-connector-postgres)
 - TODO - [Redis](http://github.com/strongloop/loopback-connector-redis)
 - TODO - [CouchDB](http://github.com/strongloop/loopback-connector-couch)
 - TODO - [Firebird](http://github.com/strongloop/loopback-connector-firebird)

**Installing Connectors**

Include the connector in your package.json dependencies and run `npm install`.

    {
      "dependencies": {
        "loopback-connector-oracle": "latest"
      }
    }

##### Memory Connector

The built-in memory connector allows you to test your application without connecting to an actual persistent data source, such as a database. Although the memory connector is very well tested it is not recommended to be used in production. Creating a data source using the memory connector is very simple.

    // use the built in memory function
    // to create a memory data source
    var memory = loopback.memory();

    // or create it using the standard
    // data source creation api
    var memory = loopback.createDataSource({
      connector: loopback.Memory
    });
    
    // create a model using the
    // memory data source
    var properties = {
      name: String,
      price: Number
    };
    
    var Product = memory.createModel('product', properties);
    
    Product.create([
      {name: 'apple', price: 0.79},
      {name: 'pear', price: 1.29},
      {name: 'orange', price: 0.59},
    ], count);
    
    function count() {
      Product.count(console.log); // 3
    }

###### Operations

**CRUD / Query**

The memory connector supports all the standard [query and crud operations](#crud-and-query-mixins) to allow you to test your models against an in memory data source.

**GeoPoint Filtering**

The memory connector also supports geo-filtering when using the `find()` operation with an attached model. See [GeoPoint](#geopoint) for more information on geo-filtering.

### GeoPoint

Use the `GeoPoint` class.

    var GeoPoint = require('loopback').GeoPoint;

Embed a latitude / longitude point in a [Model](#model).

    var CoffeeShop = loopback.createModel('coffee-shop', {
      location: 'GeoPoint'
    });

Loopback Model's with a GeoPoint property and an attached DataSource may be queried using geo spatial filters and sorting.

Find the 3 nearest coffee shops.

    CoffeeShop.attachTo(oracle);
    var here = new GeoPoint({lat: 10.32424, lng: 5.84978});
    CoffeeShop.find({where: {location: {near: here}}, limit:3}, function(err, nearbyShops) {
      console.info(nearbyShops); // [CoffeeShop, ...]
    });

#### geoPoint.distanceTo(geoPoint, options)

Get the distance to another `GeoPoint`.

    var here = new GeoPoint({lat: 10, lng: 10});
    var there = new GeoPoint({lat: 5, lng: 5});
    console.log(here.distanceTo(there, {type: 'miles'})); // 438
 
#### GeoPoint.distanceBetween(a, b, options)

Get the distance between two points.

    GeoPoint.distanceBetween(here, there, {type: 'miles'}) // 438

#### Distance Types

**Note:** all distance methods use `miles` by default.

 - `miles`
 - `radians`
 - `kilometers`
 - `meters`
 - `miles`
 - `feet`
 - `degrees`

#### geoPoint.lat

The latitude point in degrees. Range: -90 to 90.

#### geoPoint.lng

The longitude point in degrees. Range: -180 to 180.

### Loopback Types

Various APIs in Loopback accept type descriptions (eg. [remote methods](#remote-methods), [loopback.createModel()](#model)). The following is a list of supported types.

 - `null` - JSON null
 - `Boolean` - JSON boolean
 - `Number` - JSON number
 - `String` - JSON string
 - `Object` - JSON object
 - `Array` - JSON array
 - `Date` - a JavaScript date object
 - `Buffer` - a node.js Buffer object
 - [GeoPoint](#geopoint) - A Loopback GeoPoint object.

## Bundled Models

The Loopback library is unopinioned in the way you define your app's data and logic. Loopback also bundles useful pre-built models for common use cases.

 - User - register and authenticate users of your app locally or against 3rd party services.
 - Email - send emails to your app users using smtp or 3rd party services.

Defining a model with `loopback.createModel()` is really just extending the base `loopback.Model` type using `loopback.Model.extend()`. The bundled models extend from the base `loopback.Model` allowing you to extend them arbitrarily.
 
### User Model

Register and authenticate users of your app locally or against 3rd party services.

#### Define a User Model

Extend a vanilla Loopback model using the built in User model.

    // create a data source
    var memory = loopback.memory();
 
    // define a User model
    var User = loopback.User.extend('user');
  
    // attach to the memory connector
    User.attachTo(memory);
    
    // also attach the session model to a data source
    User.session.attachTo(memory);
    
    // expose over the app's api
    app.model(User);
    
**Note:** By default the `loopback.User` model uses the `loopback.Session` model to persist sessions. You can change this by setting the `session` property.

**Note:** You must attach both the `User` and `User.session` model's to a data source!
    
#### User Creation

Create a user like any other model.

    // username and password are not required
    User.create({email: 'foo@bar.com', password: 'bar'}, function(err, user) {
      console.log(user);
    });

    
#### Login a User

Create a session for a user using the local auth strategy.

**Node.js**

    User.login({username: 'foo', password: 'bar'}, function(err, session) {
      console.log(session);
    });
    
**REST**

You must provide a username and password over rest. To ensure these values are encrypted, include these as part of the body and make sure you are serving your app over https (through a proxy or using the https node server).

    POST

      /users/login
      ...
      {
        "email": "foo@bar.com",
        "password": "bar"
      }
  
      ...
  
      200 OK
      {
        "sid": "1234abcdefg",
        "uid": "123"
      }

#### Logout a User

**Node.js**

    // login a user and logout
    User.login({"email": "foo@bar.com", "password": "bar"}, function(err, session) {
      User.logout(session.id, function(err) {
        // user logged out
      });
    });

    // logout a user (server side only)
    User.findOne({email: 'foo@bar.com'}, function(err, user) {
      user.logout();
    });
    
**REST**

    POST /users/logout
    ...
    {
      "sid": "<session id from user login>"
    }

#### Verify Email Addresses

Require a user to verify their email address before being able to login. This will send an email to the user containing a link to verify their address. Once the user follows the link they will be redirected to `/` and be able to login normally.

    User.requireEmailVerfication = true;
    User.afterRemote('create', function(ctx, user, next) {
      var options = {
        type: 'email',
        to: user.email,
        from: 'noreply@myapp.com',
        subject: 'Thanks for Registering at FooBar',
        text: 'Please verify your email address!'
        template: 'verify.ejs',
        redirect: '/'
      };
      
      user.verify(options, next);
    });
    

#### Send Reset Password Email

Send an email to the user's supplied email address containing a link to reset their password.
  
    User.reset(email, function(err) {
      console.log('email sent');
    });
    
#### Remote Password Reset

The password reset email will send users to a page rendered by loopback with fields required to reset the user's password. You may customize this template by defining a `resetTemplate` setting.

    User.settings.resetTemplate = 'reset.ejs';
    
#### Remote Password Reset Confirmation

Confirm the password reset.

    User.confirmReset(token, function(err) {
      console.log(err || 'your password was reset');
    });


### Session Model

Identify users by creating sessions when they connect to your loopback app. By default the `loopback.User` model uses the `loopback.Session` model to persist sessions. You can change this by setting the `session` property.

    // define a custom session model    
    var MySession = loopback.Session.extend('my-session');
    
    // define a custom User model
    var User = loopback.User.extend('user');
    
    // use the custom session model
    User.session = MySession;
    
    // attach both Session and User to a data source
    User.attachTo(loopback.memory());
    MySession.attachTo(loopback.memory());
    
### Email Model

Send emails from your loopback app.

### REST Router

Expose models over rest using the `loopback.rest` router.

    app.use(loopback.rest());
    
**REST Documentation**

View generated REST documentation by visiting: [http://localhost:3000/_docs](http://localhost:3000/_docs).
    
### SocketIO Middleware (Not Available)

**Coming Soon** - Expose models over socket.io using the `loopback.sio()` middleware.

    app.use(loopback.sio);
    
