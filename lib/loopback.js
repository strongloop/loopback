/**
 * Module dependencies.
 */

var express = require('express')
  , fs = require('fs')
  , EventEmitter = require('events').EventEmitter
  , path = require('path')
  , proto = require('./application')
  , utils = require('express/node_modules/connect').utils
  , DataSource = require('jugglingdb').DataSource
  , ModelBuilder = require('jugglingdb').ModelBuilder
  , assert = require('assert')
  , i8n = require('inflection');

/**
 * Expose `createApplication()`.
 */

var loopback = exports = module.exports = createApplication;

/**
 * Framework version.
 */

loopback.version = require('../package.json').version;

/**
 * Expose mime.
 */

loopback.mime = express.mime;

/**
 * Create an loopback application.
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
 * Expose express.middleware as loopback.*
 * for example `loopback.errorHandler` etc.
 */

for (var key in express) {
  Object.defineProperty(
      loopback
    , key
    , Object.getOwnPropertyDescriptor(express, key));
}

/**
 * Expose additional loopback middleware
 * for example `loopback.configure` etc.
 */

fs
  .readdirSync(path.join(__dirname, 'middleware'))
  .filter(function (file) {
    return file.match(/\.js$/);
  })
  .forEach(function (m) {
    loopback[m.replace(/\.js$/, '')] = require('./middleware/' + m);
  });

/**
 * Error handler title
 */

loopback.errorHandler.title = 'Loopback';

/**
 * Create a data source with passing the provided options to the connector.
 *
 * @param {String} name (optional)
 * @param {Object} options
 * 
 *  - connector - an loopback connector
 *  - other values - see the specified `connector` docs 
 */

loopback.createDataSource = function (name, options) {
  var ds = new DataSource(name, options);
  ds.createModel = function (name, properties, settings) {
    var ModelCtor = loopback.createModel(name, properties, settings);
    ModelCtor.attachTo(ds);
    
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
          // this[methodName] cannot be a shared method
          // because it is defined inside
          // a property getter...
        
          this[methodName].apply(thisClass, arguments);
        };
      
        fn.shared = true;
        fn.http = {verb: 'get', path: '/' + methodName};
        fn.accepts = {arg: 'where', type: 'object'};
        hasMany.apply(this, arguments);
      };
    }
    
    return ModelCtor;
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

loopback.createModel = function (name, properties, options) {
  assert(typeof name === 'string', 'Cannot create a model without a name');
  
  var mb = new ModelBuilder();
  var ModelCtor = mb.define(name, properties, options);
  
  ModelCtor.shared = true;
  ModelCtor.sharedCtor = function (data, id, fn) {
    if(typeof data === 'function') {
      fn = data;
      data = null;
      id = null;
    } else if (typeof id === 'function') {
      fn = id;
      
      if(typeof data !== 'object') {
        id = data;
        data = null;
      } else {
        id = null;
      }
    }
    
    if(id && data) {
      var model = new ModelCtor(data);
      model.id = id;
      fn(null, model);
    } else if(data) {
      fn(null, new ModelCtor(data));
    } else if(id) {
      ModelCtor.find(id, function (err, model) {
        if(err) {
          fn(err);
        } else if(model) {
          fn(null, model);
        } else {
          err = new Error('could not find a model with id ' + id);
          err.statusCode = 404;
          
          fn(err);
        }
      });
    } else {
      fn(new Error('must specify an id or data'));
    }
  };
  
  ModelCtor.sharedCtor.accepts = [
    {arg: 'data', type: 'object', http: {source: 'body'}},
    {arg: 'id', type: 'any', http: {source: 'url'}}
  ];
  
  ModelCtor.sharedCtor.http = [
    {path: '/'},
    {path: '/:id'}
  ];
  
  // before remote hook
  ModelCtor.beforeRemote = function (name, fn) {
    var self = this;
    if(this.app) {
      var remotes = this.app.remotes();
      remotes.before(self.pluralModelName + '.' + name, function (ctx, next) {
        fn(ctx, ctx.instance, next);
      });
    } else {
      var args = arguments;
      this._remoteHooks.once('attached', function () {
        self.beforeRemote.apply(ModelCtor, args);
      });
    }
  }
  
  // after remote hook
  ModelCtor.afterRemote = function (name, fn) {
    var self = this;
    if(this.app) {
      var remotes = this.app.remotes();
      remotes.after(self.pluralModelName + '.' + name, function (ctx, next) {
        fn(ctx, ctx.instance, next);
      });
    } else {
      var args = arguments;
      this._remoteHooks.once('attached', function () {
        self.afterRemote.apply(ModelCtor, args);
      });
    }
  }
  
  // allow hooks to be added before attaching to an app
  ModelCtor._remoteHooks = new EventEmitter();
  
  return ModelCtor;
}

/**
 * Add a remote method to a model.
 * @param {Function} fn
 * @param {Object} options (optional)
 */

loopback.remoteMethod = function (fn, options) {
  fn.shared = true;
  if(typeof options === 'object') {
    Object.keys(options).forEach(function (key) {
      fn[key] = options[key];
    });
  }
  fn.http = fn.http || {verb: 'get'};
}

