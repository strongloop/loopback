# asteroid
v0.0.1

## Install

    slnode install asteroid -g
    
## Server APIs

 - [App](#app)
 - [asteroid.Model](#model)
 - [asteroid.DataSource](#data-source)
 - [Adapters](#adapters)
 - [asteroid.GeoPoint](#geo-point)
 - [Asteroid Types](#asteroid-types)
 - [asteroid.rest](#rest-middleware)

## Client APIs

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

    var memory = asteroid.createDataSource({adapter: 'memory'});
    var Color = memory.defineModel({name: String});

    app.model(Color);
    app.use(asteroid.rest());
    
**Note:** this will expose all [shared methods](#shared-methods) on the model.
    
#### app.models()

Get the app's exposed models.

    var models = app.models();
    
    models.forEach(function (Model) {
      console.log(Model.name); // color
    });
    
### Model

An Asteroid `Model` is a vanilla JavaScript class constructor with an attached set of properties and settings.

**Properties**

A model defines a list of property names, types and other validation metadata. A [DataSource](#data-source) uses this definition to validate a `Model` during operations such as `save()`.

**Settings**

Some [DataSources](#data-source) may support additional `Model` settings.

Define an asteroid model.

    var User = asteroid.createModel('user', {
      first: String,
      last: String,
      age: Number
    });
    
#### Model.attachTo(dataSource)

Attach a model to a [DataSource](#data-source). Attaching a [DataSource](#data-source) updates the model with additional methods and behaviors.

    var oracle = asteroid.createDataSource({
      adapter: 'oracle',
      host: '111.22.333.44',
      database: 'MYDB',
      username: 'username',
      password: 'password'
    });

    User.attachTo(oracle);
    
**Note:** until a model is attached to a data source it will only expose the API defined below.

#### Attached Methods

Attached methods are added by attaching a vanilla model to a data source with an adapter.

##### Model.create([data], [callback])

Create an instance of Model with given data and save to the attached data source.

    User.create({first: 'Joe', last: 'Bob'}, function(err, user) {
      console.log(user instanceof User); // true
    });

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

##### model.upsert(data, callback)
    
Update when record with id=data.id found, insert otherwise. **Note:** no setters, validations or hooks applied when using upsert.

##### model.destroy([callback])

Remove a model from the attached data source.

    model.destroy(function(err) {
      // model instance destroyed
    });
    
##### Model.destroyAll(callback)

Delete all Model instances from data source. **Note:** destroyAll method does not perform destroy hooks.

##### Model.find(id, callback)

Find instance by id.

    User.find(23, function(err, user) {
      console.info(user.id); // 23
    });

Model.all(filter, callback);

Find all instances of Model, matched by query. Fields used for filter and sort should be declared with `{index: true}` in model definition.

**filter**

where: `Object` { key: val, key2: {gt: 'val2'}}
include: `String`, `Object` or `Array`.
order: `String`
limit: `Number`
skip: `Number`

    User.all({where: {age: {gt: 21}}, order: 'age DESC', limit: 10, skip: 20})

##### Model.count([query], callback)

Query count of Model instances in data source. Optional query param allows to count filtered set of Model instances.

    User.count({approved: true}, function(err, count) {
      console.log(count); // 1983
    });

#### Static Methods

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
    
Expose the static model method to clients as a [remote method](#remote-method).

    asteroid.remoteMethod(
      User,
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

Define an instance method.

    User.prototype.logout = function (fn) {
      MySessionModel.destroyAll({userId: this.id}, fn);
    }
    
Define a remote model instance method.

    asteroid.remoteMethod(User, User.prototype.logout);

#### Remote Methods

Both instance and static methods can be exposed to clients. A remote method must accept a callback with the conventional `fn(err, result, ...)` signature. 

##### asteroid.remoteMethod(Model, fn, [options]);

Expose a remote method.

    Product.stats = function(fn) {
      myApi.getStats('products', fn);
    }
    
    asteroid.remoteMethod(
      Product,
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
  - **http.path** - the relative path the method will be exposed at. May be a path fragment (eg. '/:myArg') which will be populated by an arg of the same name in the accepts description.
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

#### Hooks

Run a function before or after a model method is called.

    User.before('save', function(user, next) {
      console.log('about to save', user);
      
      next();
    });
    
Prevent the method from being called by proding an error.

    User.before('delete', function(user, next) {
      // prevent all delete calls
      next(new Error('deleting is disabled'));
    });

#### Remote Hooks

Run a function before or after a remote method is called by a client.

    User.beforeRemote('save', function(ctx, user, next) {
      if(ctx.user.id === user.id) {
        next();
      } else {
        next(new Error('must be logged in to update'))
      }
    });
    
#### Context

Remote hooks are provided with a Context `ctx` that contains raw access to the transport specific objects. The `ctx` object also has a set of consistent apis that are consistent across transports.

##### ctx.me

The id of the user calling the method remotely. **Note:** this is undefined if a user is not logged in.

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
    
#### Model.availableHooks()

Return a list of available hooks.

    console.log(User.availableHooks()); // ['save', ...]

#### Shared Methods

Any static or instance method can be decorated as `shared`. These methods are exposed over the provided transport (eg. [asteroid.rest](#rest)).
    
#### Model.availableMethods()

Returns the currently available api of a model as well as descriptions of any modified behavior or methods from attached data sources.

    User.attachTo(oracle);
    console.log(User.availableMethods());
    
Output:

    {
      'User.all': {
        accepts: [{arg: 'filter', type: 'object', description: '...'}],
        returns: [{arg: 'users', type: ['User']}]
      },
      'User.find': {
        accepts: [{arg: 'id', type: 'any'}],
        returns: [{arg: 'items', type: 'User'}]
      },
      ...
    }

### Data Source

An Asteroid `DataSource` provides [Models](#model) with the ability to manipulate data. Attaching a `DataSource` to a `Model` adds [instance methods](#instance-methods) and [static methods](#static-methods) to the `Model`. The added methods may be [remote methods](#remote-methods).

Define a data source for persisting models.

    var oracle = asteroid.createDataSource({
      adapter: 'oracle',
      host: '111.22.333.44',
      database: 'MYDB',
      username: 'username',
      password: 'password'
    });
    
#### dataSource.createModel(name, options, settings)

Define a model and attach it to a `DataSource`.

    var Color = oracle.createModel('color', {name: String});

#### dataSource.discover(options, fn)

Discover an object containing properties and settings for an existing data source.

    oracle.discover({owner: 'MYORG'}, function(err, tables) {
      var productSchema = tables.PRODUCTS;
      var ProductModel = oracle.createModel('product', productSchema.properties, productSchema.settings);
    });
    
#### dataSource.discoverSync(options)

Synchronously discover an object containing properties and settings for an existing data source tables or collections.

    var tables = oracle.discover({owner: 'MYORG'});
    var productSchema = tables.PRODUCTS;
    var ProductModel = oracle.createModel('product', productSchema.properties, productSchema.settings);
    
#### dataSource.discoverModels(options, fn) 

Discover a set of models based on tables or collections in a data source.
  
    oracle.discoverModels({owner: 'MYORG'}, function(err, models) {
      var ProductModel = models.Product;
    });
    
**Note:** The `models` will contain all properties and settings discovered from the data source. It will also automatically discover and create relationships.
    
#### dataSource.discoverModelsSync(options)

Synchronously Discover a set of models based on tables or collections in a data source.

    var models = oracle.discoverModels({owner: 'MYORG'});
    var ProductModel = models.Product;

#### Adapters

Create a data source with a specific adapter.

    var memory = asteroid.createDataSource({
      adapter: require('asteroid-memory')
    });
    
**Available Adapters**
 
 - [Oracle](http://github.com/strongloop/asteroid-adapters/oracle)
 - [In Memory](http://github.com/strongloop/asteroid-adapters/memory)
 - TODO - [MySQL](http://github.com/strongloop/asteroid-adapters/mysql)
 - TODO - [SQLite3](http://github.com/strongloop/asteroid-adapters/sqlite)
 - TODO - [Postgres](http://github.com/strongloop/asteroid-adapters/postgres)
 - TODO - [Redis](http://github.com/strongloop/asteroid-adapters/redis)
 - TODO - [MongoDB](http://github.com/strongloop/asteroid-adapters/mongo)
 - TODO - [CouchDB](http://github.com/strongloop/asteroid-adapters/couch)
 - TODO - [Firebird](http://github.com/strongloop/asteroid-adapters/firebird)

**Installing Adapters**

Include the adapter in your package.json dependencies and run `npm install`.

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
 
### Rest Middleware

Expose models over rest using the `asteroid.rest` middleware.

    app.use(asteroid.rest());
    
### SocketIO Middleware **Not Available**

**Coming Soon** - Expose models over socket.io using the `asteroid.sio()` middleware.

    app.use(asteroid.sio);
    
