// Copyright IBM Corp. 2013,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

/*!
 * Module dependencies.
 */

'use strict';
var g = require('./globalize');
var DataSource = require('loopback-datasource-juggler').DataSource;
var Registry = require('./registry');
var assert = require('assert');
var fs = require('fs');
var extend = require('util')._extend;
var RemoteObjects = require('strong-remoting');
var classify = require('underscore.string/classify');
var camelize = require('underscore.string/camelize');
var path = require('path');
var util = require('util');
var Promise = require('bluebird');

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
 * @param {Object} Model The model to attach.
 * @options {Object} config The model's configuration.
 * @property {String|DataSource} dataSource The `DataSource` to which to attach the model.
 * @property {Boolean} [public] Whether the model should be exposed via REST API.
 * @property {Object} [relations] Relations to add/update.
 * @end
 * @returns {ModelConstructor} the model class
 */

app.model = function(Model, config) {
  var isPublic = true;
  var registry = this.registry;

  if (typeof Model === 'string') {
    var msg = 'app.model(modelName, settings) is no longer supported. ' +
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

  var modelName = Model.modelName;
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

  var self = this;
  Model.on('remoteMethodDisabled', function(model, methodName) {
    self.emit('remoteMethodDisabled', model, methodName);
  });

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
    var ds = dataSourcesFromConfig(name, config, this.connectors, this.registry);
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

app.enableAuth = function(options) {
  var AUTH_MODELS = ['User', 'AccessToken', 'ACL', 'Role', 'RoleMapping'];

  var remotes = this.remotes();
  var app = this;

  if (options && options.dataSource) {
    var appModels = app.registry.modelBuilder.models;
    AUTH_MODELS.forEach(function(m) {
      var Model = app.registry.findModel(m);
      if (!Model) {
        throw new Error(
          g.f('Authentication requires model %s to be defined.', m));
      }

      if (Model.dataSource || Model.app) return;

      // Find descendants of Model that are attached,
      // for example "Customer" extending "User" model
      for (var name in appModels) {
        var candidate = appModels[name];
        var isSubclass = candidate.prototype instanceof Model;
        var isAttached = !!candidate.dataSource || !!candidate.app;
        if (isSubclass && isAttached) return;
      }

      app.model(Model, {
        dataSource: options.dataSource,
        public: m === 'User',
      });
    });
  }

  remotes.authorization = function(ctx, next) {
    var method = ctx.method;
    var req = ctx.req;
    var Model = method.ctor;
    var modelInstance = ctx.instance;

    var modelId = modelInstance && modelInstance.id ||
      // replacement for deprecated req.param()
      (req.params && req.params.id !== undefined ? req.params.id :
       req.body && req.body.id !== undefined ? req.body.id :
       req.query && req.query.id !== undefined ? req.query.id :
       undefined);

    var modelName = Model.modelName;

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

            var e = new Error(messages[errStatusCode].message || messages[403].message);
            e.statusCode = errStatusCode;
            e.code = messages[errStatusCode].code || messages[403].code;
            next(e);
          }
        }
      );
    } else {
      next();
    }
  };

  return this._verifyAuthModelRelations(app._warnOnBadAuthModelRelations)
    .then(() => {
      this.isAuthEnabled = true;
    });
};

app._verifyAuthModelRelations = function(warnFn) {
  let self = this;

  // Allow unit-tests (but also LoopBack users) to disable the warnings
  const warnOnBadSetup = this.get('_warnOnBadAuthModelsSetup') !== false;
  // Prevent the app from being killed although the configuration is inconsistent
  const abortOnBadUserSetup = this.get('_abortOnBadUserSetup') !== false;

  const AccessToken = this.registry.findModel('AccessToken');
  const User = this.registry.findModel('User');
  const models = this.models();

  return verifyUserModelsSetup().then(verifyRelationsSetup);

  function verifyUserModelsSetup() {
    let userModels = models.filter(model => {
      return (model === User || model.prototype instanceof User) ||
        (model === AccessToken || model.prototype instanceof AccessToken);
    });

    // we use Promise.reflect() here to let all the tests go without throwing,
    // this way we can get all the logs for all models we are checking
    return Promise.map(userModels,
      model => scheduleVerification(model, hasMultipleUserModelsConfig).reflect()
    )
    .then(inspections => {
      // proceed to next checkups if no error
      let hasErrors = inspections.filter(inspection => inspection.isRejected());
      if (!hasErrors.length) {
        return;
      }

      // else log and eventually kill the app
      warnFn('BAD_USER_MODELS_SETUP');

      // detailed logs
      inspections.forEach(inspection => {
        console.log(inspection);
        let modelSetup = (inspection.value() || inspection.reason()).modelSetup;
        console.warn(
          'Model %j of type %j is set to use the %j user model config',
          modelSetup.model,
          modelSetup.instanceOf,
          modelSetup.hasMultipleUserModelsConfig ? 'Multiple' : 'Single'
        );
      });

      delete this.hasMultipleUserModelsConfig;

      if (abortOnBadUserSetup) {
        const msg = 'Application setup is inconsistent, please see the log ' +
          'for more information';
        const error = new Error(msg);
        error.code = 'BAD_USER_MODELS_SETUP';
        throw error;
      }
    });
  }

  function verifyRelationsSetup() {
    models.forEach(Model => {
      if (Model === AccessToken || Model.prototype instanceof AccessToken) {
        scheduleVerification(Model, verifyAccessTokenRelations);
      }

      if (Model === User || Model.prototype instanceof User) {
        scheduleVerification(Model, verifyUserRelations);
      }
    });
  }

  // instant or scheduled Model verifications, as a promise
  function scheduleVerification(Model, verifyFn) {
    return new Promise((resolve, reject) => {
      if (Model.dataSource) {
        try {
          resolve(verifyFn(Model));
        } catch (e) {
          reject(e);
        }
      } else {
        Model.on('attached', () => {
          scheduleVerification(Model, verifyFn);
        });
      }
    });
  }

  function hasMultipleUserModelsConfig(model) {
    let hasMultipleUserModelsConfig, isInstanceOfUser;

    // check is the model is set to use mutiple users config (with polymorphic relations)
    if (model === User || model.prototype instanceof User) {
      isInstanceOfUser = true;
      const hasManyTokens = model.relations && model.relations.accessTokens;
      // TODO: handle when hasManyTokens is undefined?
      hasMultipleUserModelsConfig = !!(hasManyTokens.polymorphic);
    } else if (model === AccessToken || model.prototype instanceof AccessToken) {
      const belongsToUser = model.relations && model.relations.user;
      // the test on belongsToUser is required as we allow AccessToken model not
      // to define the relation with custom user model for backward compatibility
      // see https://github.com/strongloop/loopback/pull/3227
      hasMultipleUserModelsConfig = !!(belongsToUser && belongsToUser.polymorphic);
    }

    let modelSetup = {
      model: model.modelName,
      instanceOf: isInstanceOfUser ? 'User' : 'AccessToken',
      hasMultipleUserModelsConfig,
    };

    // check if model config is consistent with already parsed models' config
    if (self.hasMultipleUserModelsConfig === undefined) {
      self.hasMultipleUserModelsConfig = hasMultipleUserModelsConfig;
    } else if (self.hasMultipleUserModelsConfig !== hasMultipleUserModelsConfig) {
      let error = new Error('User models setup is inconsistent');
      error.modelSetup = modelSetup;
      throw error;
    }

    // if no error, return the modelSetup for further logging purposes
    return {modelSetup};
  }

  function verifyAccessTokenRelations(Model) {
    if (!warnOnBadSetup) return;
    const belongsToUser = Model.relations && Model.relations.user;
    if (belongsToUser) return;

    const modelFrom = Model.modelName;
    const relationsConfig = Model.settings.relations || {};
    const modelTo = (relationsConfig.user || {}).model;
    if (modelTo) {
      warnFn('CUSTOM_USER_MODEL_NOT_AVAILABLE', {modelFrom, modelTo});
      return;
    }

    warnFn('MISSING_RELATION_TO_USER', {modelFrom});
  }

  function verifyUserRelations(Model) {
    if (!warnOnBadSetup) return;

    const hasManyTokens = Model.relations && Model.relations.accessTokens;
    if (hasManyTokens) return;

    const modelFrom = Model.modelName;
    const relationsConfig = Model.settings.relations || {};
    const modelTo = (relationsConfig.accessTokens || {}).model;
    if (modelTo) {
      warnFn('CUSTOM_ACCESS_TOKEN_MODEL_NOT_AVAILABLE', {modelFrom, modelTo});
      return;
    }

    warnFn('MISSING_RELATION_TO_ACCESS_TOKEN', {modelFrom});
  }
};

// function warnOnBadAuthModelRelations(code, args) {
app._warnOnBadAuthModelRelations = function(code, args) {
  switch (code) {
    case 'BAD_USER_MODELS_SETUP':
      g.warn('Application setup is inconsistent: some models are set to use ' +
        'the Multiple user models configuration while some other models are set to ' +
        'use the Single user model configuration. The model config is listed below.');
      break;

    case 'CUSTOM_USER_MODEL_NOT_AVAILABLE':
      g.warn(
        'The model %j configures "belongsTo User-like models" relation ' +
          'with target model %j. However, the model %j is not attached to ' +
          'the application and therefore cannot be used by this relation. ' +
          'This typically happens when the application has a custom ' +
          'custom User subclass, but does not fix AccessToken relations ' +
          'to use this new model.\n' +
          'Learn more at http://ibm.biz/setup-loopback-auth',
        args.modelFrom, args.modelTo, args.modelTo);
      break;

    case 'MISSING_RELATION_TO_USER':
      g.warn(
        'The model %j does not have "belongsTo User-like model" relation ' +
          'configured.\n' +
          'Learn more at http://ibm.biz/setup-loopback-auth',
        args.modelFrom);
      break;

    case 'CUSTOM_ACCESS_TOKEN_MODEL_NOT_AVAILABLE':
      g.warn(
        'The model %j configures "hasMany AccessToken-like models" relation ' +
          'with target model %j. However, the model %j is not attached to ' +
          'the application and therefore cannot be used by this relation. ' +
          'This typically happens when the application has a custom ' +
          'AccessToken subclass, but does not fix User relations to use this ' +
          'new model.\n' +
          'Learn more at http://ibm.biz/setup-loopback-auth',
        args.modelFrom, args.modelTo, args.modelTo);
      break;

    case 'MISSING_RELATION_TO_ACCESS_TOKEN':
      g.warn(
        'The model %j does not have "hasMany AccessToken-like models" relation ' +
          'configured.\n' +
          'Learn more at http://ibm.biz/setup-loopback-auth',
        args.modelFrom);
  }
};

app.boot = function(options) {
  throw new Error(
    g.f('{{`app.boot`}} was removed, use the new module {{loopback-boot}} instead'));
};

function dataSourcesFromConfig(name, config, connectorRegistry, registry) {
  var connectorPath;

  assert(typeof config === 'object',
    'can not create data source without config object');

  if (typeof config.connector === 'string') {
    name = config.connector;
    if (connectorRegistry[name]) {
      config.connector = connectorRegistry[name];
    } else {
      connectorPath = path.join(__dirname, 'connectors', name + '.js');

      if (fs.existsSync(connectorPath)) {
        config.connector = require(connectorPath);
      }
    }
    if (config.connector && typeof config.connector === 'object' && !config.connector.name)
      config.connector.name = name;
  }

  return registry.createDataSource(config);
}

function configureModel(ModelCtor, config, app) {
  assert(ModelCtor.prototype instanceof ModelCtor.registry.getModel('Model'),
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

  setSharedMethodSharedProperties(ModelCtor, app, config);

  app.registry.configureModel(ModelCtor, config);
}

function setSharedMethodSharedProperties(model, app, modelConfigs) {
  var settings = {};

  // apply config.json settings
  var config = app.get('remoting');
  var configHasSharedMethodsSettings = config &&
      config.sharedMethods &&
      typeof config.sharedMethods === 'object';
  if (configHasSharedMethodsSettings)
    util._extend(settings, config.sharedMethods);

  // apply model-config.json settings
  var modelConfig = modelConfigs.options;
  var modelConfigHasSharedMethodsSettings = modelConfig &&
      modelConfig.remoting &&
      modelConfig.remoting.sharedMethods &&
      typeof modelConfig.remoting.sharedMethods === 'object';
  if (modelConfigHasSharedMethodsSettings)
    util._extend(settings, modelConfig.remoting.sharedMethods);

  // validate setting values
  Object.keys(settings).forEach(function(setting) {
    var settingValue = settings[setting];
    var settingValueType = typeof settingValue;
    if (settingValueType !== 'boolean')
      throw new TypeError(g.f('Expected boolean, got %s', settingValueType));
  });

  // set sharedMethod.shared using the merged settings
  var sharedMethods = model.sharedClass.methods({includeDisabled: true});
  sharedMethods.forEach(function(sharedMethod) {
    // use the specific setting if it exists
    var hasSpecificSetting = settings.hasOwnProperty(sharedMethod.name);
    if (hasSpecificSetting) {
      sharedMethod.shared = settings[sharedMethod.name];
    } else { // otherwise, use the default setting if it exists
      var hasDefaultSetting = settings.hasOwnProperty('*');
      if (hasDefaultSetting)
        sharedMethod.shared = settings['*'];
    }
  });
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
    var port = this.get('port');
    // NOTE(bajtos) port:undefined no longer works on node@6,
    // we must pass port:0 explicitly
    if (port === undefined) port = 0;
    server.listen(port, this.get('host'), cb);
  } else {
    server.listen.apply(server, arguments);
  }

  return server;
};
