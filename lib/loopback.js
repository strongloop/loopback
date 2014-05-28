/*!
 * Module dependencies.
 */

var express = require('express')
  , fs = require('fs')
  , ejs = require('ejs')
  , EventEmitter = require('events').EventEmitter
  , path = require('path')
  , proto = require('./application')
  , DataSource = require('loopback-datasource-juggler').DataSource
  , ModelBuilder = require('loopback-datasource-juggler').ModelBuilder
  , i8n = require('inflection')
  , merge = require('util')._extend
  , assert = require('assert');

/**
 * Main entry for LoopBack core module. It provides static properties and
 * methods to create models and data sources. The module itself is a function
 * that creates loopback `app`. For example,
 *
 * ```js
 * var loopback = require('loopback');
 * var app = loopback();
 * ```
 *
 * @class loopback
 * @header loopback
 */

var loopback = exports = module.exports = createApplication;

/**
 * True if running in a browser environment; false otherwise.
 */

loopback.isBrowser = typeof window !== 'undefined';

/**
 * True if running in a server environment; false otherwise.
 */

loopback.isServer = !loopback.isBrowser;

/**
 * Framework version.
 */

loopback.version = require('../package.json').version;

/**
 * Expose mime.
 */

loopback.mime = express.mime;

/*!
 * Compatibility layer, intentionally left undocumented.
 */
loopback.compat = require('./compat');

/*!
 * Create an loopback application.
 *
 * @return {Function}
 * @api public
 */

function createApplication() {
  var app = express();

  merge(app, proto);

  // Create a new instance of models registry per each app instance
  app.models = function() {
    return proto.models.apply(this, arguments);
  };

  // Create a new instance of datasources registry per each app instance
  app.datasources = app.dataSources = {};

  // Create a new instance of connector registry per each app instance
  app.connectors = {};

  // Register built-in connectors. It's important to keep this code
  // hand-written, so that all require() calls are static
  // and thus browserify can process them (include connectors in the bundle)
  app.connector('memory', loopback.Memory);
  app.connector('remote', loopback.Remote);

  return app;
}

/*!
 * Expose express.middleware as loopback.*
 * for example `loopback.errorHandler` etc.
 */

for (var key in express) {
  Object.defineProperty(
      loopback
    , key
    , Object.getOwnPropertyDescriptor(express, key));
}

/*!
 * Expose additional loopback middleware
 * for example `loopback.configure` etc.
 *
 * ***only in node***
 */

if (loopback.isServer) {
  fs
    .readdirSync(path.join(__dirname, 'middleware'))
    .filter(function (file) {
      return file.match(/\.js$/);
    })
    .forEach(function (m) {
      loopback[m.replace(/\.js$/, '')] = require('./middleware/' + m);
    });
}

/*!
 * Error handler title
 */

loopback.errorHandler.title = 'Loopback';

/**
 * Create a data source with passing the provided options to the connector.
 *
 * @param {String} name Optional name.
 * @options {Object} Data Source options
 * @property {Object} connector LoopBack connector.
 * @property {*} Other&nbsp;properties See the relevant connector documentation. 
 */

loopback.createDataSource = function (name, options) {
  var ds = new DataSource(name, options, loopback.Model.modelBuilder);
  ds.createModel = function (name, properties, settings) {
    var ModelCtor = loopback.createModel(name, properties, settings);
    ModelCtor.attachTo(ds);
    return ModelCtor;
  };

  if(ds.settings && ds.settings.defaultForType) {
    loopback.setDefaultDataSourceForType(ds.settings.defaultForType, ds);
  }

  return ds;
};

/**
 * Create a named vanilla JavaScript class constructor with an attached set of properties and options.
 *
 * @param {String} name Unique name.
 * @param {Object} properties
 * @param {Object} options (optional)
 */

loopback.createModel = function (name, properties, options) {
  options = options || {};
  var BaseModel = options.base || options.super;

  if(typeof BaseModel === 'string') {
    BaseModel = loopback.getModel(BaseModel);
  }

  BaseModel = BaseModel || loopback.Model;

  var model = BaseModel.extend(name, properties, options);

  // try to attach
  try {
    loopback.autoAttachModel(model);
  } catch(e) {}

  return model;
};

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
};

/**
 * Create a template helper.
 *
 *     var render = loopback.template('foo.ejs');
 *     var html = render({foo: 'bar'});
 *
 * @param {String} path Path to the template file.
 * @returns {Function}
 */

loopback.template = function (file) {
  var templates = this._templates || (this._templates = {});
  var str = templates[file] || (templates[file] = fs.readFileSync(file, 'utf8'));
  return ejs.compile(str);
};

/**
 * Get an in-memory data source. Use one if it already exists.
 * 
 * @param {String} [name] The name of the data source. If not provided, the `'default'` is used.
 */

loopback.memory = function (name) {
  name = name || 'default';
  var memory = (
    this._memoryDataSources
    || (this._memoryDataSources = {})
  )[name];
  
  if(!memory) {
    memory = this._memoryDataSources[name] = loopback.createDataSource({
      connector: loopback.Memory
    });
  }
  
  return memory;
};

/**
 * Look up a model class by name from all models created by loopback.createModel()
 * @param {String} modelName The model name
 * @returns {Model} The model class
 */
loopback.getModel = function(modelName) {
  return loopback.Model.modelBuilder.models[modelName];
};

/**
 * Look up a model class by the base model class. The method can be used by LoopBack
 * to find configured models in models.json over the base model.
 * @param {Model} The base model class
 * @returns {Model} The subclass if found or the base class
 */
loopback.getModelByType = function(modelType) {
  assert(typeof modelType === 'function', 'The model type must be a constructor');
  var models = loopback.Model.modelBuilder.models;
  for(var m in models) {
    if(models[m].prototype instanceof modelType) {
      return models[m];
    }
  }
  return modelType;
};

/**
 * Set the default `dataSource` for a given `type`.
 * @param {String} type The datasource type
 * @param {Object|DataSource} dataSource The data source settings or instance
 * @returns {DataSource} The data source instance
 */

loopback.setDefaultDataSourceForType = function(type, dataSource) {
  var defaultDataSources = this.defaultDataSources || (this.defaultDataSources = {});

  if(!(dataSource instanceof DataSource)) {
    dataSource = this.createDataSource(dataSource);
  }

  defaultDataSources[type] = dataSource;
  return dataSource;
};

/**
 * Get the default `dataSource` for a given `type`.
 * @param {String} type The datasource type
 * @returns {DataSource} The data source instance
 */

loopback.getDefaultDataSourceForType = function(type) {
  return this.defaultDataSources && this.defaultDataSources[type];
};

/**
 * Attach any model that does not have a dataSource to
 * the default dataSource for the type the Model requests
 */

loopback.autoAttach = function() {
  var models = this.Model.modelBuilder.models;
  assert.equal(typeof models, 'object', 'Cannot autoAttach without a models object');

  Object.keys(models).forEach(function(modelName) {
    var ModelCtor = models[modelName];

    // Only auto attach if the model doesn't have an explicit data source
    if(ModelCtor && (!(ModelCtor.dataSource instanceof DataSource))) {
      loopback.autoAttachModel(ModelCtor);
    }
  });
};

loopback.autoAttachModel = function(ModelCtor) {
  if(ModelCtor.autoAttach) {
    var ds = loopback.getDefaultDataSourceForType(ModelCtor.autoAttach);

    assert(ds instanceof DataSource, 'cannot autoAttach model "'
    + ModelCtor.modelName
    + '". No dataSource found of type ' + ModelCtor.autoAttach);

    ModelCtor.attachTo(ds);
  }
};

/*!
 * Built in models / services
 */

loopback.Model = require('./models/model');
loopback.DataModel = require('./models/data-model');
loopback.Email = require('./models/email');
loopback.User = require('./models/user');
loopback.Application = require('./models/application');
loopback.AccessToken = require('./models/access-token');
loopback.Role = require('./models/role').Role;
loopback.RoleMapping = require('./models/role').RoleMapping;
loopback.ACL = require('./models/acl').ACL;
loopback.Scope = require('./models/acl').Scope;

/*!
 * Automatically attach these models to dataSources
 */

var dataSourceTypes = {
  DB: 'db',
  MAIL: 'mail'
};

loopback.Email.autoAttach = dataSourceTypes.MAIL;
loopback.DataModel.autoAttach = dataSourceTypes.DB;
loopback.User.autoAttach = dataSourceTypes.DB;
loopback.AccessToken.autoAttach = dataSourceTypes.DB;
loopback.Role.autoAttach = dataSourceTypes.DB;
loopback.RoleMapping.autoAttach = dataSourceTypes.DB;
loopback.ACL.autoAttach = dataSourceTypes.DB;
loopback.Scope.autoAttach = dataSourceTypes.DB;
loopback.Application.autoAttach = dataSourceTypes.DB;
