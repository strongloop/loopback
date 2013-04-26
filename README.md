# asteroid
v0.0.1

## Install

    slnode install asteroid -g
    
## API

### app

Create an asteroid app.

    var asteroid = require('asteroid')
      , app = asteroid();
      
### app.dataSource()

Attach a remote data source to your app.

    app.dataSource('color-db', {
      adapter: 'oracle',
      host: 'localhost',
      port: 2345,
      user: 'test',
      password: 'test'
    });
    
### app.define(name)

Define a [Model](node_modules/model).

    var Color = app.define('color');

### app.use(asteroid.rest);

Expose your models over a REST api.

    // node
    app.use(asteroid.rest);
    
    // http
    GET /colors
    
    200 OK
    [
      {name: 'red'},
      {name: 'blue'},
      {name: 'green'}
    ]

## Asteroid Modules

 - [Asteroid Module Base Class](node_modules/asteroid-module) 
 - [Route](node_modules/route) 
 - [Model Route](node_modules/model-route) 
 - [Model](node_modules/model) 
 - [Data Source](node_modules/data-source)