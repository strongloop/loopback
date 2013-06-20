# asteroid

v0.7.0

## Install

    slnode install asteroid -g
    
## Server API

 - [App](#app)
 - [Model](#model)
 - [DataSource](#data-source)
 - [Connectors](#connectors)
 - [GeoPoint](#geo-point)
 - [Asteroid Types](#asteroid-types)
 - [REST Router](#rest-router)

## Client API

_TODO_

### App

Create an asteroid application.

    var asteroid = require('asteroid');
    var app = asteroid();

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

    var memory = asteroid.createDataSource({connector: asteroid.Memory});
    var Color = memory.createModel('color', {name: String});

    app.model(Color);
    app.use(asteroid.rest());
    
**Note:** this will expose all [shared methods](#shared-methods) on the model.
    
#### app.models()

Get the app's exposed models.

    var models = app.models();
    
    models.forEach(function (Model) {
      console.log(Model.modelName); // color
    });
    
### Model

An Asteroid `Model` is a vanilla JavaScript class constructor with an attached set of properties and options. A `Model` instance is created by passing a data object containing properties to the `Model` constructor. A `Model` constructor will clean the object passed to it and only set the values matching the properties you define.

    // valid color
    var Color = asteroid.createModel('color', {name: String});
    var red = new Color({name: 'red'});
    console.log(red.name); // red
    
    // invalid color
    var foo = new Color({bar: 'bat baz'});
    console.log(foo.bar); // undefined

**Properties**

A model defines a list of property names, types and other validation metadata. A [DataSource](#data-source) uses this definition to validate a `Model` during operations such as `save()`.

**Options**

Some [DataSources](#data-source) may support additional `Model` options.

Define an asteroid model.

    var User = asteroid.createModel('user', {
      first: String,
      last: String,
      age: Number
    });

### Validation (expiremental)

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

Ensure the value for `property` is unique.

    User.validatesUniquenessOf('email', {message: 'email is not unique'});

**Note:** not available for all [connectors](#connectors).

#### myModel.isValid()

Validate the model instance.

    user.isValid(function (valid) {
        if (!valid) {
            user.errors // hash of errors {attr: [errmessage, errmessage, ...], attr: ...}    
        }
    });

#### Model.attachTo(dataSource)

Attach a model to a [DataSource](#data-source). Attaching a [DataSource](#data-source) updates the model with additional methods and behaviors.

    var oracle = asteroid.createDataSource({
      connector: require('asteroid-oracle'),
      host: '111.22.333.44',
      database: 'MYDB',
      username: 'username',
      password: 'password'
    });

    User.attachTo(oracle);
    
**Note:** until a model is attached to a data source it will **not** have any **attached methods**.

#### CRUD and Query Mixins

Mixins are added by attaching a vanilla model to a data source with a connector. Each [connector](#connectors) enables its own set of operations that are attached to a `Model` as methods. To see available methods for a data source with a connector call `dataSource.operations()`.

#### Static Methods

##### Model.create([data], [callback])

Create an instance of Model with given data and save to the attached data source.

    User.create({first: 'Joe', last: 'Bob'}, function(err, user) {
      console.log(user instanceof User); // true
    });

##### Model.count([query], callback)

Query count of Model instances in data source. Optional query param allows to count filtered set of Model instances.

    User.count({approved: true}, function(err, count) {
      console.log(count); // 2081
    });

##### Model.all(filter, callback)

Find all instances of Model, matched by query. Fields used for filter and sort should be declared with `{index: true}` in model definition.

**filter**

 - **where** `Object` { key: val, key2: {gt: 'val2'}}
 - **include** `String`, `Object` or `Array`.
 - **order** `String`
 - **limit** `Number`
 - **skip** `Number`

Find the second page of 10 users over age 21 in descending order.

    User.all({where: {age: {gt: 21}}, order: 'age DESC', limit: 10, skip: 10})

**Note:** See the specific connector's [docs](#connectors) for more info.

##### Model.destroyAll(callback)

Delete all Model instances from data source. **Note:** destroyAll method does not perform destroy hooks.

##### Model.find(id, callback)

Find instance by id.

    User.find(23, function(err, user) {
      console.info(user.id); // 23
    });

##### Model.findOne(filter, callback)

Find a single instance that matches the given filter.

    User.find(23, function(err, user) {
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

    asteroid.remoteMethod(
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

    asteroid.remoteMethod(User.prototype.logout);

#### Remote Methods

Both instance and static methods can be exposed to clients. A remote method must accept a callback with the conventional `fn(err, result, ...)` signature.

##### asteroid.remoteMethod(fn, [options]);

Expose a remote method.

    Product.stats = function(fn) {
      myApi.getStats('products', fn);
    }
    
    asteroid.remoteMethod(
      Product.stats,
      {
        returns: {arg: 'stats', type: 'array'},
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

Each argument may define any of the [asteroid types](#asteroid-types).

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

    // run before any static method eg. User.all
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

When [asteroid.rest](#asteroidrest) is used the following `ctx` properties are available.

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
      // using 'chapters' scope for build:
      var c = book.chapters.build({name: 'Chapter 1'});
      
      // same as:
      c = new Chapter({name: 'Chapter 1', bookId: book.id});
      
      // using 'chapters' scope for create:
      book.chapters.create();
      
      // same as:
      Chapter.create({bookId: book.id});

      // using scope for querying:
      book.chapters(function(err, chapters) {
        /* all chapters with bookId = book.id */
      });
      
      book.chapters({where: {name: 'test'}, function(err, chapters) {
        // all chapters with bookId = book.id and name = 'test'
      });
    });
    
##### Model.hasAndBelongsToMany()

TODO: implement / document
    
#### Shared Methods

Any static or instance method can be decorated as `shared`. These methods are exposed over the provided transport (eg. [asteroid.rest](#rest)).
    

### Data Source

An Asteroid `DataSource` provides [Models](#model) with the ability to manipulate data. Attaching a `DataSource` to a `Model` adds [instance methods](#instance-methods) and [static methods](#static-methods) to the `Model`. The added methods may be [remote methods](#remote-methods).

Define a data source for persisting models.

    var oracle = asteroid.createDataSource({
      connector: 'oracle',
      host: '111.22.333.44',
      database: 'MYDB',
      username: 'username',
      password: 'password'
    });
    
#### dataSource.createModel(name, properties, options)

Define a model and attach it to a `DataSource`.

    var Color = oracle.createModel('color', {name: String});

#### dataSource.discoverAndBuildModels(owner, tableOrView, options, fn) 

Discover a set of models based on tables or collections in a data source.
  
    oracle.discoverAndBuildModels('MYORG', function(err, models) {
      var ProductModel = models.Product;
    });
    
**Note:** The `models` will contain all properties and options discovered from the data source. It will also automatically discover and create relationships.
    
#### dataSource.discoverAndBuildModelsSync(owner, tableOrView, options)

Synchronously Discover a set of models based on tables or collections in a data source.

    var models = oracle.discoverAndBuildModelsSync('MYORG');
    var ProductModel = models.Product;
    
#### dataSource.discoverModelDefinitions([owner], fn)

Discover a set of model definitions based on tables or collections in a data source.

    oracle.discoverModelDefinitions(null, function (err, models) {
      models.forEach(function (def) {
        // def.name ~ the model name
        oracle.discoverSchema(null, def.name, function (err, schema) {
          console.log(schema);
        });
      });
    });
    
#### dataSource.discoverSchema([owner], name, fn)

Discover the schema of a data source.

#### dataSource.defineOperation(name, options, fn)

Define a new operation available to all model's attached to the data source.

    var maps = asteroid.createDataSource({
      connector: require('asteroid-rest'),
      url: 'http://api.googleapis.com/maps/api'
    });

    rest.defineOperation('geocode', {
      url: '/geocode/json',
      verb: 'get',
      accepts: [
        {arg: 'address', type: 'string'},
        {arg: 'sensor', default: 'true'}
      ],
      returns: {arg: 'location', type: asteroid.GeoPoint, transform: transform},
      json: true,
      enableRemote: true
    });
    
    function transform(res) {
      var geo = res.body.results[0].geometry;
      return new asteroid.GeoPoint({lat: geo.lat, long: geo.lng});
    }
    
    var GeoCoder = rest.createModel('geocoder');
    
    GeoCoder.geocode('123 fake street', function(err, point) {
      console.log(point.lat, point.long); // 24.224424 44.444445
    });

#### dataSource.enableRemote(operation)

Enable remote access to a data source operation. Each [connector](#connector) has its own set of set remotely enabled and disabled operations. You can always list these by calling `dataSource.operations()`.
    

#### dataSource.disableRemote(operation)

Disable remote access to a data source operation. Each [connector](#connector) has its own set of set enabled and disabled operations. You can always list these by calling `dataSource.operations()`.

    // all rest data source operations are
    // disabled by default
    var oracle = asteroid.createDataSource({
      connector: require('asteroid-oracle'),
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

    var memory = asteroid.createDataSource({
      connector: asteroid.Memory
    });
    
**Available Connectors**
 
 - [Oracle](http://github.com/strongloop/asteroid-connectors/oracle)
 - [In Memory](http://github.com/strongloop/asteroid-connectors/memory)
 - TODO - [REST](http://github.com/strongloop/asteroid-connectors/rest)
 - TODO - [MySQL](http://github.com/strongloop/asteroid-connectors/mysql)
 - TODO - [SQLite3](http://github.com/strongloop/asteroid-connectors/sqlite)
 - TODO - [Postgres](http://github.com/strongloop/asteroid-connectors/postgres)
 - TODO - [Redis](http://github.com/strongloop/asteroid-connectors/redis)
 - TODO - [MongoDB](http://github.com/strongloop/asteroid-connectors/mongo)
 - TODO - [CouchDB](http://github.com/strongloop/asteroid-connectors/couch)
 - TODO - [Firebird](http://github.com/strongloop/asteroid-connectors/firebird)

**Installing Connectors**

Include the connector in your package.json dependencies and run `npm install`.

    {
      "dependencies": {
        "asteroid-oracle": "latest"
      }
    }

### GeoPoint

Embed a latitude / longitude point in a [Model](#model).

    var CoffeeShop = asteroid.createModel('coffee-shop', {
      location: 'GeoPoint'
    });

Asteroid Model's with a GeoPoint property and an attached DataSource may be queried using geo spatial filters and sorting.

Find the 3 nearest coffee shops.

    CoffeeShop.attach(oracle);
    var here = new GeoPoint({lat: 10.32424, long: 5.84978});
    CoffeeShop.all({where: {location: {near: here}}}, function(err, nearbyShops) {
      console.info(nearbyShops); // [CoffeeShop, ...]
    });

#### geoPoint.distanceTo(geoPoint, options)

Get the distance to another `GeoPoint`.

    var here = new GeoPoint({lat: 10, long: 10});
    var there = new GeoPoint({lat: 5, long: 5});
    console.log(here.distanceTo(there, {type: 'miles'})); // 438
 
#### GeoPoint.distanceBetween(a, b, options)

Get the distance between two points.

    GeoPoint.distanceBetween(here, there, {type: 'miles'}) // 438

#### Distance Types

 - `miles`
 - `radians`
 - `kilometers`

#### geoPoint.lat

The latitude point in degrees. Range: -90 to 90.

#### geoPoint.long

The longitude point in degrees. Range: -180 to 180.

### Asteroid Types

Various APIs in Asteroid accept type descriptions (eg. [remote methods](#remote-methods), [asteroid.createModel()](#model)). The following is a list of supported types.

 - `null` - JSON null
 - `Boolean` - JSON boolean
 - `Number` - JSON number
 - `String` - JSON string
 - `Object` - JSON object
 - `Array` - JSON array
 - `Date` - a JavaScript date object
 - `Buffer` - a node.js Buffer object
 - [GeoPoint](#geopoint) - an asteroid GeoPoint object.
 
### REST Router

Expose models over rest using the `asteroid.rest` router.

    app.use(asteroid.rest());
    
**REST Documentation**

View generated REST documentation by visiting: [http://localhost:3000/_docs](http://localhost:3000/_docs).
    
### SocketIO Middleware **Not Available**

**Coming Soon** - Expose models over socket.io using the `asteroid.sio()` middleware.

    app.use(asteroid.sio);
    
