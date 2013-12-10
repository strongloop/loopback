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
  , DataSource = require('loopback-datasource-juggler').DataSource
  , ModelBuilder = require('loopback-datasource-juggler').ModelBuilder
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
 * @param {String} name - must be unique
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
}

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
}

/**
 * Loop up a model class by name
 * @param {String} modelName The model name
 */
loopback.getModel = function(modelName) {
  return loopback.Model.modelBuilder.models[modelName];
};

/**
 * Set the default `dataSource` for a given `type`.
 */

loopback.setDefaultDataSourceForType = function(type, dataSource) {
  var defaultDataSources = this.defaultDataSources || (this.defaultDataSources = {});

  if(!(dataSource instanceof DataSource)) {
    dataSource = this.createDataSource(dataSource);
  }

  defaultDataSources[type] = dataSource;
  return dataSource;
}

/**
 * Get the default `dataSource` for a given `type`.
 */

loopback.getDefaultDataSourceForType = function(type) {
  return this.defaultDataSources && this.defaultDataSources[type];
}

/**
 * Attach any model that does not have a dataSource to
 * the default dataSource for the type the Model requests
 */

loopback.autoAttach = function() {
  var models = this.Model.modelBuilder.models;
  assert.equal(typeof models, 'object', 'Cannot autoAttach without a models object');

  Object.keys(models).forEach(function(modelName) {
    var ModelCtor = models[modelName];

    if(ModelCtor) {
      loopback.autoAttachModel(ModelCtor);
    }
  });
}

loopback.autoAttachModel = function(ModelCtor) {
  if(ModelCtor.autoAttach) {
    var ds = loopback.getDefaultDataSourceForType(ModelCtor.autoAttach);

    assert(ds instanceof DataSource, 'cannot autoAttach model "'
    + ModelCtor.modelName
    + '". No dataSource found of type ' + ModelCtor.autoAttach);

    ModelCtor.attachTo(ds);
  }
}

/*
 * Built in models / services
 */

loopback.Model = require('./models/model');
loopback.Email = require('./models/email');
loopback.User = require('./models/user');
loopback.Application = require('./models/application');
loopback.AccessToken = require('./models/access-token');
loopback.Role = require('./models/role').Role;
loopback.RoleMapping = require('./models/role').RoleMapping;
loopback.ACL = require('./models/acl').ACL;
loopback.Scope = require('./models/acl').Scope;

/**
 * Automatically attach these models to dataSources
 */

var dataSourceTypes = {
  DB: 'db',
  MAIL: 'mail'
};

loopback.Email.autoAttach = dataSourceTypes.MAIL;
loopback.User.autoAttach = dataSourceTypes.DB;
loopback.AccessToken.autoAttach = dataSourceTypes.DB;
loopback.Role.autoAttach = dataSourceTypes.DB;
loopback.RoleMapping.autoAttach = dataSourceTypes.DB;
loopback.ACL.autoAttach = dataSourceTypes.DB;
loopback.Scope.autoAttach = dataSourceTypes.DB;
loopback.Application.autoAttach = dataSourceTypes.DB;
