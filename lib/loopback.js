// Copyright IBM Corp. 2013,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

/*!
 * Module dependencies.
 */

var express = require('express');
var loopbackExpress = require('./server-app');
var proto = require('./application');
var fs = require('fs');
var ejs = require('ejs');
var path = require('path');
var merge = require('util')._extend;
var assert = require('assert');
var Registry = require('./registry');
var juggler = require('loopback-datasource-juggler');

/**
 * LoopBack core module. It provides static properties and
 * methods to create models and data sources. The module itself is a function
 * that creates loopback `app`. For example:
 *
 * ```js
 * var loopback = require('loopback');
 * var app = loopback();
 * ```
 *
 * @property {String} version Version of LoopBack framework.  Static read-only property.
 * @property {String} mime
 * @property {Boolean} isBrowser True if running in a browser environment; false otherwise.  Static read-only property.
 * @property {Boolean} isServer True if running in a server environment; false otherwise.  Static read-only property.
 * @property {Registry} registry The global `Registry` object.
 * @property {String} faviconFile Path to a default favicon shipped with LoopBack.
 * Use as follows: `app.use(require('serve-favicon')(loopback.faviconFile));`
 * @class loopback
 * @header loopback
 */

var loopback = module.exports = createApplication;

/*!
 * Framework version.
 */

loopback.version = require('../package.json').version;

/*!
 * Expose mime.
 */

loopback.mime = express.mime;

loopback.registry = new Registry();

Object.defineProperties(loopback, {
  Model: {
    get: function() { return this.registry.getModel('Model'); }
  },
  PersistedModel: {
    get: function() { return this.registry.getModel('PersistedModel'); }
  },
  defaultDataSources: {
    get: function() { return this.registry.defaultDataSources; }
  },
  modelBuilder: {
    get: function() { return this.registry.modelBuilder; }
  }
});

/*!
 * Create an loopback application.
 *
 * @return {Function}
 * @api public
 */

function createApplication(options) {
  var app = loopbackExpress();

  merge(app, proto);

  app.loopback = loopback;

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

  if (loopback.localRegistry || options && options.localRegistry === true) {
    // setup the app registry
    var registry = app.registry = new Registry();
    if (options && options.loadBuiltinModels === true) {
      require('./builtin-models')(registry);
    }
  } else {
    app.registry = loopback.registry;
  }

  return app;
}

function mixin(source) {
  for (var key in source) {
    var desc = Object.getOwnPropertyDescriptor(source, key);

    // Fix for legacy (pre-ES5) browsers like PhantomJS
    if (!desc) continue;

    Object.defineProperty(loopback, key, desc);
  }
}

mixin(require('./runtime'));

/*!
 * Expose static express methods like `express.errorHandler`.
 */

mixin(express);

/*!
 * Expose additional middleware like session as loopback.*
 * This will keep the loopback API compatible with express 3.x
 *
 * ***only in node***
 */

if (loopback.isServer) {
  var middlewares = require('./express-middleware');
  mixin(middlewares);
}

/*!
 * Expose additional loopback middleware
 * for example `loopback.configure` etc.
 *
 * ***only in node***
 */

if (loopback.isServer) {
  fs
    .readdirSync(path.join(__dirname, '..', 'server', 'middleware'))
    .filter(function(file) {
      return file.match(/\.js$/);
    })
    .forEach(function(m) {
      loopback[m.replace(/\.js$/, '')] = require('../server/middleware/' + m);
    });

  loopback.urlNotFound = loopback['url-not-found'];
  delete loopback['url-not-found'];

  loopback.errorHandler = loopback['error-handler'];
  delete loopback['error-handler'];
}

/*
 * Expose path to the default favicon file
 *
 * ***only in node***
 */

if (loopback.isServer) {
  /*!
   * Path to a default favicon shipped with LoopBack.
   *
   * **Example**
   *
   * ```js
   * app.use(require('serve-favicon')(loopback.faviconFile));
   * ```
   */
  loopback.faviconFile = path.resolve(__dirname, '../favicon.ico');
}

/**
 * Add a remote method to a model.
 * @param {Function} fn
 * @param {Object} options (optional)
 */

loopback.remoteMethod = function(fn, options) {
  fn.shared = true;
  if (typeof options === 'object') {
    Object.keys(options).forEach(function(key) {
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

loopback.template = function(file) {
  var templates = this._templates || (this._templates = {});
  var str = templates[file] || (templates[file] = fs.readFileSync(file, 'utf8'));
  return ejs.compile(str, {
    filename: file
  });
};

require('../server/current-context')(loopback);

/**
 * Create a named vanilla JavaScript class constructor with an attached
 * set of properties and options.
 *
 * This function comes with two variants:
 *  * `loopback.createModel(name, properties, options)`
 *  * `loopback.createModel(config)`
 *
 * In the second variant, the parameters `name`, `properties` and `options`
 * are provided in the config object. Any additional config entries are
 * interpreted as `options`, i.e. the following two configs are identical:
 *
 * ```js
 * { name: 'Customer', base: 'User' }
 * { name: 'Customer', options: { base: 'User' } }
 * ```
 *
 * **Example**
 *
 * Create an `Author` model using the three-parameter variant:
 *
 * ```js
 * loopback.createModel(
 *   'Author',
 *   {
 *     firstName: 'string',
 *     lastName: 'string'
 *   },
 *   {
 *     relations: {
 *       books: {
 *         model: 'Book',
 *         type: 'hasAndBelongsToMany'
 *       }
 *     }
 *   }
 * );
 * ```
 *
 * Create the same model using a config object:
 *
 * ```js
 * loopback.createModel({
 *   name: 'Author',
 *   properties: {
 *     firstName: 'string',
 *     lastName: 'string'
 *   },
 *   relations: {
 *     books: {
 *       model: 'Book',
 *       type: 'hasAndBelongsToMany'
 *     }
 *   }
 * });
 * ```
 *
 * @param {String} name Unique name.
 * @param {Object} properties
 * @param {Object} options (optional)
 *
 * @header loopback.createModel
 */

loopback.createModel = function(name, properties, options) {
  return this.registry.createModel.apply(this.registry, arguments);
};

/**
 * Alter an existing Model class.
 * @param {Model} ModelCtor The model constructor to alter.
 * @options {Object} config Additional configuration to apply
 * @property {DataSource} dataSource Attach the model to a dataSource.
 * @property {Object} [relations] Model relations to add/update.
 *
 * @header loopback.configureModel(ModelCtor, config)
 */

loopback.configureModel = function(ModelCtor, config) {
  return this.registry.configureModel.apply(this.registry, arguments);
};

/**
 * Look up a model class by name from all models created by
 * `loopback.createModel()`
 * @param {String} modelName The model name
 * @returns {Model} The model class
 *
 * @header loopback.findModel(modelName)
 */
loopback.findModel = function(modelName) {
  return this.registry.findModel.apply(this.registry, arguments);
};

/**
 * Look up a model class by name from all models created by
 * `loopback.createModel()`. Throw an error when no such model exists.
 *
 * @param {String} modelName The model name
 * @returns {Model} The model class
 *
 * @header loopback.getModel(modelName)
 */
loopback.getModel = function(modelName) {
  return this.registry.getModel.apply(this.registry, arguments);
};

/**
 * Look up a model class by the base model class.
 * The method can be used by LoopBack
 * to find configured models in models.json over the base model.
 * @param {Model} modelType The base model class
 * @returns {Model} The subclass if found or the base class
 *
 * @header loopback.getModelByType(modelType)
 */
loopback.getModelByType = function(modelType) {
  return this.registry.getModelByType.apply(this.registry, arguments);
};

/**
 * Create a data source with passing the provided options to the connector.
 *
 * @param {String} name Optional name.
 * @options {Object} options Data Source options
 * @property {Object} connector LoopBack connector.
 * @property {*} [*] Other&nbsp;connector properties.
 *   See the relevant connector documentation.
 */

loopback.createDataSource = function(name, options) {
  return this.registry.createDataSource.apply(this.registry, arguments);
};

/**
 * Get an in-memory data source. Use one if it already exists.
 *
 * @param {String} [name] The name of the data source.
 * If not provided, the `'default'` is used.
 */

loopback.memory = function(name) {
  return this.registry.memory.apply(this.registry, arguments);
};

/**
 * Set the default `dataSource` for a given `type`.
 * @param {String} type The datasource type.
 * @param {Object|DataSource} dataSource The data source settings or instance
 * @returns {DataSource} The data source instance.
 *
 * @header loopback.setDefaultDataSourceForType(type, dataSource)
 */

loopback.setDefaultDataSourceForType = function(type, dataSource) {
  return this.registry.setDefaultDataSourceForType.apply(this.registry, arguments);
};

/**
 * Get the default `dataSource` for a given `type`.
 * @param {String} type The datasource type.
 * @returns {DataSource} The data source instance
 */

loopback.getDefaultDataSourceForType = function(type) {
  return this.registry.getDefaultDataSourceForType.apply(this.registry, arguments);
};

/**
 * Attach any model that does not have a dataSource to
 * the default dataSource for the type the Model requests
 */

loopback.autoAttach = function() {
  return this.registry.autoAttach.apply(this.registry, arguments);
};

loopback.autoAttachModel = function(ModelCtor) {
  return this.registry.autoAttachModel.apply(this.registry, arguments);
};

// temporary alias to simplify migration of code based on <=2.0.0-beta3
// TODO(bajtos) Remove this in v3.0
Object.defineProperty(loopback, 'DataModel', {
  get: function() {
    return this.registry.DataModel;
  }
});

/*!
 * Built in models / services
 */

require('./builtin-models')(loopback);

loopback.DataSource = juggler.DataSource;
