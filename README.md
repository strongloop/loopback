# asteroid
v0.0.1

## Install

    slnode install asteroid -g
    
## Server APIs

 - [App](#app)
 - [asteroid.Model](#model)
 - [asteroid.DataSource](#data-source)
 - [asteroid.RemoteObject](#data-source)
 - [asteroid.rest](#rest)

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
    
Expose the static model method to clients using remoting.

    User.login.shared = true;
    User.login.accepts = [
      {arg: 'username', type: 'string', required: true},
      {arg: 'password', type: 'string', required: true}
    ];
    User.login.returns = {arg: 'sessionId', type: 'any'};
    
#### Instance Methods

Define an instance method

    User.prototype.logout = function (fn) {
      MySessionModel.destroyAll({userId: this.id}, fn);
    }
    
Expose the model instance method to clients using remoting.

    User.prototype.logout.shared = true;

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

Run a function before or after a method is called remotely by a client.

    User.beforeRemote('save', function(ctx, user, next) {
      if(ctx.user.id === user.id) {
        next();
      } else {
        next(new Error('must be logged in to update'))
      }
    });
    
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

An Asteroid `DataSource` provides [Models](#model) with the ability to manipulate data.

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

#### dataSource.discoverSchemas(options, fn)

Discover an object containing properties and settings for an existing data source.

    module.exports = oracle.discoverSchemasSync({table: 'PRODUCTS', owner: 'MYORG'});    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
#### dataSource.discoverSchemaSync(options)

A synchronous version of the above. 

    var desc = oracle.discoverSchemaSync({table: 'PRODUCTS'});
    
**Note:** Not available for all adapters.

#### dataSource.discoverModel(options, fn)

Discover schema and create model.

#### dataSource.discoverModelSync(options, fn)

Sync discover schema and create model.

#### dataSource.discoverModels(options, fn)

TODO define.

#### dataSource.discoverModelSync(options)



#### dataSource.createLocation(name, options, settings)


other option

RentalLocation = asteroid.createModel('rental-location', {
  location: Location
});

Location.distanceTo({lat: 22, long: 55}, fn);

Location.all({where: {geo: {near: {lat: 22, long: 55}}}, limit: 10, sort: 'distance DESC'}, fn)