/**
 * Module dependencies.
 */

var express = require('express')
  , fs = require('fs')
  , ejs = require('ejs')
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

fs
  .readdirSync(path.join(__dirname, 'middleware'))
  .filter(function (file) {
    return file.match(/\.js$/);
  })
  .forEach(function (m) {
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
    var ModelCtor = asteroid.createModel(name, properties, settings);
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

asteroid.createModel = function (name, properties, options) {
  return asteroid.Model.extend(name, properties, options);
}

/**
 * Add a remote method to a model.
 * @param {Function} fn
 * @param {Object} options (optional)
 */

asteroid.remoteMethod = function (fn, options) {
  fn.shared = true;
  if(typeof options === 'object') {
    Object.keys(options).forEach(function (key) {
      fn[key] = options[key];
    });
  }
  fn.http = fn.http || {verb: 'get'};
}

/**
 * Create a template helper.
 *
 *     var render = asteroid.template('foo.ejs');
 *     var html = render({foo: 'bar'});
 *
 * @param {String} path Path to the template file.
 * @returns {Function}
 */

asteroid.template = function (file) {
  var templates = this._templates || (this._templates = {});
  var str = templates[file] || (templates[file] = fs.readFileSync(file, 'utf8'));
  return ejs.compile(str);
}

/**
 * Get an in-memory data source. Use one if it already exists.
 * 
 * @param {String} [name] The name of the data source. If not provided, the `'default'` is used.
 */

asteroid.memory = function (name) {
  name = name || 'default';
  var memory = (
    this._memoryDataSources
    || (this._memoryDataSources = {})
  )[name];
  
  if(!memory) {
    memory = this._memoryDataSources[name] = asteroid.createDataSource({
      connector: asteroid.Memory
    });
  }
  
  return memory;
}

/*
 * Built in models / services
 */

asteroid.Model = require('./models/model');
asteroid.Email = require('./models/email');
asteroid.User = require('./models/user');
asteroid.Session = require('./models/session');
