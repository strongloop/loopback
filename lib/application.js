// Copyright IBM Corp. 2013,2019. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

/*!
 * Module dependencies.
 */

'use strict';
const g = require('./globalize');
const DataSource = require('loopback-datasource-juggler').DataSource;
const Registry = require('./registry');
const assert = require('assert');
const fs = require('fs');
const extend = require('util')._extend;
const RemoteObjects = require('strong-remoting');
const classify = require('underscore.string/classify');
const camelize = require('underscore.string/camelize');
const path = require('path');
const util = require('util');

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

const app = module.exports = {};

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
    let options = {};

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
    for (let i = 0; i < this.stack.length; i++) {
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
 * @param {Object} Model The model to attach.
 * @options {Object} config The model's configuration.
 * @property {String|DataSource} dataSource The `DataSource` to which to attach the model.
 * @property {Boolean} [public] Whether the model should be exposed via REST API.
 * @property {Object} [relations] Relations to add/update.
 * @end
 * @returns {ModelConstructor} the model class
 */

app.model = function(Model, config) {
  let isPublic = true;
  const registry = this.registry;

  if (typeof Model === 'string') {
    const msg = 'app.model(modelName, settings) is no longer supported. ' +
      'Use app.registry.createModel(modelName, definition) and ' +
      'app.model(ModelCtor, config) instead.';
    throw new Error(msg);
  }

  if (arguments.length > 1) {
    config = config || {};
    configureModel(Model, config, this);
    isPublic = config.public !== false;
  } else {
    assert(Model.prototype instanceof Model.registry.getModel('Model'),
      Model.modelName + ' must be a descendant of loopback.Model');
  }

  const modelName = Model.modelName;
  this.models[modelName] =
    this.models[classify(modelName)] =
      this.models[camelize(modelName)] = Model;

  this.models().push(Model);

  if (isPublic && Model.sharedClass) {
    this.remotes().defineObjectType(Model.modelName, function(data) {
      return new Model(data);
    });
    this.remotes().addClass(Model.sharedClass);
    if (Model.settings.trackChanges && Model.Change) {
      this.remotes().addClass(Model.Change.sharedClass);
    }
    clearHandlerCache(this);
    this.emit('modelRemoted', Model.sharedClass);
  }

  const self = this;
  Model.on('remoteMethodDisabled', function(model, methodName) {
    clearHandlerCache(self);
    self.emit('remoteMethodDisabled', model, methodName);
  });
  Model.on('remoteMethodAdded', function(model) {
    clearHandlerCache(self);
    self.emit('remoteMethodAdded', model);
  });

  Model.shared = isPublic;
  Model.app = this;
  Model.emit('attached', this);
  return Model;
};

/**
 * Remove all references to a previously registered Model.
 *
 * The method emits "modelDeleted" event as a counter-part to "modelRemoted"
 * event.
 *
 * @param {String} modelName The name of the model to remove.
 */
app.deleteModelByName = function(modelName) {
  const ModelCtor = this.models[modelName];
  delete this.models[modelName];
  delete this.models[classify(modelName)];
  delete this.models[camelize(modelName)];

  if (ModelCtor) {
    ModelCtor.removeAllListeners();

    const ix = this._models.indexOf(ModelCtor);
    if (ix > -1) {
      this._models.splice(ix, 1);
    }
  }

  const remotes = this.remotes();
  remotes.deleteClassByName(modelName);
  remotes.deleteTypeByName(modelName);

  if (ModelCtor && ModelCtor.dataSource) {
    ModelCtor.dataSource.deleteModelByName(modelName);
  } else {
    this.registry.modelBuilder.deleteModelByName(modelName);
  }

  clearHandlerCache(this);

  this.emit('modelDeleted', ModelCtor || modelName);
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
 * 2. Use `app.models` to access a model by name.
 * `app.models` has properties for all defined models.
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
 * var productModel = app.registry.createModel('product');
 * app.model(productModel, {dataSource: 'db'});
 * var customerReceiptModel = app.registry.createModel('customer-receipt');
 * app.model(customerReceiptModel, {dataSource: 'db'});
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
  try {
    const ds = dataSourcesFromConfig(name, config, this.connectors, this.registry);
    this.dataSources[name] =
    this.dataSources[classify(name)] =
    this.dataSources[camelize(name)] = ds;
    ds.app = this;
    return ds;
  } catch (err) {
    if (err.message) {
      err.message = g.f('Cannot create data source %s: %s',
        JSON.stringify(name), err.message);
    }
    throw err;
  }
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
  const result = {};

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
  const handlers = this._handlers || (this._handlers = {});
  if (handlers[type]) {
    return handlers[type];
  }

  const remotes = this.remotes();
  const handler = this._handlers[type] = remotes.handler(type, options);

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

app.enableAuth = function(options) {
  const AUTH_MODELS = ['User', 'AccessToken', 'ACL', 'Role', 'RoleMapping'];

  const remotes = this.remotes();
  const app = this;

  if (options && options.dataSource) {
    const appModels = app.registry.modelBuilder.models;
    AUTH_MODELS.forEach(function(m) {
      const Model = app.registry.findModel(m);
      if (!Model) {
        throw new Error(
          g.f('Authentication requires model %s to be defined.', m),
        );
      }

      if (Model.dataSource || Model.app) return;

      // Find descendants of Model that are attached,
      // for example "Customer" extending "User" model
      for (const name in appModels) {
        const candidate = appModels[name];
        const isSubclass = candidate.prototype instanceof Model;
        const isAttached = !!candidate.dataSource || !!candidate.app;
        if (isSubclass && isAttached) return;
      }

      app.model(Model, {
        dataSource: options.dataSource,
        public: m === 'User',
      });
    });
  }

  remotes.authorization = function(ctx, next) {
    const method = ctx.method;
    const req = ctx.req;
    const Model = method.ctor;
    const modelInstance = ctx.instance;

    const modelId = modelInstance && modelInstance.id ||
      // replacement for deprecated req.param()
      (req.params && req.params.id !== undefined ? req.params.id :
        req.body && req.body.id !== undefined ? req.body.id :
          req.query && req.query.id !== undefined ? req.query.id :
            undefined);

    const modelName = Model.modelName;

    const modelSettings = Model.settings || {};
    let errStatusCode = modelSettings.aclErrorStatus || app.get('aclErrorStatus') || 401;
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
            const messages = {
              403: {
                message: g.f('Access Denied'),
                code: 'ACCESS_DENIED',
              },
              404: {
                message: (g.f('could not find %s with id %s', modelName, modelId)),
                code: 'MODEL_NOT_FOUND',
              },
              401: {
                message: g.f('Authorization Required'),
                code: 'AUTHORIZATION_REQUIRED',
              },
            };

            const e = new Error(messages[errStatusCode].message || messages[403].message);
            e.statusCode = errStatusCode;
            e.code = messages[errStatusCode].code || messages[403].code;
            next(e);
          }
        },
      );
    } else {
      next();
    }
  };

  this._verifyAuthModelRelations();

  this.isAuthEnabled = true;
};

app._verifyAuthModelRelations = function() {
  // Allow unit-tests (but also LoopBack users) to disable the warnings
  if (this.get('_verifyAuthModelRelations') === false) return;

  const AccessToken = this.registry.findModel('AccessToken');
  const User = this.registry.findModel('User');
  this.models().forEach(Model => {
    if (Model === AccessToken || Model.prototype instanceof AccessToken) {
      scheduleVerification(Model, verifyAccessTokenRelations);
    }

    if (Model === User || Model.prototype instanceof User) {
      scheduleVerification(Model, verifyUserRelations);
    }
  });

  function scheduleVerification(Model, verifyFn) {
    if (Model.dataSource) {
      verifyFn(Model);
    } else {
      Model.on('attached', () => verifyFn(Model));
    }
  }

  function verifyAccessTokenRelations(Model) {
    const belongsToUser = Model.relations && Model.relations.user;
    if (belongsToUser) return;

    const relationsConfig = Model.settings.relations || {};
    const userName = (relationsConfig.user || {}).model;
    if (userName) {
      console.warn(
        'The model %j configures "belongsTo User-like models" relation ' +
          'with target model %j. However, the model %j is not attached to ' +
          'the application and therefore cannot be used by this relation. ' +
          'This typically happens when the application has a custom ' +
          'custom User subclass, but does not fix AccessToken relations ' +
          'to use this new model.\n' +
          'Learn more at http://ibm.biz/setup-loopback-auth',
        Model.modelName, userName, userName,
      );
      return;
    }

    console.warn(
      'The model %j does not have "belongsTo User-like model" relation ' +
        'configured.\n' +
        'Learn more at http://ibm.biz/setup-loopback-auth',
      Model.modelName,
    );
  }

  function verifyUserRelations(Model) {
    const hasManyTokens = Model.relations && Model.relations.accessTokens;

    if (hasManyTokens) {
      // display a temp warning message for users using multiple users config
      if (hasManyTokens.polymorphic) {
        console.warn(
          'The app configuration follows the multiple user models setup ' +
            'as described in http://ibm.biz/setup-loopback-auth',
          'The built-in role resolver $owner is not currently compatible ' +
            'with this configuration and should not be used in production.',
        );
      }
      return;
    }

    const relationsConfig = Model.settings.relations || {};
    const accessTokenName = (relationsConfig.accessTokens || {}).model;
    if (accessTokenName) {
      console.warn(
        'The model %j configures "hasMany AccessToken-like models" relation ' +
          'with target model %j. However, the model %j is not attached to ' +
          'the application and therefore cannot be used by this relation. ' +
          'This typically happens when the application has a custom ' +
          'AccessToken subclass, but does not fix User relations to use this ' +
          'new model.\n' +
          'Learn more at http://ibm.biz/setup-loopback-auth',
        Model.modelName, accessTokenName, accessTokenName,
      );
      return;
    }

    console.warn(
      'The model %j does not have "hasMany AccessToken-like models" relation ' +
        'configured.\n' +
        'Learn more at http://ibm.biz/setup-loopback-auth',
      Model.modelName,
    );
  }
};

app.boot = function(options) {
  throw new Error(
    g.f('{{`app.boot`}} was removed, use the new module {{loopback-boot}} instead'),
  );
};

function dataSourcesFromConfig(name, config, connectorRegistry, registry) {
  let connectorPath;

  assert(typeof config === 'object',
    'can not create data source without config object');

  if (typeof config.connector === 'string') {
    const connectorName = config.connector;
    if (connectorRegistry[connectorName]) {
      config.connector = connectorRegistry[connectorName];
    } else {
      connectorPath = path.join(__dirname, 'connectors', connectorName + '.js');

      if (fs.existsSync(connectorPath)) {
        config.connector = require(connectorPath);
      }
    }
    if (config.connector && typeof config.connector === 'object' && !config.connector.name)
      config.connector.name = connectorName;
  }

  return registry.createDataSource(name, config);
}

function configureModel(ModelCtor, config, app) {
  assert(ModelCtor.prototype instanceof ModelCtor.registry.getModel('Model'),
    ModelCtor.modelName + ' must be a descendant of loopback.Model');

  let dataSource = config.dataSource;

  if (dataSource) {
    if (typeof dataSource === 'string') {
      dataSource = app.dataSources[dataSource];
    }

    assert(
      dataSource instanceof DataSource,
      ModelCtor.modelName + ' is referencing a dataSource that does not exist: "' +
      config.dataSource + '"',
    );
  }

  config = extend({}, config);
  config.dataSource = dataSource;

  app.registry.configureModel(ModelCtor, config);
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
  const self = this;

  const server = require('http').createServer(this);

  server.on('listening', function() {
    self.set('port', this.address().port);

    let listeningOnAll = false;
    let host = self.get('host');
    if (!host) {
      listeningOnAll = true;
      host = this.address().address;
      self.set('host', host);
    } else if (host === '0.0.0.0' || host === '::') {
      listeningOnAll = true;
    }

    if (!self.get('url')) {
      if (listeningOnAll) {
        // We are replacing it with localhost to build a URL
        // that can be copied and pasted into the browser.
        host = 'localhost';
      }
      const url = 'http://' + host + ':' + self.get('port') + '/';
      self.set('url', url);
    }
  });

  const useAppConfig =
    arguments.length === 0 ||
      (arguments.length == 1 && typeof arguments[0] == 'function');

  if (useAppConfig) {
    let port = this.get('port');
    // NOTE(bajtos) port:undefined no longer works on node@6,
    // we must pass port:0 explicitly
    if (port === undefined) port = 0;
    server.listen(port, this.get('host'), cb);
  } else {
    server.listen.apply(server, arguments);
  }

  return server;
};
