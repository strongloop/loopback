/**
 * Module dependencies.
 */

var express = require('express')
  , fs = require('fs')
  , path = require('path')
  , proto = require('./application')
  , utils = require('express/node_modules/connect').utils
  , DataSource = require('jugglingdb').DataSource
  , ModelBuilder = require('jugglingdb').ModelBuilder;

/**
 * Expose `createApplication()`.
 */

var asteroid = exports = module.exports = createApplication;

/**
 * Framework version.
 */

asteroid.version = require('../package.json').version;

/**
 * Expose mime.
 */

asteroid.mime = express.mime;

/**
 * Create an asteroid application.
 *
 * @return {Function}
 * @api public
 */

function createApplication() {
  var app = express();

  utils.merge(app, proto);

  return app;
}

/**
 * Expose express.middleware as asteroid.*
 * for example `asteroid.errorHandler` etc.
 */

for (var key in express) {
  Object.defineProperty(
      asteroid
    , key
    , Object.getOwnPropertyDescriptor(express, key));
}

/**
 * Expose additional asteroid middleware
 * for example `asteroid.configure` etc.
 */

fs.readdirSync(path.join(__dirname, 'middleware')).forEach(function (m) {
  asteroid[m.replace(/\.js$/, '')] = require('./middleware/' + m);
});

/**
 * Error handler title
 */

asteroid.errorHandler.title = 'Asteroid';

/**
 * Create a data source with passing the provided options to the connector.
 *
 * @param {String} name (optional)
 * @param {Object} options
 * 
 *  - connector - an asteroid connector
 *  - other values - see the specified `connector` docs 
 */

asteroid.createDataSource = function (name, options) {
  var ds = new DataSource(name, options);
  ds.createModel = function (name, properties, settings) {
    var Model = asteroid.createModel(name, properties, settings);
    Model.attachTo(ds);
    return Model;
  }
  return ds;
}

/**
 * Create a named vanilla JavaScript class constructor with an attached set of properties and options.
 *
 * @param {String} name - must be unique
 * @param {Object} properties
 * @param {Object} options (optional)
 */

asteroid.createModel = function (name, properties, options) {
  assert(typeof name === 'string', 'Cannot create a model without a name');
  
  var mb = new ModelBuilder();
  var ModelCtor = mb.define(name, properties, arguments);
  var hasMany = ModelCtor.hasMany;
  
  if(hasMany) {
    ModelCtor.hasMany = function (anotherClass, params) {
      var origArgs = arguments;
      var thisClass = this, thisClassName = this.modelName;
      params = params || {};
      if (typeof anotherClass === 'string') {
          params.as = anotherClass;
          if (params.model) {
              anotherClass = params.model;
          } else {
              var anotherClassName = i8n.singularize(anotherClass).toLowerCase();
              for(var name in this.schema.models) {
                  if (name.toLowerCase() === anotherClassName) {
                      anotherClass = this.schema.models[name];
                  }
              }
          }
      }
      
      var pluralized = i8n.pluralize(anotherClass.modelName);
      var methodName = params.as ||
          i8n.camelize(pluralized, true);
      var proxyMethodName = 'get' + i8n.titleize(pluralized, true);
    
      // create a proxy method
      var fn = this.prototype[proxyMethodName] = function () {
        // this cannot be a shared method
        // because it is defined when you
        // inside a property getter...
        
        this[methodName].apply(thisClass, arguments);
      };
      
      fn.shared = true;
      fn.http = {verb: 'get', path: '/' + methodName};
      hasMany.apply(this, arguments);
    };
  }
  
  ModelCtor.shared = true;
  ModelCtor.sharedCtor = function (data, id, fn) {
    if(typeof data === 'function') {
      fn = data;
      data = null;
      id = null;
    } else if (typeof id === 'function') {
      fn = id;
      id = null;
    }
    
    if(id && data) {
      var model = new ModelCtor(data);
      model.id = id;
      fn(null, model);
    } else if(data) {
      fn(null, new ModelCtor(data));
    } else if(id) {
      ModelCtor.find(id, fn);
    } else {
      fn(new Error('must specify an id or data'));
    }
  };
  
  ModelCtor.sharedCtor.accepts = [
    {arg: 'data', type: 'object'},
    {arg: 'id', type: 'any'}
  ];
  
  ModelCtor.sharedCtor.http = [
    {path: '/'},
    {path: '/:id'}
  ];
  
  // before remote hook
  ModelCtor.beforeRemote = function (name, fn) {
    var remotes = this.app.remotes();
    remotes.before(ModelCtor.pluralModelName + '.' + name, function (ctx, next) {
      fn(ctx, ctx.instance, next);
    });
  }
  
  // after remote hook
  ModelCtor.afterRemote = function (name, fn) {
    var remotes = this.app.remotes();
    remotes.before(ModelCtor.pluralModelName + '.' + name, function (ctx, next) {
      fn(ctx, ctx.instance, next);
    });
  }
  
  return ModelCtor;
}

/**
 * Add a remote method to a model.
 * @param {Function} fn
 * @param {Object} options (optional)
 */

asteroid.remoteMethod = function (fn, options) {
  fn.shared = true;
  Object.keys(options).forEach(function (key) {
    fn[key] = options[key];
  });
}

