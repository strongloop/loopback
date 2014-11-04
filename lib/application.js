/*!
 * Module dependencies.
 */

var DataSource = require('loopback-datasource-juggler').DataSource;
var registry = require('./registry');
var assert = require('assert');
var fs = require('fs');
var extend = require('util')._extend;
var _ = require('underscore');
var RemoteObjects = require('strong-remoting');
var stringUtils = require('underscore.string');
var path = require('path');

/**
 * The `App` object represents a Loopback application.
 *
 * The App object extends [Express](http://expressjs.com/api.html#express) and
 * supports Express middleware. See
 * [Express documentation](http://expressjs.com/) for details.
 *
 * ```js
 * var loopback = require('loopback');
 * var app = loopback();
 *
 * app.get('/', function(req, res){
 *   res.send('hello world');
 * });
 *
 * app.listen(3000);
 * ```
 *
 * @class LoopBackApplication
 * @header var app = loopback()
 */
function App() {
  // this is a dummy placeholder for jsdox
}

/*!
 * Export the app prototype.
 */

var app = module.exports = {};

/**
 * Lazily load a set of [remote objects](http://apidocs.strongloop.com/strong-remoting/#remoteobjectsoptions).
 *
 * **NOTE:** Calling `app.remotes()` more than once returns only a single set of remote objects.
 * @returns {RemoteObjects}
 */

app.remotes = function() {
  if (this._remotes) {
    return this._remotes;
  } else {
    var options = {};

    if (this.get) {
      options = this.get('remoting');
    }

    return (this._remotes = RemoteObjects.create(options));
  }
};

/*!
 * Remove a route by reference.
 */

app.disuse = function(route) {
  if (this.stack) {
    for (var i = 0; i < this.stack.length; i++) {
      if (this.stack[i].route === route) {
        this.stack.splice(i, 1);
      }
    }
  }
};

/**
 * Attach a model to the app. The `Model` will be available on the
 * `app.models` object.
 *
 * Example - Attach an existing model:
 ```js
 * var User = loopback.User;
 * app.model(User);
 *```
 * Example - Attach an existing model, alter some aspects of the model:
 * ```js
 * var User = loopback.User;
 * app.model(User, { dataSource: 'db' });
 *```
 *
 * @param {Object|String} Model The model to attach.
 * @options {Object} config The model's configuration.
 * @property {String|DataSource} dataSource The `DataSource` to which to attach the model.
 * @property {Boolean} [public] Whether the model should be exposed via REST API.
 * @property {Object} [relations] Relations to add/update.
 * @end
 * @returns {ModelConstructor} the model class
 */

app.model = function(Model, config) {
  var isPublic = true;
  if (arguments.length > 1) {
    config = config || {};
    if (typeof Model === 'string') {
      // create & attach the model - backwards compatibility

      // create config for loopback.modelFromConfig
      var modelConfig = extend({}, config);
      modelConfig.options = extend({}, config.options);
      modelConfig.name = Model;

      // modeller does not understand `dataSource` option
      delete modelConfig.dataSource;

      Model = registry.createModel(modelConfig);

      // delete config options already applied
      ['relations', 'base', 'acls', 'hidden'].forEach(function(prop) {
        delete config[prop];
        if (config.options) delete config.options[prop];
      });
      delete config.properties;
    }

    configureModel(Model, config, this);
    isPublic = config.public !== false;
  } else {
    assert(Model.prototype instanceof registry.Model,
      Model.modelName + ' must be a descendant of loopback.Model');
  }

  var modelName = Model.modelName;
  this.models[modelName] =
    this.models[classify(modelName)] =
      this.models[camelize(modelName)] = Model;

  this.models().push(Model);

  if (isPublic && Model.sharedClass) {
    this.remotes().addClass(Model.sharedClass);
    if (Model.settings.trackChanges && Model.Change) {
      this.remotes().addClass(Model.Change.sharedClass);
    }
    clearHandlerCache(this);
    this.emit('modelRemoted', Model.sharedClass);
  }

  Model.shared = isPublic;
  Model.app = this;
  Model.emit('attached', this);
  return Model;
};

/**
 * Get the models exported by the app. Returns only models defined using `app.model()`
 *
 * There are two ways to access models:
 *
 * 1.  Call `app.models()` to get a list of all models.
 *
 * ```js
 * var models = app.models();
 *
 * models.forEach(function(Model) {
 *  console.log(Model.modelName); // color
 * });
 * ```
 *
 * 2. Use `app.model` to access a model by name.
 * `app.model` has properties for all defined models.
 *
 * The following example illustrates accessing the `Product` and `CustomerReceipt` models
 * using the `models` object.
 *
 * ```js
 * var loopback = require('loopback');
 *  var app = loopback();
 *  app.boot({
 *   dataSources: {
 *     db: {connector: 'memory'}
 *   }
 * });
 *
 * app.model('product', {dataSource: 'db'});
 * app.model('customer-receipt', {dataSource: 'db'});
 *
 * // available based on the given name
 * var Product = app.models.Product;
 *
 * // also available as camelCase
 * var product = app.models.product;
 *
 * // multi-word models are avaiable as pascal cased
 * var CustomerReceipt = app.models.CustomerReceipt;
 *
 * // also available as camelCase
 * var customerReceipt = app.models.customerReceipt;
 * ```
 *
 * @returns {Array} Array of model classes.
 */

app.models = function() {
  return this._models || (this._models = []);
};

/**
 * Define a DataSource.
 *
 * @param {String} name The data source name
 * @param {Object} config The data source config
 */
app.dataSource = function(name, config) {
  var ds = dataSourcesFromConfig(config, this.connectors);
  this.dataSources[name] =
  this.dataSources[classify(name)] =
  this.dataSources[camelize(name)] = ds;
  return ds;
};

/**
 * Register a connector.
 *
 * When a new data-source is being added via `app.dataSource`, the connector
 * name is looked up in the registered connectors first.
 *
 * Connectors are required to be explicitly registered only for applications
 * using browserify, because browserify does not support dynamic require,
 * which is used by LoopBack to automatically load the connector module.
 *
 * @param {String} name Name of the connector, e.g. 'mysql'.
 * @param {Object} connector Connector object as returned
 *   by `require('loopback-connector-{name}')`.
 */
app.connector = function(name, connector) {
  this.connectors[name] =
  this.connectors[classify(name)] =
  this.connectors[camelize(name)] = connector;
};

/**
 * Get all remote objects.
 * @returns {Object} [Remote objects](http://apidocs.strongloop.com/strong-remoting/#remoteobjectsoptions).
 */

app.remoteObjects = function() {
  var result = {};

  this.remotes().classes().forEach(function(sharedClass) {
    result[sharedClass.name] = sharedClass.ctor;
  });

  return result;
};

/*!
 * Get a handler of the specified type from the handler cache.
 * @triggers `mounted` events on shared class constructors (models)
 */

app.handler = function(type, options) {
  var handlers = this._handlers || (this._handlers = {});
  if (handlers[type]) {
    return handlers[type];
  }

  var remotes = this.remotes();
  var handler = this._handlers[type] = remotes.handler(type, options);

  remotes.classes().forEach(function(sharedClass) {
    sharedClass.ctor.emit('mounted', app, sharedClass, remotes);
  });

  return handler;
};

/**
 * An object to store dataSource instances.
 */

app.dataSources = app.datasources = {};

/**
 * Enable app wide authentication.
 */

app.enableAuth = function() {
  var remotes = this.remotes();
  var app = this;

  remotes.before('**', function(ctx, next, method) {
    var req = ctx.req;
    var Model = method.ctor;
    var modelInstance = ctx.instance;
    var modelId = modelInstance && modelInstance.id || req.param('id');

    var modelSettings = Model.settings || {};
    var errStatusCode = modelSettings.aclErrorStatus || app.get('aclErrorStatus') || 401;
    if (!req.accessToken) {
      errStatusCode = 401;
    }

    if (Model.checkAccess) {
      Model.checkAccess(
        req.accessToken,
        modelId,
        method,
        ctx,
        function(err, allowed) {
          if (err) {
            console.log(err);
            next(err);
          } else if (allowed) {
            next();
          } else {

            var messages = {
              403:'Access Denied',
              404: ('could not find a model with id ' + modelId),
              401:'Authorization Required'
            };

            var e = new Error(messages[errStatusCode] || messages[403]);
            e.statusCode = errStatusCode;
            next(e);
          }
        }
      );
    } else {
      next();
    }
  });

  this.isAuthEnabled = true;
};

app.boot = function(options) {
  throw new Error(
    '`app.boot` was removed, use the new module loopback-boot instead');
};

function classify(str) {
  return stringUtils.classify(str);
}

function camelize(str) {
  return stringUtils.camelize(str);
}

function dataSourcesFromConfig(config, connectorRegistry) {
  var connectorPath;

  assert(typeof config === 'object',
    'cannont create data source without config object');

  if (typeof config.connector === 'string') {
    var name = config.connector;
    if (connectorRegistry[name]) {
      config.connector = connectorRegistry[name];
    } else {
      connectorPath = path.join(__dirname, 'connectors', name + '.js');

      if (fs.existsSync(connectorPath)) {
        config.connector = require(connectorPath);
      }
    }
  }

  return registry.createDataSource(config);
}

function configureModel(ModelCtor, config, app) {
  assert(ModelCtor.prototype instanceof registry.Model,
    ModelCtor.modelName + ' must be a descendant of loopback.Model');

  var dataSource = config.dataSource;

  if (dataSource) {
    if (typeof dataSource === 'string') {
      dataSource = app.dataSources[dataSource];
    }

    assert(
      dataSource instanceof DataSource,
      ModelCtor.modelName + ' is referencing a dataSource that does not exist: "' +
      config.dataSource + '"'
    );
  }

  config = extend({}, config);
  config.dataSource = dataSource;

  registry.configureModel(ModelCtor, config);
}

function clearHandlerCache(app) {
  app._handlers = undefined;
}

/**
 * Listen for connections and update the configured port.
 *
 * When there are no parameters or there is only one callback parameter,
 * the server will listen on `app.get('host')` and `app.get('port')`.
 *
 * For example, to listen on host/port configured in app config:
 * ```js
 * app.listen();
 * ```
 *
 * Otherwise all arguments are forwarded to `http.Server.listen`.
 *
 * For example, to listen on the specified port and all hosts, and ignore app config.
 * ```js
 * app.listen(80);
 * ```
 *
 * The function also installs a `listening` callback that calls
 * `app.set('port')` with the value returned by `server.address().port`.
 * This way the port param contains always the real port number, even when
 * listen was called with port number 0.
 *
 * @param {Function} [cb] If specified, the callback is added as a listener
 *   for the server's "listening" event.
 * @returns {http.Server} A node `http.Server` with this application configured
 *   as the request handler.
 */
app.listen = function(cb) {
  var self = this;

  var server = require('http').createServer(this);

  server.on('listening', function() {
    self.set('port', this.address().port);

    var listeningOnAll = false;
    var host = self.get('host');
    if (!host) {
      listeningOnAll = true;
      host = this.address().address;
      self.set('host', host);
    } else if (host === '0.0.0.0' || host === '::') {
      listeningOnAll = true;
    }

    if (!self.get('url')) {
      if (process.platform === 'win32' && listeningOnAll) {
        // Windows browsers don't support `0.0.0.0` host in the URL
        // We are replacing it with localhost to build a URL
        // that can be copied and pasted into the browser.
        host = 'localhost';
      }
      var url = 'http://' + host + ':' + self.get('port') + '/';
      self.set('url', url);
    }
  });

  var useAppConfig =
    arguments.length === 0 ||
      (arguments.length == 1 && typeof arguments[0] == 'function');

  if (useAppConfig) {
    server.listen(this.get('port'), this.get('host'), cb);
  } else {
    server.listen.apply(server, arguments);
  }

  return server;
};
