/*!
 * Module dependencies.
 */

var DataSource = require('loopback-datasource-juggler').DataSource
  , registry = require('./registry')
  , compat = require('./compat')
  , assert = require('assert')
  , fs = require('fs')
  , extend = require('util')._extend
  , _ = require('underscore')
  , RemoteObjects = require('strong-remoting')
  , swagger = require('strong-remoting/ext/swagger')
  , stringUtils = require('underscore.string')
  , path = require('path');

/**
 * The `App` object represents a Loopback application.
 * 
 * The App object extends [Express](http://expressjs.com/api.html#express) and
 * supports
 * [Express / Connect middleware](http://expressjs.com/api.html#middleware). See
 * [Express documentation](http://expressjs.com/api.html) for details.
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

var app = exports = module.exports = {};

/**
 * Lazily load a set of [remote objects](http://apidocs.strongloop.com/strong-remoting/#remoteobjectsoptions).
 *
 * **NOTE:** Calling `app.remotes()` more than once returns only a single set of remote objects.
 * @returns {RemoteObjects}
 */

app.remotes = function () {
  if(this._remotes) {
    return this._remotes;
  } else {
    var options = {};

    if(this.get) {
      options = this.get('remoting');
    }
     
    return (this._remotes = RemoteObjects.create(options));
  }
}

/*!
 * Remove a route by reference.
 */

app.disuse = function (route) {
  if(this.stack) {
    for (var i = 0; i < this.stack.length; i++) {
      if(this.stack[i].route === route) {
        this.stack.splice(i, 1);
      }
    }
  }
}

/**
 * Attach a model to the app. The `Model` will be available on the
 * `app.models` object.
 *
 * ```js
 * // Attach an existing model
 * var User = loopback.User;
 * app.model(User);
 *
 * // Attach an existing model, alter some aspects of the model
 * var User = loopback.User;
 * app.model(User, { dataSource: 'db' });
 *
 * // The old way: create and attach a new model (deprecated)
 * var Widget = app.model('Widget', {
 *   dataSource: 'db',
 *   properties: {
 *     name: 'string'
 *   }
 * });
 * ```
 * 
 * @param {Object|String} Model The model to attach.
 * @options {Object} config The model's configuration.
 * @property {String|DataSource} dataSource The `DataSource` to which to
 * attach the model.
 * @property {Boolean} [public] whether the model should be exposed via REST API
 * @property {Object} [relations] relations to add/update
 * @end
 * @returns {ModelConstructor} the model class
 */

app.model = function (Model, config) {
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
      'Model must be a descendant of loopback.Model');
  }

  var modelName = Model.modelName;
  this.models[modelName] =
    this.models[classify(modelName)] =
      this.models[camelize(modelName)] = Model;

  this.models().push(Model);

  if (isPublic) {
    var remotingClassName = compat.getClassNameForRemoting(Model);
    this.remotes().exports[remotingClassName] = Model;
    clearHandlerCache(this);
  }

  Model.shared = isPublic; // The base Model has shared = true
  Model.app = this;
  Model.emit('attached', this);
  return Model;
};

/**
 * Get the models exported by the app. Returns only models defined using `app.model()`
 *
 * **Deprecated. Use the package
 * [loopback-boot](https://github.com/strongloop/loopback-boot) instead.**

 * There are two ways to access models:
 *
 * 1.  Call `app.models()` to get a list of all models.
 *
 * ```js
 * var models = app.models();
 *
 * models.forEach(function (Model) {
 *  console.log(Model.modelName); // color
 * });
 * ```
 *
 * **2. Use `app.model` to access a model by name. 
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

app.models = function () {
  return this._models || (this._models = []);
}

/**
 * Define a DataSource.
 *
 * @param {String} name The data source name
 * @param {Object} config The data source config 
 */

app.dataSource = function (name, config) {
  this.dataSources[name] =
  this.dataSources[classify(name)] =
  this.dataSources[camelize(name)] =
    dataSourcesFromConfig(config, this.connectors);
}

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

app.remoteObjects = function () {
  var result = {};
  var models = this.models();
  
  // add in models
  models.forEach(function (ModelCtor) {
    // only add shared models
    if(ModelCtor.shared && typeof ModelCtor.sharedCtor === 'function') {
      result[compat.getClassNameForRemoting(ModelCtor)] = ModelCtor;
    }
  });
    
  return result;
}

/**
 * Enable swagger REST API documentation.
 *
 * **Note**: This method is deprecated.  Use [loopback-explorer](http://npmjs.org/package/loopback-explorer) instead.
 *
 * **Options**
 *
 * - `basePath` The basepath for your API - eg. 'http://localhost:3000'.
 *
 * **Example**
 *
 * ```js
 * // enable docs
 * app.docs({basePath: 'http://localhost:3000'});
 * ```
 *
 * Run your app then navigate to
 * [the API explorer](http://petstore.swagger.wordnik.com/).
 * Enter your API basepath to view your generated docs.
 *
 * @deprecated
 */
 
app.docs = function (options) {
  var remotes = this.remotes();
  swagger(remotes, options);
}

/*!
 * Get a handler of the specified type from the handler cache.
 */
 
app.handler = function (type) {
  var handlers = this._handlers || (this._handlers = {});
  if(handlers[type]) {
    return handlers[type];
  }
  
  var remotes = this.remotes();
  var handler = this._handlers[type] = remotes.handler(type);
  return handler;
}

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
    if(!req.accessToken){
      errStatusCode = 401;
    }

    if(Model.checkAccess) {
      // Pause the request before checking access
      // See https://github.com/strongloop/loopback-storage-service/issues/7
      req.pause();
      Model.checkAccess(
        req.accessToken,
        modelId,
        method,
        function(err, allowed) {
          // Emit any cached data events that fired while checking access.
          req.resume();
          if(err) {
            console.log(err);
            next(err);
          } else if(allowed) {
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

/**
 * Initialize an application from an options object or a set of JSON and JavaScript files.
 * 
 * This function takes an optional argument that is either a string or an object.
 * 
 * If the argument is a string, then it sets the application root directory based on the string value.  Then it:
 * 1. Creates DataSources from the `datasources.json` file in the application root directory.
 * 2. Creates Models from the `models.json` file in the application root directory.
 * 
 * If the argument is an object, then it looks for `model`, `dataSources`, and `appRootDir` properties of the object.
 * If the object has no `appRootDir` property then it sets the current working directory as the application root directory.
 * Then it:
 * 1. Creates DataSources from the `options.dataSources` object.
 * 2. Creates Models from the `options.models` object.
 *
 * In both cases, the function loads JavaScript files in the `/models` and `/boot` subdirectories of the application root directory with `require()`.
 * 
 *  **NOTE:** mixing `app.boot()` and `app.model(name, config)` in multiple
 *  files may result in models being **undefined** due to race conditions.
 *  To avoid this when using `app.boot()` make sure all models are passed as part of the `models` definition.
 *
 * Throws an error if the config object is not valid or if boot fails.
 *
 * <a name="model-definition"></a>
 * **Model Definitions**
 * 
 * The following is example JSON for two `Model` definitions: "dealership" and "location".
 * 
 * ```js
 * {
 *   "dealership": {
 *     // a reference, by name, to a dataSource definition
 *     "dataSource": "my-db",
 *     // the options passed to Model.extend(name, properties, options)
 *     "options": {
 *       "relations": {
 *         "cars": {
 *           "type": "hasMany",
 *           "model": "Car",
 *           "foreignKey": "dealerId"  
 *         }
 *       }
 *     },
 *     // the properties passed to Model.extend(name, properties, options)
 *     "properties": {
 *       "id": {"id": true},
 *       "name": "String",
 *       "zip": "Number",
 *       "address": "String"
 *     }
 *   },
 *   "car": {
 *     "dataSource": "my-db"
 *     "properties": {
 *       "id": {
 *         "type": "String",
 *         "required": true,
 *         "id": true
 *       },
 *       "make": {
 *         "type": "String",
 *         "required": true
 *       },
 *       "model": {
 *         "type": "String",
 *         "required": true
 *       }
 *     }
 *   }
 * }
 * ```
 * @options {String|Object} options Boot options; If String, this is the application root directory; if object, has below properties. 
 * @property {String} appRootDir Directory to use when loading JSON and JavaScript files (optional).  Defaults to the current directory (`process.cwd()`).
 * @property {Object} models Object containing `Model` definitions (optional).
 * @property {Object} dataSources Object containing `DataSource` definitions (optional).
 * @end
 * 
 * @header app.boot([options])
 */

app.boot = function(options) {
  options = options || {};

  if(typeof options === 'string') {
    options = {appRootDir: options};
  }
  var app = this;
  var appRootDir = options.appRootDir = options.appRootDir || process.cwd();
  var ctx = {};
  var appConfig = options.app;
  var modelConfig = options.models;
  var dataSourceConfig = options.dataSources;

  if(!appConfig) {
    appConfig = tryReadConfig(appRootDir, 'app') || {};
  }
  if(!modelConfig) {
    modelConfig = tryReadConfig(appRootDir, 'models') || {};
  }
  if(!dataSourceConfig) {
    dataSourceConfig = tryReadConfig(appRootDir, 'datasources') || {};
  }

  assertIsValidConfig('app', appConfig);
  assertIsValidConfig('model', modelConfig);
  assertIsValidConfig('data source', dataSourceConfig);

  appConfig.host = 
    process.env.npm_config_host ||
    process.env.OPENSHIFT_SLS_IP ||
    process.env.OPENSHIFT_NODEJS_IP ||
    process.env.HOST ||
    appConfig.host ||
    process.env.npm_package_config_host ||
    app.get('host');

  appConfig.port = _.find([
    process.env.npm_config_port,
    process.env.OPENSHIFT_SLS_PORT,
    process.env.OPENSHIFT_NODEJS_PORT,
    process.env.PORT,
    appConfig.port,
    process.env.npm_package_config_port,
    app.get('port'),
    3000
  ], _.isFinite);

  appConfig.restApiRoot =
    appConfig.restApiRoot ||
    app.get('restApiRoot') ||
    '/api';

  if(appConfig.host !== undefined) {
    assert(typeof appConfig.host === 'string', 'app.host must be a string');
    app.set('host', appConfig.host);
  }

  if(appConfig.port !== undefined) {
    var portType = typeof appConfig.port;
    assert(portType === 'string' || portType === 'number', 'app.port must be a string or number');
    app.set('port', appConfig.port);
  }

  assert(appConfig.restApiRoot !== undefined, 'app.restApiRoot is required');
  assert(typeof appConfig.restApiRoot === 'string', 'app.restApiRoot must be a string');
  assert(/^\//.test(appConfig.restApiRoot), 'app.restApiRoot must start with "/"');
  app.set('restApiRoot', appConfig.restApiRoot);

  for(var configKey in appConfig) {
    var cur = app.get(configKey);
    if(cur === undefined || cur === null) {
      app.set(configKey, appConfig[configKey]);
    }
  }

  // instantiate data sources
  forEachKeyedObject(dataSourceConfig, function(key, obj) {
    app.dataSource(key, obj);
  });

  // instantiate models
  forEachKeyedObject(modelConfig, function(key, obj) {
    app.model(key, obj);
  });

  // try to attach models to dataSources by type
  try {
    registry.autoAttach();
  } catch(e) {
    if(e.name === 'AssertionError') {
      console.warn(e);
    } else {
      throw e;
    }
  }

  // disable token requirement for swagger, if available
  var swagger = app.remotes().exports.swagger;
  var requireTokenForSwagger = appConfig.swagger
                            && appConfig.swagger.requireToken;
  if(swagger) {
    swagger.requireToken = requireTokenForSwagger || false;
  }

  // require directories
  var requiredModels = requireDir(path.join(appRootDir, 'models'));
  var requiredBootScripts = requireDir(path.join(appRootDir, 'boot'));
}

function assertIsValidConfig(name, config) {
  if(config) {
    assert(typeof config === 'object', name + ' config must be a valid JSON object');  
  }
}

function forEachKeyedObject(obj, fn) {
  if(typeof obj !== 'object') return;

  Object.keys(obj).forEach(function(key) {
    fn(key, obj[key]);
  });
}

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

  if(typeof config.connector === 'string') {
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
    'Model must be a descendant of loopback.Model');

  var dataSource = config.dataSource;

  if(typeof dataSource === 'string') {
    dataSource = app.dataSources[dataSource];
  }

  assert(dataSource instanceof DataSource,
      ModelCtor.modelName + ' is referencing a dataSource that does not exist: "' +
        config.dataSource +'"');

  config = extend({}, config);
  config.dataSource = dataSource;

  registry.configureModel(ModelCtor, config);
}

function requireDir(dir, basenames) {
  assert(dir, 'cannot require directory contents without directory name');

  var requires = {};

  if (arguments.length === 2) {
    // if basenames argument is passed, explicitly include those files
    basenames.forEach(function (basename) {
      var filepath = Path.resolve(Path.join(dir, basename));
      requires[basename] = tryRequire(filepath);
    });
  } else if (arguments.length === 1) {
    // if basenames arguments isn't passed, require all javascript
    // files (except for those prefixed with _) and all directories

    var files = tryReadDir(dir);

    // sort files in lowercase alpha for linux
    files.sort(function (a,b) {
      a = a.toLowerCase();
      b = b.toLowerCase();

      if (a < b) {
        return -1;
      } else if (b < a) {
        return 1;
      } else {
        return 0;
      }
    });

    files.forEach(function (filename) {
      // ignore index.js and files prefixed with underscore
      if ((filename === 'index.js') || (filename[0] === '_')) { return; }

      var filepath = path.resolve(path.join(dir, filename));
      var ext = path.extname(filename);
      var stats = fs.statSync(filepath);

      // only require files supported by require.extensions (.txt .md etc.)
      if (stats.isFile() && !(ext in require.extensions)) { return; }

      var basename = path.basename(filename, ext);

      requires[basename] = tryRequire(filepath);
    });

  }

  return requires;
};

function tryRequire(modulePath) {
  try {
    return require.apply(this, arguments);
  } catch(e) {
    console.error('failed to require "%s"', modulePath);
    throw e;
  }
}

function tryReadDir() {
  try {
    return fs.readdirSync.apply(fs, arguments);
  } catch(e) {
    return [];
  }
}

function tryReadConfig(cwd, fileName) {
  try {
    return require(path.join(cwd, fileName + '.json'));
  } catch(e) {
    if(e.code !== "MODULE_NOT_FOUND") {
      throw e;
    }
  }
}

function clearHandlerCache(app) {
  app._handlers = undefined;
}

/*!
 * This function is now deprecated.
 * Install all express middleware required by LoopBack.
 *
 * It is possible to inject your own middleware by listening on one of the
 * following events:
 *
 *  - `middleware:preprocessors` is emitted after all other
 *    request-preprocessing middleware was installed, but before any
 *    request-handling middleware is configured.
 *
 *    Usage:
 *    ```js
 *    app.once('middleware:preprocessors', function() {
 *      app.use(loopback.limit('5.5mb'))
 *    });
 *    ```
 *  - `middleware:handlers` is emitted when it's time to add your custom
 *    request-handling middleware. Note that you should not install any
 *    express routes at this point (express routes are discussed later).
 *
 *    Usage:
 *    ```js
 *    app.once('middleware:handlers', function() {
 *      app.use('/admin', adminExpressApp);
 *      app.use('/custom', function(req, res, next) {
 *        res.send(200, { url: req.url });
 *      });
 *    });
 *    ```
 *  - `middleware:error-loggers` is emitted at the end, before the loopback
 *    error handling middleware is installed. This is the point where you
 *    can install your own middleware to log errors.
 *
 *    Notes:
 *     - The middleware function must take four parameters, otherwise it won't
 *       be called by express.
 *
 *     - It should also call `next(err)` to let the loopback error handler convert
 *       the error to an HTTP error response.
 *
 *    Usage:
 *    ```js
 *    var bunyan = require('bunyan');
 *    var log = bunyan.createLogger({name: "myapp"});
 *    app.once('middleware:error-loggers', function() {
 *      app.use(function(err, req, res, next) {
 *        log.error(err);
 *        next(err);
 *      });
 *    });
 *    ```
 *
 * Express routes should be added after `installMiddleware` was called.
 * This way the express router middleware is injected at the right place in the
 * middleware chain. If you add an express route before calling this function,
 * bad things will happen: Express will automatically add the router
 * middleware and since we haven't added request-preprocessing middleware like
 * cookie & body parser yet, your route handlers will receive raw unprocessed
 * requests.
 *
 * This is the correct order in which to call `app` methods:
 * ```js
 * app.boot(__dirname); // optional
 *
 * app.installMiddleware();
 *
 * // [register your express routes here]
 *
 * app.listen();
 * ```
 */
app.installMiddleware = function() {
  var loopback = require('../');

  /*
   * Request pre-processing
   */
  this.use(loopback.favicon());
  // TODO(bajtos) refactor to app.get('loggerFormat')
  var loggerFormat = this.get('env') === 'development' ? 'dev' : 'default';
  this.use(loopback.logger(loggerFormat));
  this.use(loopback.cookieParser(this.get('cookieSecret')));
  this.use(loopback.token({ model: this.models.accessToken }));
  this.use(loopback.bodyParser());
  this.use(loopback.methodOverride());

  // Allow the app to install custom preprocessing middleware
  this.emit('middleware:preprocessors');

  /*
   * Request handling
   */

  // LoopBack REST transport
  this.use(this.get('restApiRoot') || '/api', loopback.rest());

  // Allow the app to install custom request handling middleware
  this.emit('middleware:handlers');

  // Let express routes handle requests that were not handled
  // by any of the middleware registered above.
  // This way LoopBack REST and API Explorer take precedence over
  // express routes.
  this.use(this.router);

  // The static file server should come after all other routes
  // Every request that goes through the static middleware hits
  // the file system to check if a file exists.
  this.use(loopback.static(path.join(__dirname, 'public')));

  // Requests that get this far won't be handled
  // by any middleware. Convert them into a 404 error
  // that will be handled later down the chain.
  this.use(loopback.urlNotFound());

  /*
   * Error handling
   */

  // Allow the app to install custom error logging middleware
  this.emit('middleware:error-handlers');

  // The ultimate error handler.
  this.use(loopback.errorHandler());
};

/**
 * Listen for connections and update the configured port.
 *
 * When there are no parameters or there is only one callback parameter,
 * the server will listen on `app.get('host')` and `app.get('port')`.
 *
 * ```js
 * // listen on host/port configured in app config
 * app.listen();
 * ```
 *
 * Otherwise all arguments are forwarded to `http.Server.listen`.
 *
 * ```js
 * // listen on the specified port and all hosts, ignore app config
 * app.listen(80);
 * ```
 *
 * The function also installs a `listening` callback that calls
 * `app.set('port')` with the value returned by `server.address().port`.
 * This way the port param contains always the real port number, even when
 * listen was called with port number 0.
 *
 * @param {Function} cb If specified, the callback is added as a listener
 *   for the server's "listening" event.
 * @returns {http.Server} A node `http.Server` with this application configured
 *   as the request handler.
 */
app.listen = function(cb) {
  var self = this;

  var server = require('http').createServer(this);

  server.on('listening', function() {
    self.set('port', this.address().port);
  });

  var useAppConfig =
    arguments.length == 0 ||
      (arguments.length == 1 && typeof arguments[0] == 'function');

  if (useAppConfig) {
    server.listen(this.get('port'), this.get('host'), cb);
  } else {
    server.listen.apply(server, arguments);
  }

  return server;
}
