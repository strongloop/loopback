!function(e){"object"==typeof exports?module.exports=e():"function"==typeof define&&define.amd?define(e):"undefined"!=typeof window?window.loopback=e():"undefined"!=typeof global?global.loopback=e():"undefined"!=typeof self&&(self.loopback=e())}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * loopback ~ public api
 */
 
var loopback = module.exports = require('./lib/loopback');
var datasourceJuggler = require('loopback-datasource-juggler');

/**
 * Connectors
 */

loopback.Connector = require('./lib/connectors/base-connector');
loopback.Memory = require('./lib/connectors/memory');
loopback.Mail = require('./lib/connectors/mail');
if(loopback.isBrowser) {
  loopback.Server = require('./lib/connectors/server');
}

/**
 * Types
 */

loopback.GeoPoint = require('loopback-datasource-juggler/lib/geo').GeoPoint;
loopback.ValidationError = datasourceJuggler.ValidationError;

},{"./lib/connectors/base-connector":5,"./lib/connectors/mail":6,"./lib/connectors/memory":7,"./lib/connectors/server":8,"./lib/loopback":9,"loopback-datasource-juggler":65,"loopback-datasource-juggler/lib/geo":70}],2:[function(require,module,exports){
var process=require("__browserify_process"),__dirname="/lib";/*!
 * Module dependencies.
 */

var DataSource = require('loopback-datasource-juggler').DataSource
  , ModelBuilder = require('loopback-datasource-juggler').ModelBuilder
  , compat = require('./compat')
  , assert = require('assert')
  , fs = require('fs')
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
 * **NOTE:** Calling `app.remotes()` multiple times will only ever return a
 * single set of remote objects.
 * @returns {RemoteObjects}
 */

app.remotes = function () {
  if(this._remotes) {
    return this._remotes;
  } else {
    return (this._remotes = RemoteObjects.create());
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
 * Define and attach a model to the app. The `Model` will be available on the
 * `app.models` object.
 *
 * ```js
 * var Widget = app.model('Widget', {dataSource: 'db'});
 * Widget.create({name: 'pencil'});
 * app.models.Widget.find(function(err, widgets) {
 *   console.log(widgets[0]); // => {name: 'pencil'}
 * });
 * ```
 * 
 * @param {String} modelName The name of the model to define
 * @options {Object} config The model's configuration
 * @property {String} dataSource The `DataSource` to attach the model to
 * @property {Object} [options] an object containing `Model` options
 * @property {Object} [properties] object defining the `Model` properties in [LoopBack Definition Language](http://docs.strongloop.com/loopback-datasource-juggler/#loopback-definition-language)
 * @end
 * @returns {ModelConstructor} the model class
 */

app.model = function (Model, config) {
  if(arguments.length === 1) {
    assert(typeof Model === 'function', 'app.model(Model) => Model must be a function / constructor');
    assert(Model.modelName, 'Model must have a "modelName" property');
    var remotingClassName = compat.getClassNameForRemoting(Model);
    this.remotes().exports[remotingClassName] = Model;
    this.models().push(Model);
    Model.shared = true;
    Model.app = this;
    Model.emit('attached', this);
    return;
  }
  var modelName = Model;
  config = config || {};
  assert(typeof modelName === 'string', 'app.model(name, config) => "name" name must be a string');

  Model =
  this.models[modelName] =
  this.models[classify(modelName)] =
  this.models[camelize(modelName)] = modelFromConfig(modelName, config, this);

  if(config.public !== false) {
    this.model(Model);
  }

  return Model;
}

/**
 * Get the models exported by the app. Only models defined using `app.model()`
 * will show up in this list.
 *
 * There are two ways how to access models.
 *
 * **1. A list of all models**
 *
 * Call `app.models()` to get a list of all models.
 *
 * ```js
 * var models = app.models();
 *
 * models.forEach(function (Model) {
 *  console.log(Model.modelName); // color
 * });
 * ```
 *
 * **2. By model name**
 *
 * `app.model` has properties for all defined models.
 *
 * In the following example the `Product` and `CustomerReceipt` models are
 * accessed using the `models` object.
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
 * @returns {Array} a list of model classes
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
  this.dataSources[camelize(name)] = dataSourcesFromConfig(config);
}

/**
 * Get all remote objects.
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
 * Get the apps set of remote objects.
 */
 
app.remotes = function () {
  return this._remotes || (this._remotes = RemoteObjects.create());
}

/**
 * Enable swagger REST API documentation.
 *
 * > Note: This method is deprecated, use the extension
 * [loopback-explorer](http://npmjs.org/package/loopback-explorer) instead.
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

  remotes.before('**', function(ctx, next, method) {
    var req = ctx.req;
    var Model = method.ctor;
    var modelInstance = ctx.instance;
    var modelId = modelInstance && modelInstance.id || req.param('id');

    if(Model.checkAccess) {
      Model.checkAccess(
        req.accessToken,
        modelId,
        method.name,
        function(err, allowed) {
          if(err) {
            console.log(err);
            next(err);
          } else if(allowed) {
            next();
          } else {
            var e = new Error('Access Denied');
            e.statusCode = 401;
            next(e);
          }
        }
      );
    } else {
      next();
    }
  });
}

/**
 * Initialize an application from an options object or a set of JSON and JavaScript files.
 * 
 * **What happens during an app _boot_?**
 * 
 * 1. **DataSources** are created from an `options.dataSources` object or `datasources.json` in the current directory
 * 2. **Models** are created from an `options.models` object or `models.json` in the current directory
 * 3. Any JavaScript files in the `./models` directory are loaded with `require()`.
 * 4. Any JavaScript files in the `./boot` directory are loaded with `require()`.
 * 
 * **Options**
 * 
 *  - `cwd` - _optional_ - the directory to use when loading JSON and JavaScript files
 *  - `models` - _optional_ - an object containing `Model` definitions
 *  - `dataSources` - _optional_ - an object containing `DataSource` definitions
 *
 *  > **NOTE:** mixing `app.boot()` and `app.model(name, config)` in multiple
 *  > files may result
 *  > in models being **undefined** due to race conditions. To avoid this when
 *  > using `app.boot()`
 *  > make sure all models are passed as part of the `models` definition.
 *
 * <a name="model-definition"></a>
 * **Model Definitions**
 * 
 * The following is an example of an object containing two `Model` definitions: "location" and "inventory".
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
 * 
 * **Model definition properties**
 * 
 *  - `dataSource` - **required** - a string containing the name of the data source definition to attach the `Model` to
 *  - `options` - _optional_ - an object containing `Model` options
 *  - `properties` _optional_ - an object defining the `Model` properties in [LoopBack Definition Language](http://docs.strongloop.com/loopback-datasource-juggler/#loopback-definition-language)
 * 
 * **DataSource definition properties**
 *  
 *  - `connector` - **required** - the name of the [connector](#working-with-data-sources-and-connectors)
 * 
 * @header app.boot([options])
 * @throws {Error} If config is not valid
 * @throws {Error} If boot fails
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

  appConfig.port = 
    process.env.npm_config_port ||
    process.env.OPENSHIFT_SLS_PORT ||
    process.env.OPENSHIFT_NODEJS_PORT ||
    process.env.PORT ||
    appConfig.port ||
    process.env.npm_package_config_port ||
    app.get('port') || 
    3000;

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

  assert(appConfig.restApiRoot !== undefined, 'app.restBasePath is required');
  assert(typeof appConfig.restApiRoot === 'string', 'app.restBasePath must be a string');
  assert(/^\//.test(appConfig.restApiRoot), 'app.restBasePath must start with "/"');
  app.set('restApiRoot', appConfig.restBasePath);

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
    require('./loopback').autoAttach();
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

function dataSourcesFromConfig(config) {
  var connectorPath;

  assert(typeof config === 'object', 
    'cannont create data source without config object');

  if(typeof config.connector === 'string') {
    connectorPath = path.join(__dirname, 'connectors', config.connector+'.js');

    if(fs.existsSync(connectorPath)) {
      config.connector = require(connectorPath);
    }
  }

  return require('./loopback').createDataSource(config);
}

function modelFromConfig(name, config, app) {
  var ModelCtor = require('./loopback').createModel(name, config.properties, config.options);
  var dataSource = app.dataSources[config.dataSource];

  assert(isDataSource(dataSource), name + ' is referencing a dataSource that does not exist: "'+ config.dataSource +'"');

  ModelCtor.attachTo(dataSource);
  return ModelCtor;
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

function isModelCtor(obj) {
  return typeof obj === 'function' && obj.modelName && obj.name === 'ModelCtor';
}

function isDataSource(obj) {
  return obj instanceof DataSource;
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

/**
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
 * @param {Function=} cb If specified, the callback will be added as a listener
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

},{"../":1,"./compat":4,"./loopback":9,"__browserify_process":39,"assert":24,"fs":23,"http":33,"loopback-datasource-juggler":65,"path":43,"strong-remoting":89,"strong-remoting/ext/swagger":88,"underscore.string":97}],3:[function(require,module,exports){
module.exports = browserExpress;

function browserExpress() {
  return {};
}

browserExpress.errorHandler = {};

},{}],4:[function(require,module,exports){
var assert = require('assert');

/**
 * Compatibility layer allowing applications based on an older LoopBack version
 * to work with newer versions with minimum changes involved.
 *
 * You should not use it unless migrating from an older version of LoopBack.
 */

var compat = exports;

/**
 * LoopBack versions pre-1.6 use plural model names when registering shared
 * classes with strong-remoting. As the result, strong-remoting use method names
 * like `Users.create` for the javascript methods like `User.create`.
 * This has been fixed in v1.6, LoopBack consistently uses the singular
 * form now.
 *
 * Turn this option on to enable the old behaviour.
 *
 *   - `app.remotes()` and `app.remoteObjects()` will be indexed using
 *      plural names (Users instead of User).
 *
 *   - Remote hooks must use plural names for the class name, i.e
 *     `Users.create` instead of `User.create`. This is transparently
 *     handled by `Model.beforeRemote()` and `Model.afterRemote()`.
 *
 * @type {boolean}
 * @deprecated Your application should not depend on the way how loopback models
 *   and strong-remoting are wired together. It if does, you should update
 *   it to use singular model names.
 */

compat.usePluralNamesForRemoting = false;

/**
 * Get the class name to use with strong-remoting.
 * @param {function} Ctor Model class (constructor), e.g. `User`
 * @return {string} Singular or plural name, depending on the value
 *   of `compat.usePluralNamesForRemoting`
 * @internal
 */

compat.getClassNameForRemoting = function(Ctor) {
  assert(
    typeof(Ctor) === 'function',
    'compat.getClassNameForRemoting expects a constructor as the argument');

  if (compat.usePluralNamesForRemoting) {
    assert(Ctor.pluralModelName,
      'Model must have a "pluralModelName" property in compat mode');
    return Ctor.pluralModelName;
  }

  return Ctor.modelName;
};

},{"assert":24}],5:[function(require,module,exports){
/**
 * Expose `Connector`.
 */

module.exports = Connector;

/**
 * Module dependencies.
 */
 
var EventEmitter = require('events').EventEmitter
  , debug = require('debug')('connector')
  , util = require('util')
  , inherits = util.inherits
  , assert = require('assert');
  
/**
 * Create a new `Connector` with the given `options`.
 *
 * @param {Object} options
 * @return {Connector}
 */

function Connector(options) {
  EventEmitter.apply(this, arguments);
  this.options = options;
  
  debug('created with options', options);
}

/**
 * Inherit from `EventEmitter`.
 */

inherits(Connector, EventEmitter);

/*!
 * Create an connector instance from a JugglingDB adapter.
 */

Connector._createJDBAdapter = function (jdbModule) {
  var fauxSchema = {};
  jdbModule.initialize(fauxSchema, function () {
    // connected
  });
}

/*!
 * Add default crud operations from a JugglingDB adapter.
 */

Connector.prototype._addCrudOperationsFromJDBAdapter = function (connector) {
  
}
},{"assert":24,"debug":60,"events":32,"util":58}],6:[function(require,module,exports){
var process=require("__browserify_process");/**
 * Dependencies.
 */

var mailer = require('nodemailer')
  , assert = require('assert')
  , debug = require('debug')
  , STUB = 'STUB';

/**
 * Export the MailConnector class.
 */

module.exports = MailConnector;

/**
 * Create an instance of the connector with the given `settings`.
 */

function MailConnector(settings) {
  assert(typeof settings === 'object', 'cannot initiaze MailConnector without a settings object');
  var transports = settings.transports || [];
  this.transportsIndex = {};
  this.transports = [];
  
  transports.forEach(this.setupTransport.bind(this));
}

MailConnector.initialize = function(dataSource, callback) {
  dataSource.connector = new MailConnector(dataSource.settings);
  callback();
}

MailConnector.prototype.DataAccessObject = Mailer;


/**
 * Add a transport to the available transports. See https://github.com/andris9/Nodemailer#setting-up-a-transport-method.
 *
 * Example:
 *
 *   Email.setupTransport({
 *       type: 'SMTP',
 *       host: "smtp.gmail.com", // hostname
 *       secureConnection: true, // use SSL
 *       port: 465, // port for secure SMTP
 *       auth: {
 *           user: "gmail.user@gmail.com",
 *           pass: "userpass"
 *       }
 *   });
 *
 */

MailConnector.prototype.setupTransport = function(setting) {
  var connector = this;
  connector.transports = connector.transports || [];
  connector.transportsIndex = connector.transportsIndex || {};
  var transport = mailer.createTransport(setting.type, setting);
  connector.transportsIndex[setting.type] = transport;
  connector.transports.push(transport);
}

function Mailer() {

}

/**
 * Get a transport by name.
 *
 * @param {String} name
 * @return {Transport} transport
 */

MailConnector.prototype.transportForName = function(name) {
  return this.transportsIndex[name];
}

/**
 * Get the default transport.
 *
 * @return {Transport} transport
 */

MailConnector.prototype.defaultTransport = function() {
  return this.transports[0] || this.stubTransport;
}

/**
 * Send an email with the given `options`.
 *
 * Example Options:
 *
 * {
 *   from: "Fred Foo ✔ <foo@blurdybloop.com>", // sender address
 *   to: "bar@blurdybloop.com, baz@blurdybloop.com", // list of receivers
 *   subject: "Hello ✔", // Subject line
 *   text: "Hello world ✔", // plaintext body
 *   html: "<b>Hello world ✔</b>" // html body
 * }
 *
 * See https://github.com/andris9/Nodemailer for other supported options.
 *
 * @param {Object} options
 * @param {Function} callback Called after the e-mail is sent or the sending failed
 */

Mailer.send = function (options, fn) {
  var dataSource = this.dataSource;
  var settings = dataSource && dataSource.settings;
  var connector = dataSource.connector;
  assert(connector, 'Cannot send mail without a connector!');

  var transport = connector.transportForName(options.transport);

  if(!transport) {
    transport = connector.defaultTransport();
  }

  if(debug.enabled || settings && settings.debug) {
    console.log('Sending Mail:');
    if(options.transport) {
      console.log('\t TRANSPORT:', options.transport);
    }
    console.log('\t TO:', options.to);
    console.log('\t FROM:', options.from);
    console.log('\t SUBJECT:', options.subject);
    console.log('\t TEXT:', options.text);
    console.log('\t HTML:', options.html);
  }

  if(transport) {
    assert(transport.sendMail, 'You must supply an Email.settings.transports containing a valid transport');
    transport.sendMail(options, fn);
  } else {
    console.warn('Warning: No email transport specified for sending email.'
      + ' Setup a transport to send mail messages.');
    process.nextTick(function() {
      fn(null, options);
    });
  }
}

/**
 * Send an email instance using `modelInstance.send()`.
 */

Mailer.prototype.send = function (fn) {
  this.constructor.send(this, fn);
}

/**
 * Access the node mailer object.
 */

MailConnector.mailer =
MailConnector.prototype.mailer =
Mailer.mailer =
Mailer.prototype.mailer = mailer;

},{"__browserify_process":39,"assert":24,"debug":60,"nodemailer":23}],7:[function(require,module,exports){
/**
 * Expose `Memory`.
 */

module.exports = Memory;

/**
 * Module dependencies.
 */
 
var Connector = require('./base-connector')
  , debug = require('debug')('memory')
  , util = require('util')
  , inherits = util.inherits
  , assert = require('assert')
  , JdbMemory = require('loopback-datasource-juggler/lib/connectors/memory');
  
/**
 * Create a new `Memory` connector with the given `options`.
 *
 * @param {Object} options
 * @return {Memory}
 */

function Memory() {
  // TODO implement entire memory connector
}

/**
 * Inherit from `DBConnector`.
 */

inherits(Memory, Connector);

/**
 * JugglingDB Compatibility
 */

Memory.initialize = JdbMemory.initialize;

},{"./base-connector":5,"assert":24,"debug":60,"loopback-datasource-juggler/lib/connectors/memory":67,"util":58}],8:[function(require,module,exports){
var process=require("__browserify_process");/*!
 * Dependencies.
 */

var assert = require('assert')
  , loopback = require('../loopback')
  , debug = require('debug')
  , path = require('path')
  , request = require('browser-request')
  , Connector = require('loopback-datasource-juggler').Connector
  , util = require('util');

/*!
 * Export the ServerConnector class.
 */

module.exports = ServerConnector;

/*!
 * Create an instance of the connector with the given `settings`.
 */

function ServerConnector(settings, dataSource) {
  Connector.call(this, 'server', settings);
  this.settings = settings;
  this.dataSource = dataSource;
  dataSource.DataAccessObject = dataSource.constructor.DataAccessObject;
  settings.base = settings.base || '/';
  dataSource.connect = this.connect;
}
util.inherits(ServerConnector, Connector);

ServerConnector.initialize = function(dataSource, callback) {
  var connector = dataSource.connector = new ServerConnector(dataSource.settings, dataSource);

  var remoteModels = connector.settings.discover;
  if(remoteModels) {
    remoteModels = remoteModels.sort(function(remoteModel) {
      var settings = remoteModel.settings;
      var trackChanges = settings && settings.trackChanges;
      return trackChanges ? 1 : 0;
    });
    remoteModels.forEach(connector.buildModel.bind(connector));
  }
  callback();
}

ServerConnector.prototype.connect = function(callback) {
  process.nextTick(function () {
    callback && callback(null, self.db);
  });
}

ServerConnector.prototype.requestModel = function(model, req, callback) {
  var Model = loopback.getModel(model);
  var modelPath = '/' + Model.pluralModelName;
  var url = path.join(this.settings.base, modelPath, req.url || '');
  this.request(url, req, callback);
}

ServerConnector.prototype.requestModelById = function(model, id, req, callback) {
  var Model = loopback.getModel(model);
  var modelPath = '/' + Model.pluralModelName;
  var url = path.join(this.settings.base, modelPath, id.toString(), req.url || '');
  this.request(url, req, callback);
}

ServerConnector.prototype.request = function(url, req, callback) {
  request({
    url: url,
    method: req.method || 'GET',
    body: req.body,
    json: req.json || true
  }, function(err, res, body) {
    if(res.statusCode >= 400) {
      if(res.statusCode === 404 && req.ignoreNotFound) {
        return callback && callback(null, null);
      }
      err = body.error || body;
      body = undefined;
    }
    callback && callback(err, body);
  });
}

ServerConnector.prototype.buildModel = function(remoteModel) {
  var modelName = remoteModel.modelName;
  var dataSource = this.dataSource;
  var connector = this;

  var Model = loopback.createModel(
    modelName,
    remoteModel.properties || {},
    remoteModel.settings
  );

  Model.attachTo(dataSource);

  return;

  if(!Model.defineMethod) {
    Model.defineMethod = function defineMethod(method) {
      var isStatic = method.fullName.indexOf('.prototype.') === -1;
      var scope = isStatic ? Model : Model.prototype;
      var methodName = isStatic ? method.name : method.name.replace('prototype.', '');

      if(methodName === 'Change') {
        return; // skip
      }

      scope[methodName] = function() {
        console.log(method.name);
        var callback = arguments[arguments.length - 1];
        var ctx = new Context(
          connector.settings.base,
          remoteModel,
          Model,
          method,
          arguments,
          callback
        );
        ctx.invoke();
      };
    }
  }

  remoteModel.methods.forEach(Model.defineMethod.bind(Model));
}

/**
 * Create a new model instance for the given data
 * @param {String} model The model name
 * @param {Object} data The model data
 * @param {Function} [callback] The callback function
 */

ServerConnector.prototype.create = function (model, data, callback) {
  this.requestModel(model, {
    method: 'POST',
    body: data
  }, callback);
};

/**
 * Save the model instance for the given data
 * @param {String} model The model name
 * @param {Object} data The model data
 * @param {Function} [callback] The callback function
 */

ServerConnector.prototype.save = function (model, data, callback) {
  var idValue = this.getIdValue(model, data);
  if(idValue) {
    this.requestModel(model, {
      method: 'PUT',
      body: data
    }, callback);
  } else {
    this.create(model, data, callback);
  }
};

/**
 * Check if a model instance exists by id
 * @param {String} model The model name
 * @param {*} id The id value
 * @param {Function} [callback] The callback function
 */

ServerConnector.prototype.exists = function (model, id, callback) {
  this.requestModel(model, {
    url: '/exists'
  }, callback);
};

/**
 * Find a model instance by id
 * @param {String} model The model name
 * @param {*} id The id value
 * @param {Function} [callback] The callback function
 */

ServerConnector.prototype.find = function find(model, id, callback) {
  this.requestModelById(model, id, {
    ignoreNotFound: true
  }, callback);
};

/**
 * Update if the model instance exists with the same id or create a new instance
 *
 * @param {String} model The model name
 * @param {Object} data The model instance data
 * @param {Function} [callback] The callback function
 */

ServerConnector.prototype.updateOrCreate = function updateOrCreate(model, data, callback) {
  var self = this;
  var idValue = self.getIdValue(model, data);

  if (idValue === null || idValue === undefined) {
    return this.create(data, callback);
  }
  this.find(model, idValue, function (err, inst) {
    if (err) {
      return callback(err);
    }
    if (inst) {
      self.updateAttributes(model, idValue, data, callback);
    } else {
      self.create(model, data, function (err, id) {
        if (err) {
          return callback(err);
        }
        if (id) {
          self.setIdValue(model, data, id);
          callback(null, data);
        } else {
          callback(null, null); // wtf?
        }
      });
    }
  });
};

/**
 * Delete a model instance by id
 * @param {String} model The model name
 * @param {*} id The id value
 * @param [callback] The callback function
 */

ServerConnector.prototype.destroy = function destroy(model, id, callback) {
  this.requestModelById(model, id, {
    method: 'DELETE'
  }, callback);
};

/**
 * Find matching model instances by the filter
 *
 * @param {String} model The model name
 * @param {Object} filter The filter
 * @param {Function} [callback] The callback function
 */

ServerConnector.prototype.all = function all(model, filter, callback) {
  this.requestModel(model, {
    query: {filter: filter}
  }, callback);
};

/**
 * Delete all instances for the given model
 * @param {String} model The model name
 * @param {Object} [where] The filter for where
 * @param {Function} [callback] The callback function
 */

ServerConnector.prototype.destroyAll = function destroyAll(model, where, callback) {
  this.requestModel(model, {
    method: 'DELETE',
    query: {where: where}
  }, callback);
};

/**
 * Count the number of instances for the given model
 *
 * @param {String} model The model name
 * @param {Function} [callback] The callback function
 * @param {Object} filter The filter for where
 *
 */

ServerConnector.prototype.count = function count(model, callback, where) {
  this.requestModel(model, {
    url: '/count',
    query: {where: where}
  }, callback);
};

/**
 * Update properties for the model instance data
 * @param {String} model The model name
 * @param {Object} data The model data
 * @param {Function} [callback] The callback function
 */

ServerConnector.prototype.updateAttributes = function updateAttrs(model, id, data, callback) {
  this.requestModelById(model, id, {
    method: 'PUT',
    url: '/updateAttributes'
  }, callback);
};

function Context(base, meta, model, method, args, callback) {
  this.base = base;
  this.meta = meta;
  this.model = model;
  this.method = method;
  this.args = this.mapArgs(args);
  this.callback = callback;
}

/**
 * Build an http request object from the `context`.
 * @return {Object} request
 */

Context.prototype.toRequest = function() {
  return {
    url: this.url(),
    query: this.query(),
    method: this.verb(),
    body: this.body(),
    headers: this.headers(),
    json: this.isJSON()
  }
}

Context.prototype.isJSON = function() {
  return true;
}

Context.prototype.url = function() {
  var ctx = this;
  var args = this.args;
  var url = path.join(
    this.base,
    this.meta.baseRoute.path,
    this.route().path
  );

  // replace url fragments with url params
  this.method.accepts.forEach(function(param) {
    var argName = param.arg;
    var val = args[argName];
    if(param && param.http && param.http.source === 'path') {
      url = url.replace(':' + argName, val);
    }
  });
  return url;
}

Context.prototype.query = function() {
  var accepts = this.method.accepts;
  var queryParams;
  var ctx = this;

  if(accepts && accepts.length) {
    accepts.forEach(function(param) {
      var http = param.http || {};
      var explicit = http.source === 'query';
      var implicit = http.source !== 'body' && http.source !== 'url';
      
      if(explicit || implicit) {
        queryParams = queryParams || {};
        queryParams[param.arg] = ctx.args[param.arg];
      }
    });
  }

  return queryParams;
}

Context.prototype.route = function() {
  var routes = this.method.routes;

  return routes[0] || {path: '/', verb: 'GET'};
}

Context.prototype.verb = function() {
  return this.route().verb.toUpperCase();
}

Context.prototype.body = function() {
  var accepts = this.method.accepts;
  var body;
  var ctx = this;

  if(accepts && accepts.length) {
    accepts.forEach(function(param) {
      var http = param.http || {};
      var explicit = http.source === 'body';
      
      if(explicit) {
        body = ctx.args[param.arg];
      }
    });
  }

  return body;
}

Context.prototype.headers = function() {
  return {};
}

Context.prototype.mapArgs = function(args) {
  var accepts = this.method.accepts || [];
  var args = Array.prototype.slice.call(args);
  var result = {};
  var supportedSources = ['body', 'form', 'query', 'path'];

  accepts.forEach(function(param) {
    if(param.http && param.http.source) {
      // skip explicit unknown sources
      if(supportedSources.indexOf(param.http.source) === -1) return;
    }

    var val = args.shift();
    var type = typeof val;
    if(Array.isArray(val)) {
      type = 'array';
    }

    // skip all functions
    if(type === 'function') return;

    switch(param.type) {
      case 'any':
      case type:
        result[param.arg] = val;
      break;
      default:
        // skip this param
        args.unshift(val);
      break;
    }
  });

  return result;
}

Context.prototype.handleResponse = function(err, res, body) {
  // TODO handle `returns` correctly
  this.callback.call(this, err, body);
}

Context.prototype.invoke = function() {
  var req = this.toRequest();
  request(req, this.handleResponse.bind(this));
}

},{"../loopback":9,"__browserify_process":39,"assert":24,"browser-request":22,"debug":60,"loopback-datasource-juggler":65,"path":43,"util":58}],9:[function(require,module,exports){
var __dirname="/lib";/*!
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
  , assert = require('assert')
  , i8n = require('inflection');

/**
 * `loopback` is the main entry for LoopBack core module. It provides static
 * methods to create models and data sources. The module itself is a function
 * that creates loopback `app`. For example,
 *
 * ```js
 * var loopback = require('loopback');
 * var app = loopback();
 * ```
 */

var loopback = exports = module.exports = createApplication;

/**
 * Is this a browser environment?
 */

loopback.isBrowser = typeof window !== 'undefined';

/**
 * Is this a server environment?
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

/**
 * Create an loopback application.
 *
 * @return {Function}
 * @api public
 */

function createApplication() {
  var app = express();

  merge(app, proto);

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

if (typeof window === 'undefined') {
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
 * Look up a model class by name from all models created by loopback.createModel()
 * @param {String} modelName The model name
 * @return {Model} The model class
 */
loopback.getModel = function(modelName) {
  return loopback.Model.modelBuilder.models[modelName];
};

/**
 * Look up a model class by the base model class. The method can be used by LoopBack
 * to find configured models in models.json over the base model.
 * @param {Model} The base model class
 * @return {Model} The subclass if found or the base class
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
 * @return {DataSource} The data source instance
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
 * @param {String} type The datasource type
 * @return {DataSource} The data source instance
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

    // Only auto attach if the model doesn't have an explicit data source
    if(ModelCtor && (!(ModelCtor.dataSource instanceof DataSource))) {
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

function merge(a, b){
  if (a && b) {
    for (var key in b) {
      a[key] = b[key];
    }
  }
  return a;
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
loopback.Change = require('./models/change');
loopback.Checkpoint = require('./models/checkpoint');

/*!
 * Automatically attach these models to dataSources
 */

var dataSourceTypes = {
  DB: 'db',
  MAIL: 'mail'
};

loopback.User.autoAttach = dataSourceTypes.DB;
loopback.Role.autoAttach = dataSourceTypes.DB;
loopback.RoleMapping.autoAttach = dataSourceTypes.DB;
loopback.AccessToken.autoAttach = dataSourceTypes.DB;
if(loopback.isServer) loopback.Email.autoAttach = dataSourceTypes.MAIL;
loopback.ACL.autoAttach = dataSourceTypes.DB;
loopback.Scope.autoAttach = dataSourceTypes.DB;
loopback.Application.autoAttach = dataSourceTypes.DB;

},{"../package.json":98,"./application":2,"./compat":4,"./models/access-token":11,"./models/acl":12,"./models/application":13,"./models/change":14,"./models/checkpoint":15,"./models/email":16,"./models/model":17,"./models/role":18,"./models/user":19,"assert":24,"ejs":61,"events":32,"express":3,"fs":23,"inflection":64,"loopback-datasource-juggler":65,"path":43}],10:[function(require,module,exports){
var loopback = require('../loopback');
var AccessToken = require('./access-token');
var debug = require('debug')('loopback:security:access-context');

/**
 * Access context represents the context for a request to access protected
 * resources
 *
 * @class
 * @property {Principal[]} principals An array of principals
 * @property {Function} model The model class
 * @property {String} modelName The model name
 * @property {String} modelId The model id
 * @property {String} property The model property/method/relation name
 * @property {String} method The model method to be invoked
 * @property {String} accessType The access type
 * @property {AccessToken} accessToken The access token
 *
 * @param {Object} context The context object
 * @returns {AccessContext}
 * @constructor
 */
function AccessContext(context) {
  if (!(this instanceof AccessContext)) {
    return new AccessContext(context);
  }
  context = context || {};

  this.principals = context.principals || [];
  var model = context.model;
  model = ('string' === typeof model) ? loopback.getModel(model) : model;
  this.model = model;
  this.modelName = model && model.modelName;

  this.modelId = context.id || context.modelId;
  this.property = context.property || AccessContext.ALL;

  this.method = context.method;

  this.accessType = context.accessType || AccessContext.ALL;
  this.accessToken = context.accessToken || AccessToken.ANONYMOUS;

  var principalType = context.principalType || Principal.USER;
  var principalId = context.principalId || undefined;
  var principalName = context.principalName || undefined;
  if (principalId) {
    this.addPrincipal(principalType, principalId, principalName);
  }

  var token = this.accessToken || {};

  if (token.userId) {
    this.addPrincipal(Principal.USER, token.userId);
  }
  if (token.appId) {
    this.addPrincipal(Principal.APPLICATION, token.appId);
  }
}

// Define constant for the wildcard
AccessContext.ALL = '*';

// Define constants for access types
AccessContext.READ = 'READ'; // Read operation
AccessContext.WRITE = 'WRITE'; // Write operation
AccessContext.EXECUTE = 'EXECUTE'; // Execute operation

AccessContext.DEFAULT = 'DEFAULT'; // Not specified
AccessContext.ALLOW = 'ALLOW'; // Allow
AccessContext.ALARM = 'ALARM'; // Warn - send an alarm
AccessContext.AUDIT = 'AUDIT'; // Audit - record the access
AccessContext.DENY = 'DENY'; // Deny

AccessContext.permissionOrder = {
  DEFAULT: 0,
  ALLOW: 1,
  ALARM: 2,
  AUDIT: 3,
  DENY: 4
};


/**
 * Add a principal to the context
 * @param {String} principalType The principal type
 * @param {*} principalId The principal id
 * @param {String} [principalName] The principal name
 * @returns {boolean}
 */
AccessContext.prototype.addPrincipal = function (principalType, principalId, principalName) {
  var principal = new Principal(principalType, principalId, principalName);
  for (var i = 0; i < this.principals.length; i++) {
    var p = this.principals[i];
    if (p.equals(principal)) {
      return false;
    }
  }
  this.principals.push(principal);

  debug('adding principal %j', principal);
  return true;
};

/**
 * Get the user id
 * @returns {*}
 */
AccessContext.prototype.getUserId = function() {
  for (var i = 0; i < this.principals.length; i++) {
    var p = this.principals[i];
    if (p.type === Principal.USER) {
      return p.id;
    }
  }
  return null;
};


/**
 * Get the application id
 * @returns {*}
 */
AccessContext.prototype.getAppId = function() {
  for (var i = 0; i < this.principals.length; i++) {
    var p = this.principals[i];
    if (p.type === Principal.APPLICATION) {
      return p.id;
    }
  }
  return null;
};

/**
 * Check if the access context has authenticated principals
 * @returns {boolean}
 */
AccessContext.prototype.isAuthenticated = function() {
  return !!(this.getUserId() || this.getAppId());
};

/**
 * Print debug info for access context.
 */

AccessContext.prototype.debug = function() {
  if(debug.enabled) {
    debug('---AccessContext---');
    if(this.principals && this.principals.length) {
      debug('principals:')
      this.principals.forEach(function(principal) {
        debug('principal: %j', principal)
      });
    } else {
      debug('principals: %j', this.principals);
    }
    debug('modelName %s', this.modelName);
    debug('modelId %s', this.modelId);
    debug('property %s', this.property);
    debug('method %s', this.method);
    debug('accessType %s', this.accessType);
    if(this.accessToken) {
      debug('accessToken:')
      debug('  id %j', this.accessToken.id);
      debug('  ttl %j', this.accessToken.ttl);
    }
    debug('getUserId() %s', this.getUserId());
    debug('isAuthenticated() %s', this.isAuthenticated());
  }
}

/**
 * This class represents the abstract notion of a principal, which can be used
 * to represent any entity, such as an individual, a corporation, and a login id
 * @param {String} type The principal type
 * @param {*} id The princiapl id
 * @param {String} [name] The principal name
 * @returns {Principal}
 * @class
 */
function Principal(type, id, name) {
  if (!(this instanceof Principal)) {
    return new Principal(type, id, name);
  }
  this.type = type;
  this.id = id;
  this.name = name;
}

// Define constants for principal types
Principal.USER = 'USER';
Principal.APP = Principal.APPLICATION = 'APP';
Principal.ROLE = 'ROLE';
Principal.SCOPE = 'SCOPE';

/**
 * Compare if two principals are equal
 * @param p The other principal
 * @returns {boolean}
 */
Principal.prototype.equals = function (p) {
  if (p instanceof Principal) {
    return this.type === p.type && String(this.id) === String(p.id);
  }
  return false;
};

/**
 * A request to access protected resources
 * @param {String} model The model name
 * @param {String} property
 * @param {String} accessType The access type
 * @param {String} permission The permission
 * @returns {AccessRequest}
 * @class
 */
function AccessRequest(model, property, accessType, permission) {
  if (!(this instanceof AccessRequest)) {
    return new AccessRequest(model, property, accessType);
  }
  this.model = model || AccessContext.ALL;
  this.property = property || AccessContext.ALL;
  this.accessType = accessType || AccessContext.ALL;
  this.permission = permission || AccessContext.DEFAULT;

  if(debug.enabled) {
    debug('---AccessRequest---');
    debug(' model %s', this.model);
    debug(' property %s', this.property);
    debug(' accessType %s', this.accessType);
    debug(' permission %s', this.permission);
    debug(' isWildcard() %s', this.isWildcard());
  }
}

/**
 * Is the request a wildcard
 * @returns {boolean}
 */
AccessRequest.prototype.isWildcard = function () {
  return this.model === AccessContext.ALL ||
    this.property === AccessContext.ALL ||
    this.accessType === AccessContext.ALL;
};

module.exports.AccessContext = AccessContext;
module.exports.Principal = Principal;
module.exports.AccessRequest = AccessRequest;




},{"../loopback":9,"./access-token":11,"debug":60}],11:[function(require,module,exports){
var process=require("__browserify_process");/*!
 * Module Dependencies.
 */

var Model = require('../loopback').Model
  , loopback = require('../loopback')
  , assert = require('assert')
  , crypto = require('crypto')
  , uid = require('uid2')
  , DEFAULT_TTL = 1209600 // 2 weeks in seconds
  , DEFAULT_TOKEN_LEN = 64
  , Role = require('./role').Role
  , ACL = require('./acl').ACL;

/*!
 * Default AccessToken properties.
 */

var properties = {
  id: {type: String, id: true},
  ttl: {type: Number, ttl: true, default: DEFAULT_TTL}, // time to live in seconds
  created: {type: Date, default: function() {
    return new Date();
  }}
};

/**
 * Token based authentication and access control.
 *
 * @property id {String} Generated token ID
 * @property ttl {Number} Time to live
 * @property created {Date} When the token was created
 * 
 * **Default ACLs**
 * 
 *  - DENY EVERYONE `*`
 *  - ALLOW EVERYONE create
 * 
 * @class
 * @inherits {Model}
 */

var AccessToken = module.exports = Model.extend('AccessToken', properties, {
  acls: [
    {
      principalType: ACL.ROLE,
      principalId: Role.EVERYONE,
      permission: 'DENY'
    },
    {
      principalType: ACL.ROLE,
      principalId: Role.EVERYONE,
      property: 'create',
      permission: 'ALLOW'
    }
  ]
});

/**
 * Anonymous Token
 * 
 * ```js
 * assert(AccessToken.ANONYMOUS.id === '$anonymous');
 * ```
 */

AccessToken.ANONYMOUS = new AccessToken({id: '$anonymous'});

/**
 * Create a cryptographically random access token id.
 * 
 * @callback {Function} callback
 * @param {Error} err
 * @param {String} token
 */

AccessToken.createAccessTokenId = function (fn) {
  uid(this.settings.accessTokenIdLength || DEFAULT_TOKEN_LEN, function(err, guid) {
    if(err) {
      fn(err);
    } else {
      fn(null, guid);
    }
  });
}

/*!
 * Hook to create accessToken id.
 */

AccessToken.beforeCreate = function (next, data) {
  data = data || {};
  
  AccessToken.createAccessTokenId(function (err, id) {
    if(err) {
      next(err);
    } else {
      data.id = id;

      next();
    }
  });
}

/**
 * Find a token for the given `ServerRequest`.
 *
 * @param {ServerRequest} req
 * @param {Object} [options] Options for finding the token
 * @callback {Function} callback
 * @param {Error} err
 * @param {AccessToken} token
 */

AccessToken.findForRequest = function(req, options, cb) {
  var id = tokenIdForRequest(req, options);

  if(id) {
    this.findById(id, function(err, token) {
      if(err) {
        cb(err);
      } else if(token) {
        token.validate(function(err, isValid) {
          if(err) {
            cb(err);
          } else if(isValid) {
            cb(null, token);
          } else {
            cb(new Error('Invalid Access Token'));
          }
        });
      } else {
        cb();
      }
    });
  } else {
    process.nextTick(function() {
      cb();
    });
  }
}

/**
 * Validate the token.
 * 
 * @callback {Function} callback
 * @param {Error} err
 * @param {Boolean} isValid
 */

AccessToken.prototype.validate = function(cb) {
  try {
    assert(
      this.created && typeof this.created.getTime === 'function',
      'token.created must be a valid Date'
    );
    assert(this.ttl !== 0, 'token.ttl must be not be 0');
    assert(this.ttl, 'token.ttl must exist');
    assert(this.ttl >= -1, 'token.ttl must be >= -1');

    var now = Date.now();
    var created = this.created.getTime();
    var elapsedSeconds = (now - created) / 1000;
    var secondsToLive = this.ttl;
    var isValid = elapsedSeconds < secondsToLive;

    if(isValid) {
      cb(null, isValid);
    } else {
      this.destroy(function(err) {
        cb(err, isValid);
      });
    }
  } catch(e) {
    cb(e);
  }
}

function tokenIdForRequest(req, options) {
  var params = options.params || [];
  var headers = options.headers || [];
  var cookies = options.cookies || [];
  var i = 0;
  var length;
  var id;

  params.push('access_token');
  headers.push('X-Access-Token');
  headers.push('authorization');
  cookies.push('access_token');
  cookies.push('authorization');

  for(length = params.length; i < length; i++) {
    id = req.param(params[i]);

    if(typeof id === 'string') {
      return id;
    }
  }

  for(i = 0, length = headers.length; i < length; i++) {
    id = req.header(headers[i]);

    if(typeof id === 'string') {
      return id;
    }
  }

  if(req.signedCookies) {
    for(i = 0, length = headers.length; i < length; i++) {
      id = req.signedCookies[cookies[i]];

      if(typeof id === 'string') {
        return id;
      }
    }
  }
  return null;
}

},{"../loopback":9,"./acl":12,"./role":18,"__browserify_process":39,"assert":24,"crypto":27,"uid2":96}],12:[function(require,module,exports){
var process=require("__browserify_process");/*!
 Schema ACL options

 Object level permissions, for example, an album owned by a user

 Factors to be authorized against:

 * model name: Album
 * model instance properties: userId of the album, friends, shared
 * methods
 * app and/or user ids/roles
 ** loggedIn
 ** roles
 ** userId
 ** appId
 ** none
 ** everyone
 ** relations: owner/friend/granted

 Class level permissions, for example, Album
 * model name: Album
 * methods

 URL/Route level permissions
 * url pattern
 * application id
 * ip addresses
 * http headers

 Map to oAuth 2.0 scopes

 */

var loopback = require('../loopback');
var async = require('async');
var assert = require('assert');
var debug = require('debug')('loopback:security:acl');

var ctx = require('./access-context');
var AccessContext = ctx.AccessContext;
var Principal = ctx.Principal;
var AccessRequest = ctx.AccessRequest;

var role = require('./role');
var Role = role.Role;

/**
 * System grants permissions to principals (users/applications, can be grouped
 * into roles).
 *
 * Protected resource: the model data and operations
 * (model/property/method/relation/…)
 *
 * For a given principal, such as client application and/or user, is it allowed
 * to access (read/write/execute)
 * the protected resource?
 */
var ACLSchema = {
  model: String, // The name of the model
  property: String, // The name of the property, method, scope, or relation

  /**
   * Name of the access type - READ/WRITE/EXEC
   */
  accessType: String,

  /**
   * ALARM - Generate an alarm, in a system dependent way, the access specified
   * in the permissions component of the ACL entry.
   * ALLOW - Explicitly grants access to the resource.
   * AUDIT - Log, in a system dependent way, the access specified in the
   * permissions component of the ACL entry.
   * DENY - Explicitly denies access to the resource.
   */
  permission: String,
  /**
   * Type of the principal - Application/User/Role
   */
  principalType: String,
  /**
   * Id of the principal - such as appId, userId or roleId
   */
  principalId: String
};

/**
 * A Model for access control meta data.
 *
 * @header ACL
 * @class
 * @inherits Model
 */

var ACL = loopback.createModel('ACL', ACLSchema);

ACL.ALL = AccessContext.ALL;

ACL.DEFAULT = AccessContext.DEFAULT; // Not specified
ACL.ALLOW = AccessContext.ALLOW; // Allow
ACL.ALARM = AccessContext.ALARM; // Warn - send an alarm
ACL.AUDIT = AccessContext.AUDIT; // Audit - record the access
ACL.DENY = AccessContext.DENY; // Deny

ACL.READ = AccessContext.READ; // Read operation
ACL.WRITE = AccessContext.WRITE; // Write operation
ACL.EXECUTE = AccessContext.EXECUTE; // Execute operation

ACL.USER = Principal.USER;
ACL.APP = ACL.APPLICATION = Principal.APPLICATION;
ACL.ROLE = Principal.ROLE;
ACL.SCOPE = Principal.SCOPE;

/**
 * Calculate the matching score for the given rule and request
 * @param {ACL} rule The ACL entry
 * @param {AccessRequest} req The request
 * @returns {number}
 */
ACL.getMatchingScore = function getMatchingScore(rule, req) {
  var props = ['model', 'property', 'accessType'];
  var score = 0;
  for (var i = 0; i < props.length; i++) {
    // Shift the score by 4 for each of the properties as the weight
    score = score * 4;
    var val1 = rule[props[i]] || ACL.ALL;
    var val2 = req[props[i]] || ACL.ALL;
    if (val1 === val2) {
      // Exact match
      score += 3;
    } else if (val1 === ACL.ALL) {
      // Wildcard match
      score += 2;
    } else if (val2 === ACL.ALL) {
      // Doesn't match at all
      score += 1;
    } else {
      return -1;
    }
  }
  score = score * 4;
  score += AccessContext.permissionOrder[rule.permission || ACL.ALLOW] - 1;
  return score;
};

/*!
 * Resolve permission from the ACLs
 * @param {Object[]) acls The list of ACLs
 * @param {Object} req The request
 * @returns {AccessRequest} result The effective ACL
 */
ACL.resolvePermission = function resolvePermission(acls, req) {
  // Sort by the matching score in descending order
  acls = acls.sort(function (rule1, rule2) {
    return ACL.getMatchingScore(rule2, req) - ACL.getMatchingScore(rule1, req);
  });
  var permission = ACL.DEFAULT;
  var score = 0;
  for (var i = 0; i < acls.length; i++) {
    score = ACL.getMatchingScore(acls[i], req);
    if (score < 0) {
      break;
    }
    if (!req.isWildcard()) {
      // We should stop from the first match for non-wildcard
      permission = acls[i].permission;
      break;
    } else {
      if(acls[i].model === req.model &&
        acls[i].property === req.property &&
        acls[i].accessType === req.accessType
        ) {
        // We should stop at the exact match
        permission = acls[i].permission;
        break;
      }
      // For wildcard match, find the strongest permission
      if(AccessContext.permissionOrder[acls[i].permission]
        > AccessContext.permissionOrder[permission]) {
        permission = acls[i].permission;
      }
    }
  }

  var res = new AccessRequest(req.model, req.property, req.accessType,
    permission || ACL.DEFAULT);
  return res;
};

/*!
 * Get the static ACLs from the model definition
 * @param {String} model The model name
 * @param {String} property The property/method/relation name
 *
 * @return {Object[]} An array of ACLs
 */
ACL.getStaticACLs = function getStaticACLs(model, property) {
  var modelClass = loopback.getModel(model);
  var staticACLs = [];
  if (modelClass && modelClass.settings.acls) {
    modelClass.settings.acls.forEach(function (acl) {
      staticACLs.push(new ACL({
        model: model,
        property: acl.property || ACL.ALL,
        principalType: acl.principalType,
        principalId: acl.principalId, // TODO: Should it be a name?
        accessType: acl.accessType,
        permission: acl.permission
      }));

      staticACLs[staticACLs.length - 1].debug('Adding ACL');
    });
  }
  var prop = modelClass &&
    (modelClass.definition.properties[property] // regular property
      || (modelClass._scopeMeta && modelClass._scopeMeta[property]) // relation/scope
      || modelClass[property] // static method
      || modelClass.prototype[property]); // prototype method
  if (prop && prop.acls) {
    prop.acls.forEach(function (acl) {
      staticACLs.push(new ACL({
        model: modelClass.modelName,
        property: property,
        principalType: acl.principalType,
        principalId: acl.principalId,
        accessType: acl.accessType,
        permission: acl.permission
      }));
    });
  }
  return staticACLs;
};

/**
 * Check if the given principal is allowed to access the model/property
 * @param {String} principalType The principal type
 * @param {String} principalId The principal id
 * @param {String} model The model name
 * @param {String} property The property/method/relation name
 * @param {String} accessType The access type
 * @param {Function} callback The callback function
 *
 * @callback callback
 * @param {String|Error} err The error object
 * @param {AccessRequest} result The access permission
 */
ACL.checkPermission = function checkPermission(principalType, principalId,
                                               model, property, accessType,
                                               callback) {
  property = property || ACL.ALL;
  var propertyQuery = (property === ACL.ALL) ? undefined : {inq: [property, ACL.ALL]};
  accessType = accessType || ACL.ALL;
  var accessTypeQuery = (accessType === ACL.ALL) ? undefined : {inq: [accessType, ACL.ALL]};

  var req = new AccessRequest(model, property, accessType);

  var acls = this.getStaticACLs(model, property);

  var resolved = this.resolvePermission(acls, req);

  if(resolved && resolved.permission === ACL.DENY) {
    debug('Permission denied by statically resolved permission');
    debug(' Resolved Permission: %j', resolved);
    process.nextTick(function() {
      callback && callback(null, resolved);
    });
    return;
  }

  var self = this;
  this.find({where: {principalType: principalType, principalId: principalId,
      model: model, property: propertyQuery, accessType: accessTypeQuery}},
    function (err, dynACLs) {
      if (err) {
        callback && callback(err);
        return;
      }
      acls = acls.concat(dynACLs);
      resolved = self.resolvePermission(acls, req);
      if(resolved && resolved.permission === ACL.DEFAULT) {
        var modelClass = loopback.getModel(model);
        resolved.permission = (modelClass && modelClass.settings.defaultPermission) || ACL.ALLOW;
      }
      callback && callback(null, resolved);
    });
};

ACL.prototype.debug = function() {
  if(debug.enabled) {
    debug('---ACL---');
    debug('model %s', this.model);
    debug('property %s', this.property);
    debug('principalType %s', this.principalType);
    debug('principalId %s', this.principalId);
    debug('accessType %s', this.accessType);
    debug('permission %s', this.permission);
  }
}

/**
 * Check if the request has the permission to access
 * @param {Object} context
 * @property {Object[]} principals An array of principals
 * @property {String|Model} model The model name or model class
 * @property {*} id The model instance id
 * @property {String} property The property/method/relation name
 * @property {String} accessType The access type
 * @param {Function} callback
 */
ACL.checkAccess = function (context, callback) {
  if(!(context instanceof AccessContext)) {
    context = new AccessContext(context);
  }

  var model = context.model;
  var property = context.property;
  var accessType = context.accessType;

  var propertyQuery = (property === ACL.ALL) ? undefined : {inq: [property, ACL.ALL]};
  var accessTypeQuery = (accessType === ACL.ALL) ? undefined : {inq: [accessType, ACL.ALL]};

  var req = new AccessRequest(model.modelName, property, accessType);

  var effectiveACLs = [];
  var staticACLs = this.getStaticACLs(model.modelName, property);

  var self = this;
  var roleModel = loopback.getModelByType(Role);
  this.find({where: {model: model.modelName, property: propertyQuery,
    accessType: accessTypeQuery}}, function (err, acls) {
    if (err) {
      callback && callback(err);
      return;
    }
    var inRoleTasks = [];

    acls = acls.concat(staticACLs);

    acls.forEach(function (acl) {
      // Check exact matches
      for (var i = 0; i < context.principals.length; i++) {
        var p = context.principals[i];
        if (p.type === acl.principalType
          && String(p.id) === String(acl.principalId)) {
          effectiveACLs.push(acl);
          return;
        }
      }

      // Check role matches
      if (acl.principalType === ACL.ROLE) {
        inRoleTasks.push(function (done) {
          roleModel.isInRole(acl.principalId, context,
            function (err, inRole) {
              if (!err && inRole) {
                effectiveACLs.push(acl);
              }
              done(err, acl);
            });
        });
      }
    });

    async.parallel(inRoleTasks, function (err, results) {
      if(err) {
        callback && callback(err, null);
        return;
      }
      var resolved = self.resolvePermission(effectiveACLs, req);
      if(resolved && resolved.permission === ACL.DEFAULT) {
        resolved.permission = (model && model.settings.defaultPermission) || ACL.ALLOW;
      }
      debug('checkAccess() returns: %j', resolved);
      callback && callback(null, resolved);
    });
  });
};


/**
 * Check if the given access token can invoke the method
 * @param {AccessToken} token The access token
 * @param {String} model The model name
 * @param {*} modelId The model id
 * @param {String} method The method name
 * @end
 * @callback {Function} callback
 * @param {String|Error} err The error object
 * @param {Boolean} allowed is the request allowed
 */
ACL.checkAccessForToken = function (token, model, modelId, method, callback) {
  assert(token, 'Access token is required');

  var context = new AccessContext({
    accessToken: token,
    model: model,
    property: method,
    method: method,
    modelId: modelId
  });

  context.accessType = context.model._getAccessTypeForMethod(method);

  context.debug();

  this.checkAccess(context, function (err, access) {
    if (err) {
      callback && callback(err);
      return;
    }
    callback && callback(null, access.permission !== ACL.DENY);
  });
};

/*!
 * Schema for Scope which represents the permissions that are granted to client
 * applications by the resource owner
 */
var ScopeSchema = {
  name: {type: String, required: true},
  description: String
};

/**
 * Resource owner grants/delegates permissions to client applications
 *
 * For a protected resource, does the client application have the authorization
 * from the resource owner (user or system)?
 *
 * Scope has many resource access entries
 * @class
 */
var Scope = loopback.createModel('Scope', ScopeSchema);


/**
 * Check if the given scope is allowed to access the model/property
 * @param {String} scope The scope name
 * @param {String} model The model name
 * @param {String} property The property/method/relation name
 * @param {String} accessType The access type
 * @callback {Function} callback
 * @param {String|Error} err The error object
 * @param {AccessRequest} result The access permission
 */
Scope.checkPermission = function (scope, model, property, accessType, callback) {
  this.findOne({where: {name: scope}}, function (err, scope) {
    if (err) {
      callback && callback(err);
    } else {
      var aclModel = loopback.getModelByType(ACL);
      aclModel.checkPermission(ACL.SCOPE, scope.id, model, property, accessType, callback);
    }
  });
};

module.exports.ACL = ACL;
module.exports.Scope = Scope;

},{"../loopback":9,"./access-context":10,"./role":18,"__browserify_process":39,"assert":24,"async":20,"debug":60}],13:[function(require,module,exports){
var loopback = require('../loopback');
var assert = require('assert');

// Authentication schemes
var AuthenticationSchemeSchema = {
  scheme: String, // local, facebook, google, twitter, linkedin, github
  credential: Object // Scheme-specific credentials
};

// See https://github.com/argon/node-apn/blob/master/doc/apn.markdown
var APNSSettingSchema = {
  /**
   * production or development mode. It denotes what default APNS servers to be
   * used to send notifications
   * - true (production mode)
   *   - push: gateway.push.apple.com:2195
   *   - feedback: feedback.push.apple.com:2196
   * - false (development mode, the default)
   *   - push: gateway.sandbox.push.apple.com:2195
   *   - feedback: feedback.sandbox.push.apple.com:2196
   */
  production: Boolean,
  certData: String, // The certificate data loaded from the cert.pem file
  keyData: String, // The key data loaded from the key.pem file

  pushOptions: {type: {
    gateway: String,
    port: Number
  }},

  feedbackOptions: {type: {
    gateway: String,
    port: Number,
    batchFeedback: Boolean,
    interval: Number
  }}
};

var GcmSettingsSchema = {
  serverApiKey: String
};

// Push notification settings
var PushNotificationSettingSchema = {
  apns: APNSSettingSchema,
  gcm: GcmSettingsSchema
};

/**
 * Data model for Application
 */
var ApplicationSchema = {
  id: {type: String, id: true, generated: true},
  // Basic information
  name: {type: String, required: true}, // The name
  description: String, // The description
  icon: String, // The icon image url

  owner: String, // The user id of the developer who registers the application
  collaborators: [String], // A list of users ids who have permissions to work on this app

  // EMail
  email: String, // e-mail address
  emailVerified: Boolean, // Is the e-mail verified

  // oAuth 2.0 settings
  url: String, // The application url
  callbackUrls: [String], // oAuth 2.0 code/token callback url
  permissions: [String], // A list of permissions required by the application

  // Keys
  clientKey: String,
  javaScriptKey: String,
  restApiKey: String,
  windowsKey: String,
  masterKey: String,

  // Push notification
  pushSettings: PushNotificationSettingSchema,

  // User Authentication
  authenticationEnabled: {type: Boolean, default: true},
  anonymousAllowed: {type: Boolean, default: true},
  authenticationSchemes: [AuthenticationSchemeSchema],

  status: {type: String, default: 'sandbox'}, // Status of the application, production/sandbox/disabled

  // Timestamps
  created: {type: Date, default: Date},
  modified: {type: Date, default: Date}
};

/**
 * Application management functions
 */

var crypto = require('crypto');

function generateKey(hmacKey, algorithm, encoding) {
  hmacKey = hmacKey || 'loopback';
  algorithm = algorithm || 'sha256';
  encoding = encoding || 'base64';
  var hmac = crypto.createHmac(algorithm, hmacKey);
  var buf = crypto.randomBytes(64);
  hmac.update(buf);
  return hmac.digest('base64');
}

/**
 * Manage client applications and organize their users.
 * @class
 * @inherits {Model}
 */

var Application = loopback.createModel('Application', ApplicationSchema);

/*!
 * A hook to generate keys before creation
 * @param next
 */
Application.beforeCreate = function (next) {
  var app = this;
  app.created = app.modified = new Date();
  app.id = generateKey('id', 'sha1');
  app.clientKey = generateKey('client');
  app.javaScriptKey = generateKey('javaScript');
  app.restApiKey = generateKey('restApi');
  app.windowsKey = generateKey('windows');
  app.masterKey = generateKey('master');
  next();
};

/**
 * Register a new application
 * @param owner Owner's user id
 * @param name Name of the application
 * @param options Other options
 * @param cb Callback function
 */
Application.register = function (owner, name, options, cb) {
  assert(owner, 'owner is required');
  assert(name, 'name is required');

  if (typeof options === 'function' && !cb) {
    cb = options;
    options = {};
  }
  var props = {owner: owner, name: name};
  for (var p in options) {
    if (!(p in props)) {
      props[p] = options[p];
    }
  }
  this.create(props, cb);
};

/**
 * Reset keys for the application instance
 * @callback {Function} callback
 * @param {Error} err
 */
Application.prototype.resetKeys = function (cb) {
  this.clientKey = generateKey('client');
  this.javaScriptKey = generateKey('javaScript');
  this.restApiKey = generateKey('restApi');
  this.windowsKey = generateKey('windows');
  this.masterKey = generateKey('master');
  this.modified = new Date();
  this.save(cb);
};

/**
 * Reset keys for a given application by the appId
 * @param {Any} appId
 * @callback {Function} callback
 * @param {Error} err
 */
Application.resetKeys = function (appId, cb) {
  this.findById(appId, function (err, app) {
    if (err) {
      cb && cb(err, app);
      return;
    }
    app.resetKeys(cb);
  });
};

/**
 * Authenticate the application id and key.
 * 
 * `matched` will be one of
 * 
 * - clientKey
 * - javaScriptKey
 * - restApiKey
 * - windowsKey 
 * - masterKey
 *
 * @param {Any} appId
 * @param {String} key
 * @callback {Function} callback
 * @param {Error} err
 * @param {String} matched - The matching key
 */
Application.authenticate = function (appId, key, cb) {
  this.findById(appId, function (err, app) {
    if (err || !app) {
      cb && cb(err, null);
      return;
    }
    var matched = null;
    ['clientKey', 'javaScriptKey', 'restApiKey', 'windowsKey', 'masterKey'].forEach(function (k) {
      if (app[k] === key) {
        matched = k;
      }
    });
    cb && cb(null, matched);
  });
};

module.exports = Application;


},{"../loopback":9,"assert":24,"crypto":27}],14:[function(require,module,exports){
/**
 * Module Dependencies.
 */

var Model = require('../loopback').Model
  , loopback = require('../loopback')
  , crypto = require('crypto')
  , CJSON = {stringify: require('canonical-json')}
  , async = require('async')
  , assert = require('assert');

/**
 * Properties
 */

var properties = {
  id: {type: String, id: true},
  rev: {type: String},
  prev: {type: String},
  checkpoint: {type: Number},
  modelName: {type: String},
  modelId: {type: String}
};

/**
 * Options
 */

var options = {
  trackChanges: false,
  strict: true
};

/**
 * Change list entry.
 *
 * @property id {String} Hash of the modelName and id
 * @property rev {String} the current model revision
 * @property prev {String} the previous model revision
 * @property checkpoint {Number} the current checkpoint at time of the change
 * @property modelName {String}  the model name
 * @property modelId {String} the model id
 * 
 * @class
 * @inherits {Model}
 */

var Change = module.exports = Model.extend('Change', properties, options);

/*!
 * Constants 
 */

Change.UPDATE = 'update';
Change.CREATE = 'create';
Change.DELETE = 'delete';
Change.UNKNOWN = 'unknown';

/*!
 * Conflict Class
 */

Change.Conflict = Conflict;

/*!
 * Setup the extended model.
 */

Change.setup = function() {
  var Change = this;

  Change.getter.id = function() {
    var hasModel = this.modelName && this.modelId;
    if(!hasModel) return null;

    return Change.idForModel(this.modelName, this.modelId);
  }
}
Change.setup();


/**
 * Track the recent change of the given modelIds.
 * 
 * @param  {String}   modelName
 * @param  {Array}    modelIds
 * @callback {Function} callback
 * @param {Error} err
 * @param {Array} changes Changes that were tracked
 */

Change.track = function(modelName, modelIds, callback) {
  var tasks = [];
  var Change = this;

  modelIds.forEach(function(id) {
    tasks.push(function(cb) {
      Change.findOrCreate(modelName, id, function(err, change) {
        if(err) return Change.handleError(err, cb);
        change.rectify(cb);
      });
    });
  });
  async.parallel(tasks, callback);
}

/**
 * Get an identifier for a given model.
 * 
 * @param  {String} modelName
 * @param  {String} modelId 
 * @return {String}
 */

Change.idForModel = function(modelName, modelId) {
  return this.hash([modelName, modelId].join('-'));
}

/**
 * Find or create a change for the given model.
 *
 * @param  {String}   modelName 
 * @param  {String}   modelId   
 * @callback  {Function} callback
 * @param {Error} err
 * @param {Change} change
 * @end
 */

Change.findOrCreate = function(modelName, modelId, callback) {
  var id = this.idForModel(modelName, modelId);
  var Change = this;

  console.log(modelId);
  
  if(!modelId) debugger;

  this.findById(id, function(err, change) {
    if(err) return callback(err);
    if(change) {
      callback(null, change);
    } else {
      var ch = new Change({
        id: id,
        modelName: modelName,
        modelId: modelId
      });
      ch.save(callback);
    }
  });
}

/**
 * Update (or create) the change with the current revision.
 * 
 * @callback {Function} callback
 * @param {Error} err
 * @param {Change} change
 */

Change.prototype.rectify = function(cb) {
  var change = this;
  var tasks = [
    updateRevision,
    updateCheckpoint
  ];

  if(this.rev) this.prev = this.rev;

  async.parallel(tasks, function(err) {
    if(err) return cb(err);
    change.save(cb);
  });

  function updateRevision(cb) {
    // get the current revision
    change.currentRevision(function(err, rev) {
      if(err) return Change.handleError(err, cb);
      change.rev = rev;
      cb();
    });
  }

  function updateCheckpoint(cb) {
    change.constructor.getCheckpointModel().current(function(err, checkpoint) {
      if(err) return Change.handleError(err);
      change.checkpoint = ++checkpoint;
      cb();
    });
  }
}

/**
 * Get a change's current revision based on current data.
 * @callback  {Function} callback
 * @param {Error} err
 * @param {String} rev The current revision
 */

Change.prototype.currentRevision = function(cb) {
  var model = this.getModelCtor();
  model.findById(this.modelId, function(err, inst) {
    if(err) return Change.handleError(err, cb);
    if(inst) {
      cb(null, Change.revisionForInst(inst));
    } else {
      cb(null, null);
    }
  });
}

/**
 * Create a hash of the given `string` with the `options.hashAlgorithm`.
 * **Default: `sha1`**
 * 
 * @param  {String} str The string to be hashed
 * @return {String}     The hashed string
 */

Change.hash = function(str) {
  return crypto
    .createHash(Change.settings.hashAlgorithm || 'sha1')
    .update(str)
    .digest('hex');
}

/**
 * Get the revision string for the given object
 * @param  {Object} inst The data to get the revision string for
 * @return {String}      The revision string
 */

Change.revisionForInst = function(inst) {
  return this.hash(CJSON.stringify(inst));
}

/**
 * Get a change's type. Returns one of:
 *
 * - `Change.UPDATE`
 * - `Change.CREATE`
 * - `Change.DELETE`
 * - `Change.UNKNOWN`
 * 
 * @return {String} the type of change
 */

Change.prototype.type = function() {
  if(this.rev && this.prev) {
    return Change.UPDATE;
  }
  if(this.rev && !this.prev) {
    return Change.CREATE;
  }
  if(!this.rev && this.prev) {
    return Change.DELETE;
  }
  return Change.UNKNOWN;
}

/**
 * Get the `Model` class for `change.modelName`.
 * @return {Model}
 */

Change.prototype.getModelCtor = function() {
  // todo - not sure if this works with multiple data sources
  return loopback.getModel(this.modelName);
}

/**
 * Compare two changes.
 * @param  {Change} change
 * @return {Boolean}
 */

Change.prototype.equals = function(change) {
  return change.rev === this.rev;
}

/**
 * Determine if the change is based on the given change.
 * @param  {Change} change
 * @return {Boolean}
 */

Change.prototype.isBasedOn = function(change) {
  return this.prev === change.rev;
}

/**
 * Determine the differences for a given model since a given checkpoint.
 *
 * The callback will contain an error or `result`.
 * 
 * **result**
 *
 * ```js
 * {
 *   deltas: Array,
 *   conflicts: Array
 * }
 * ```
 *
 * **deltas**
 *
 * An array of changes that differ from `remoteChanges`.
 * 
 * **conflicts**
 *
 * An array of changes that conflict with `remoteChanges`.
 * 
 * @param  {String}   modelName
 * @param  {Number}   since         Compare changes after this checkpoint
 * @param  {Change[]} remoteChanges A set of changes to compare
 * @callback  {Function} callback
 * @param {Error} err
 * @param {Object} result See above.
 */

Change.diff = function(modelName, since, remoteChanges, callback) {
  var remoteChangeIndex = {};
  var modelIds = [];
  var Change = this;
  remoteChanges.map(function(ch) {
    ch = new Change(ch);
    modelIds.push(ch.modelId);
    remoteChangeIndex[ch.modelId] = ch;
    return ch;
  });

  // normalize `since`
  since = Number(since) || 0;
  this.find({
    where: {
      modelName: modelName,
      modelId: {inq: modelIds},
      checkpoint: {gt: since}
    }
  }, function(err, localChanges) {
    if(err) return callback(err);
    var deltas = [];
    var conflicts = [];
    var localModelIds = [];

    localChanges.forEach(function(localChange) {
      localChange = new Change(localChange);
      localModelIds.push(localChange.modelId);
      var remoteChange = remoteChangeIndex[localChange.modelId];

      if(!remoteChange) return;
      if(!localChange.equals(remoteChange)) {
        if(remoteChange.isBasedOn(localChange)) {
          deltas.push(remoteChange);
        } else {
          conflicts.push(localChange);
        }
      }
    });

    modelIds.forEach(function(id) {
      if(localModelIds.indexOf(id) === -1) {
        deltas.push(remoteChangeIndex[id]);
      }
    });

    callback(null, {
      deltas: deltas,
      conflicts: conflicts
    });
  });
}

/**
 * Correct all change list entries.
 * @param  {Function} callback
 */

Change.rectifyAll = function(cb) {
  // this should be optimized
  this.find(function(err, changes) {
    if(err) return cb(err);
    changes.forEach(function(change) {
      change.rectify();
    });
  });
}

/**
 * Get the checkpoint model.
 * @return {Checkpoint}
 */

Change.getCheckpointModel = function() {
  var checkpointModel = this.Checkpoint;
  if(checkpointModel) return checkpointModel;
  this.checkpoint = checkpointModel = require('./checkpoint').extend('checkpoint');
  checkpointModel.attachTo(this.dataSource);
  return checkpointModel;
}

/**
 * Get the model instance.
 * @callback  {Function} callback
 * @param {Error} err
 * @param {Model} model The Model instance
 */

Change.prototype.getModelInst = function(callback) {
  var Model = this.getModelCtor();
  assert(Model, 'unkown model + ', this.modelName);
  Model.findById(this.modelId, callback);
}

/**
 * When two changes conflict a conflict is created.
 *
 * **Note: call `conflict.fetch()` to get the `target` and `source` models.
 * 
 * @param {Change} sourceChange The change object for the source model
 * @param {Change} targetChange The conflicting model's change object
 * @property {Model} source The source model instance
 * @property {Model} target The target model instance
 */

function Conflict(sourceChange, targetChange) {
  this.sourceChange = sourceChange;
  this.targetChange = targetChange;
}

Conflict.prototype.fetch = function(cb) {
  var conflict = this;
  var tasks = [
    getSourceModel,
    getTargetModel
  ];

  async.parallel(tasks, cb);

  function getSourceModel(cb) {
    conflict.sourceChange.getModelInst(function(err, model) {
      if(err) return cb(err);
      conflict.source = model;
      cb();
    });
  }

  function getTargetModel(cb) {
    conflict.targetChange.getModelInst(function(err, model) {
      if(err) return cb(err);
      conflict.target = model;
      cb();
    });
  }
}

Conflict.prototype.resolve = function(cb) {
  this.sourceChange.prev = this.targetChange.rev;
  this.sourceChange.save(cb);
}

},{"../loopback":9,"./checkpoint":15,"assert":24,"async":20,"canonical-json":59,"crypto":27}],15:[function(require,module,exports){
/**
 * Module Dependencies.
 */

var Model = require('../loopback').Model
  , loopback = require('../loopback')
  , assert = require('assert');

/**
 * Properties
 */

var properties = {
  id: {type: Number, generated: true, id: true},
  time: {type: Number, generated: true, default: Date.now},
  sourceId: {type: String}
};

/**
 * Options
 */

var options = {

};

/**
 * Checkpoint list entry.
 *
 * @property id {Number} the sequencial identifier of a checkpoint
 * @property time {Number} the time when the checkpoint was created
 * @property sourceId {String}  the source identifier
 * 
 * @class
 * @inherits {Model}
 */

var Checkpoint = module.exports = Model.extend('Checkpoint', properties, options);

/**
 * Get the current checkpoint id
 * @callback {Function} callback
 * @param {Error} err
 * @param {Number} checkpointId The current checkpoint id
 */

Checkpoint.current = function(cb) {
  this.find({
    limit: 1,
    sort: 'id DESC'
  }, function(err, checkpoints) {
    if(err) return cb(err);
    var checkpoint = checkpoints[0] || {id: 0};
    cb(null, checkpoint.id);
  });
}


},{"../loopback":9,"assert":24}],16:[function(require,module,exports){
/*!
 * Module Dependencies.
 */

var Model = require('../loopback').Model
  , loopback = require('../loopback');

var properties = {
  to: {type: String, required: true},
  from: {type: String, required: true},
  subject: {type: String, required: true},
  text: {type: String},
  html: {type: String}
};

/**
 * The Email Model.
 * 
 * **Properties**
 * 
 * - `to` - **{ String }** **required**
 * - `from` - **{ String }** **required**
 * - `subject` - **{ String }** **required**
 * - `text` - **{ String }** 
 * - `html` - **{ String }** 
 *
 * @class
 * @inherits {Model}
 */

var Email = module.exports = Model.extend('Email', properties);

/**
 * Send an email with the given `options`.
 *
 * Example Options:
 *
 * ```json
 * {
 *   from: "Fred Foo ✔ <foo@blurdybloop.com>", // sender address
 *   to: "bar@blurdybloop.com, baz@blurdybloop.com", // list of receivers
 *   subject: "Hello ✔", // Subject line
 *   text: "Hello world ✔", // plaintext body
 *   html: "<b>Hello world ✔</b>" // html body
 * }
 * ```
 *
 * See https://github.com/andris9/Nodemailer for other supported options.
 *
 * @param {Object} options
 * @param {Function} callback Called after the e-mail is sent or the sending failed
 */

Email.prototype.send = function() {
  throw new Error('You must connect the Email Model to a Mail connector');
}
},{"../loopback":9}],17:[function(require,module,exports){
/*!
 * Module Dependencies.
 */
var loopback = require('../loopback');
var compat = require('../compat');
var ModelBuilder = require('loopback-datasource-juggler').ModelBuilder;
var modeler = new ModelBuilder();
var async = require('async');
var assert = require('assert');

/**
 * The base class for **all models**. 
 *
 * **Inheriting from `Model`**
 *
 * ```js
 * var properties = {...};
 * var options = {...};
 * var MyModel = loopback.Model.extend('MyModel', properties, options);
 * ```
 * 
 * **Options**
 *
 *  - `trackChanges` - If true, changes to the model will be tracked. **Required
 * for replication.**
 *
 * **Events**
 *
 * #### Event: `changed`
 * 
 * Emitted after a model has been successfully created, saved, or updated.
 *
 * ```js
 * MyModel.on('changed', function(inst) {
 *   console.log('model with id %s has been changed', inst.id);
 *   // => model with id 1 has been changed
 * });
 * ```
 * 
 * #### Event: `deleted`
 * 
 * Emitted after an individual model has been deleted.
 *
 * ```js
 * MyModel.on('deleted', function(inst) {
 *   console.log('model with id %s has been deleted', inst.id);
 *   // => model with id 1 has been deleted
 * });
 * ```
 *
 * #### Event: `deletedAll`
 * 
 * Emitted after an individual model has been deleted.
 *
 * ```js
 * MyModel.on('deletedAll', function(where) {
 *   if(where) {
 *     console.log('all models where', where, 'have been deleted');
 *     // => all models where
 *     // => {price: {gt: 100}}
 *     // => have been deleted
 *   }
 * });
 * ```
 * 
 * #### Event: `attached`
 * 
 * Emitted after a `Model` has been attached to an `app`.
 * 
 * #### Event: `dataSourceAttached`
 * 
 * Emitted after a `Model` has been attached to a `DataSource`.
 * 
 * @class
 * @param {Object} data
 * @property {String} modelName The name of the model
 * @property {DataSource} dataSource
 */

var Model = module.exports = modeler.define('Model');

Model.shared = true;

/*!
 * Called when a model is extended.
 */

Model.setup = function () {
  var ModelCtor = this;
  var options = this.settings;
  
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
      ModelCtor.findById(id, function (err, model) {
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
  }

  // before remote hook
  ModelCtor.beforeRemote = function (name, fn) {
    var self = this;
    if(this.app) {
      var remotes = this.app.remotes();
      var className = compat.getClassNameForRemoting(self);
      remotes.before(className + '.' + name, function (ctx, next) {
        fn(ctx, ctx.result, next);
      });
    } else {
      var args = arguments;
      this.once('attached', function () {
        self.beforeRemote.apply(self, args);
      });
    }
  };
  
  // after remote hook
  ModelCtor.afterRemote = function (name, fn) {
    var self = this;
    if(this.app) {
      var remotes = this.app.remotes();
      var className = compat.getClassNameForRemoting(self);
      remotes.after(className + '.' + name, function (ctx, next) {
        fn(ctx, ctx.result, next);
      });
    } else {
      var args = arguments;
      this.once('attached', function () {
        self.afterRemote.apply(self, args);
      });
    }
  };

  // Map the prototype method to /:id with data in the body
  ModelCtor.sharedCtor.accepts = [
    {arg: 'id', type: 'any', http: {source: 'path'}}
    // {arg: 'instance', type: 'object', http: {source: 'body'}}
  ];

  ModelCtor.sharedCtor.http = [
    {path: '/:id'}
  ];
  
  ModelCtor.sharedCtor.returns = {root: true};
  
  ModelCtor.once('dataSourceAttached', function() {
    // enable change tracking (usually for replication)
    if(options.trackChanges) {
      ModelCtor.enableChangeTracking();
    }
  });

  return ModelCtor;
};

/*!
 * Get the reference to ACL in a lazy fashion to avoid race condition in require
 */
var ACL = null;
function getACL() {
  return ACL || (ACL = require('./acl').ACL);
}

/**
 * Check if the given access token can invoke the method
 *
 * @param {AccessToken} token The access token
 * @param {*} modelId The model id
 * @param {String} method The method name
 * @param callback The callback function
 *
 * @callback {Function} callback
 * @param {String|Error} err The error object
 * @param {Boolean} allowed is the request allowed
 */

Model.checkAccess = function(token, modelId, method, callback) {
  var ANONYMOUS = require('./access-token').ANONYMOUS;
  token = token || ANONYMOUS;
  var ACL = getACL();
  var methodName = 'string' === typeof method? method: method && method.name;
  ACL.checkAccessForToken(token, this.modelName, modelId, methodName, callback);
};

/*!
 * Determine the access type for the given `RemoteMethod`.
 *
 * @api private
 * @param {RemoteMethod} method
 */

Model._getAccessTypeForMethod = function(method) {
  if(typeof method === 'string') {
    method = {name: method};
  }
  assert(
    typeof method === 'object', 
    'method is a required argument and must be a RemoteMethod object'
  );

  var ACL = getACL();

  switch(method.name) {
    case'create':
      return ACL.WRITE;
    case 'updateOrCreate':
      return ACL.WRITE;
    case 'upsert':
      return ACL.WRITE;
    case 'exists':
      return ACL.READ;
    case 'findById':
      return ACL.READ;
    case 'find':
      return ACL.READ;
    case 'findOne':
      return ACL.READ;
    case 'destroyById':
      return ACL.WRITE;
    case 'deleteById':
      return ACL.WRITE;
    case 'removeById':
      return ACL.WRITE;
    case 'count':
      return ACL.READ;
    break;
    default:
      return ACL.EXECUTE;
    break;
  }
}

// setup the initial model
Model.setup();

/**
 * Get a set of deltas and conflicts since the given checkpoint.
 *
 * See `Change.diff()` for details.
 * 
 * @param  {Number}   since         Find changes since this checkpoint
 * @param  {Array}   remoteChanges  An array of change objects
 * @param  {Function} callback      
 */

Model.diff = function(since, remoteChanges, callback) {
  var Change = this.getChangeModel();
  Change.diff(this.modelName, since, remoteChanges, callback);
}

/**
 * Get the changes to a model since a given checkpoing. Provide a filter object
 * to reduce the number of results returned.
 * @param  {Number}   since    Only return changes since this checkpoint
 * @param  {Object}   filter   Only include changes that match this filter
 * (same as `Model.find(filter, ...)`)
 * @callback {Function} callback
 * @param {Error} err
 * @param {Array} changes An array of `Change` objects
 * @end
 */

Model.changes = function(since, filter, callback) { 
  var idName = this.dataSource.idName(this.modelName);
  var Change = this.getChangeModel();
  var model = this;

  filter = filter || {};
  filter.fields = {};
  filter.where = filter.where || {};
  filter.fields[idName] = true;

  // this whole thing could be optimized a bit more
  Change.find({
    checkpoint: {gt: since},
    modelName: this.modelName
  }, function(err, changes) {
    if(err) return callback(err);
    var ids = changes.map(function(change) {
      return change.modelId.toString();
    });
    filter.where[idName] = {inq: ids};
    model.find(filter, function(err, models) {
      if(err) return cb(err);
      var modelIds = models.map(function(m) {
        return m[idName].toString();
      });
      callback(null, changes.filter(function(ch) {
        if(ch.type() === Change.DELETE) return true;
        return modelIds.indexOf(ch.modelId) > -1;
      }));
    });
  });
}

/**
 * Create a checkpoint.
 *   
 * @param  {Function} callback
 */

Model.checkpoint = function(cb) {
  var Checkpoint = this.getChangeModel().getCheckpointModel();
  this.getSourceId(function(err, sourceId) {
    if(err) return cb(err);
    Checkpoint.create({
      sourceId: sourceId
    }, cb);
  });
}

/**
 * Get the current checkpoint id.
 *   
 * @callback {Function} callback
 * @param {Error} err
 * @param {Number} currentCheckpointId
 * @end
 */

Model.currentCheckpoint = function(cb) {
  var Checkpoint = this.getChangeModel().getCheckpointModel();
  Checkpoint.current(cb);
}

/**
 * Replicate changes since the given checkpoint to the given target model.
 *
 * @param  {Number}   since        Since this checkpoint
 * @param  {Model}    targetModel  Target this model class
 * @options  {Object} options
 * @property {Object} filter Replicate models that match this filter
 * @callback {Function} callback
 * @param {Error} err
 * @param {Array} conflicts A list of changes that could not be replicated
 * due to conflicts.
 */

Model.replicate = function(since, targetModel, options, callback) {
  var sourceModel = this;
  var diff;
  var updates;
  var Change = this.getChangeModel();
  var TargetChange = targetModel.getChangeModel();

  var tasks = [
    getLocalChanges,
    getDiffFromTarget,
    createSourceUpdates,
    bulkUpdate,
    checkpoint
  ];

  async.waterfall(tasks, function(err) {
    if(err) return callback(err);
    var conflicts = diff.conflicts.map(function(change) {
      var sourceChange = new Change({
        modelName: sourceModel.modelName,
        modelId: change.modelId
      });
      var targetChange = new TargetChange(change);
      return new Change.Conflict(sourceChange, targetChange);
    });

    callback(null, conflicts);
  });

  function getLocalChanges(cb) {
    sourceModel.changes(since, options.filter, cb);
  }

  function getDiffFromTarget(sourceChanges, cb) {
    targetModel.diff(since, sourceChanges, cb);
  }

  function createSourceUpdates(_diff, cb) {
    diff = _diff;
    diff.conflicts = diff.conflicts || [];
    sourceModel.createUpdates(diff.deltas, cb);
  }

  function bulkUpdate(updates, cb) {
    targetModel.bulkUpdate(updates, cb);
  }

  function checkpoint() {
    var cb = arguments[arguments.length - 1];
    sourceModel.checkpoint(cb);
  }
}

/**
 * Create an update list (for `Model.bulkUpdate()`) from a delta list
 * (result of `Change.diff()`).
 * 
 * @param  {Array}    deltas 
 * @param  {Function} callback
 */

Model.createUpdates = function(deltas, cb) {
  var Change = this.getChangeModel();
  var updates = [];
  var Model = this;
  var tasks = [];

  deltas.forEach(function(change) {
    var change = new Change(change);
    var type = change.type();
    var update = {type: type, change: change};
    switch(type) {
      case Change.CREATE:
      case Change.UPDATE:
        tasks.push(function(cb) {
          Model.findById(change.modelId, function(err, inst) {
            if(err) return cb(err);
            if(inst.toObject) {
              update.data = inst.toObject();
            } else {
              update.data = inst;
            }
            updates.push(update);
            cb();
          });
        });
      break;
      case Change.DELETE:
        updates.push(update);
      break;
    }
  });

  async.parallel(tasks, function(err) {
    if(err) return cb(err);
    cb(null, updates);
  });
}

/**
 * Apply an update list.
 *
 * **Note: this is not atomic**
 * 
 * @param  {Array}   updates An updates list (usually from Model.createUpdates())
 * @param  {Function} callback
 */

Model.bulkUpdate = function(updates, callback) {
  var tasks = [];
  var Model = this;
  var idName = this.dataSource.idName(this.modelName);
  var Change = this.getChangeModel();

  updates.forEach(function(update) {
    switch(update.type) {
      case Change.UPDATE:
      case Change.CREATE:
        // var model = new Model(update.data);
        // tasks.push(model.save.bind(model));
        tasks.push(function(cb) {
          var model = new Model(update.data);
          model.save(cb);
        });
      break;
      case Change.DELETE:
        var data = {};
        data[idName] = update.change.modelId;
        var model = new Model(data);
        tasks.push(model.destroy.bind(model));
      break;
    }
  });

  async.parallel(tasks, callback);
}

/**
 * Get the `Change` model.
 * 
 * @return {Change}
 */

Model.getChangeModel = function() {
  var changeModelName = this.modelName + '-change';
  var changeModel = this.Change || loopback.getModel(changeModelName);
  if(changeModel) return changeModel;
  this.Change = changeModel = require('./change').extend(changeModelName);
  changeModel.attachTo(this.dataSource);
  return changeModel;
}

/**
 * Get the source identifier for this model / dataSource.
 * 
 * @callback {Function} callback
 * @param {Error} err
 * @param {String} sourceId
 */

Model.getSourceId = function(cb) {
  var dataSource = this.dataSource;
  if(!dataSource) {
    this.once('dataSourceAttached', this.getSourceId.bind(this, cb));
  }
  assert(
    dataSource.connector.name, 
    'Model.getSourceId: cannot get id without dataSource.connector.name'
  );
  var id = [dataSource.connector.name, this.modelName].join('-');
  cb(null, id);
}

/**
 * Enable the tracking of changes made to the model. Usually for replication.
 */

Model.enableChangeTracking = function() {
  var Model = this;
  var Change = Model.getChangeModel();
  var cleanupInterval = Model.settings.changeCleanupInterval || 30000;

  Model.on('changed', function(obj) {
    Change.track(Model.modelName, [obj.id], function(err) {
      if(err) {
        console.error(Model.modelName + ' Change Tracking Error:');
        console.error(err);
      }
    });
  });

  Model.on('deleted', function(id) {
    Change.track(Model.modelName, [id], function(err) {
      if(err) {
        console.error(Model.modelName + ' Change Tracking Error:');
        console.error(err);
      }
    });
  });

  Model.on('deletedAll', cleanup);

  // initial cleanup
  cleanup();

  // cleanup
  setInterval(cleanup, cleanupInterval);

  function cleanup() {
    Change.rectifyAll(function(err) {
      if(err) {
        console.error(Model.modelName + ' Change Cleanup Error:');
        console.error(err);
      }
    });
  }
}

},{"../compat":4,"../loopback":9,"./access-token":11,"./acl":12,"./change":14,"assert":24,"async":20,"loopback-datasource-juggler":65}],18:[function(require,module,exports){
var process=require("__browserify_process");var loopback = require('../loopback');
var debug = require('debug')('loopback:security:role');
var assert = require('assert');
var async = require('async');

var AccessContext = require('./access-context').AccessContext;

// Role model
var RoleSchema = {
  id: {type: String, id: true}, // Id
  name: {type: String, required: true}, // The name of a role
  description: String, // Description

  // Timestamps
  created: {type: Date, default: Date},
  modified: {type: Date, default: Date}
};

/**
 * Map principals to roles
 */
var RoleMappingSchema = {
  id: {type: String, id: true}, // Id
  roleId: String, // The role id
  principalType: String, // The principal type, such as user, application, or role
  principalId: String // The principal id
};

/**
 * Map Roles to 
 */

var RoleMapping = loopback.createModel('RoleMapping', RoleMappingSchema, {
  relations: {
    role: {
      type: 'belongsTo',
      model: 'Role',
      foreignKey: 'roleId'
    }
  }
});

// Principal types
RoleMapping.USER = 'USER';
RoleMapping.APP = RoleMapping.APPLICATION = 'APP';
RoleMapping.ROLE = 'ROLE';

/**
 * Get the application principal
 * @callback {Function} callback
 * @param {Error} err
 * @param {Application} application
 */
RoleMapping.prototype.application = function (callback) {
  if (this.principalType === RoleMapping.APPLICATION) {
    var applicationModel = this.constructor.Application
      || loopback.getModelByType(loopback.Application);
    applicationModel.findById(this.principalId, callback);
  } else {
    process.nextTick(function () {
      callback && callback(null, null);
    });
  }
};

/**
 * Get the user principal
 * @callback {Function} callback
 * @param {Error} err
 * @param {User} user
 */
RoleMapping.prototype.user = function (callback) {
  if (this.principalType === RoleMapping.USER) {
    var userModel = this.constructor.User
      || loopback.getModelByType(loopback.User);
    userModel.findById(this.principalId, callback);
  } else {
    process.nextTick(function () {
      callback && callback(null, null);
    });
  }
};

/**
 * Get the child role principal
 * @callback {Function} callback
 * @param {Error} err
 * @param {User} childUser
 */
RoleMapping.prototype.childRole = function (callback) {
  if (this.principalType === RoleMapping.ROLE) {
    var roleModel = this.constructor.Role || loopback.getModelByType(Role);
    roleModel.findById(this.principalId, callback);
  } else {
    process.nextTick(function () {
      callback && callback(null, null);
    });
  }
};

/**
 * The Role Model
 * @class
 */
var Role = loopback.createModel('Role', RoleSchema, {
  relations: {
    principals: {
      type: 'hasMany',
      model: 'RoleMapping',
      foreignKey: 'roleId'
    }
  }
});

// Set up the connection to users/applications/roles once the model
Role.once('dataSourceAttached', function () {
  var roleMappingModel = this.RoleMapping || loopback.getModelByType(RoleMapping);
  Role.prototype.users = function (callback) {
    roleMappingModel.find({where: {roleId: this.id,
      principalType: RoleMapping.USER}}, function (err, mappings) {
      if (err) {
        callback && callback(err);
        return;
      }
      return mappings.map(function (m) {
        return m.principalId;
      });
    });
  };

  Role.prototype.applications = function (callback) {
    roleMappingModel.find({where: {roleId: this.id,
      principalType: RoleMapping.APPLICATION}}, function (err, mappings) {
      if (err) {
        callback && callback(err);
        return;
      }
      return mappings.map(function (m) {
        return m.principalId;
      });
    });
  };

  Role.prototype.roles = function (callback) {
    roleMappingModel.find({where: {roleId: this.id,
      principalType: RoleMapping.ROLE}}, function (err, mappings) {
      if (err) {
        callback && callback(err);
        return;
      }
      return mappings.map(function (m) {
        return m.principalId;
      });
    });
  };

});

// Special roles
Role.OWNER = '$owner'; // owner of the object
Role.RELATED = "$related"; // any User with a relationship to the object
Role.AUTHENTICATED = "$authenticated"; // authenticated user
Role.UNAUTHENTICATED = "$unauthenticated"; // authenticated user
Role.EVERYONE = "$everyone"; // everyone

/**
 * Add custom handler for roles
 * @param role
 * @param resolver The resolver function decides if a principal is in the role
 * dynamically
 *
 * function(role, context, callback)
 */
Role.registerResolver = function(role, resolver) {
  if(!Role.resolvers) {
    Role.resolvers = {};
  }
  Role.resolvers[role] = resolver;
};

Role.registerResolver(Role.OWNER, function(role, context, callback) {
  if(!context || !context.model || !context.modelId) {
    process.nextTick(function() {
      callback && callback(null, false);
    });
    return;
  }
  var modelClass = context.model;
  var modelId = context.modelId;
  var userId = context.getUserId();
  Role.isOwner(modelClass, modelId, userId, callback);
});

function isUserClass(modelClass) {
  return modelClass === loopback.User ||
    modelClass.prototype instanceof loopback.User;
}

/**
 * Check if a given userId is the owner the model instance
 * @param {Function} modelClass The model class
 * @param {*} modelId The model id
 * @param {*) userId The user id
 * @param {Function} callback
 */
Role.isOwner = function isOwner(modelClass, modelId, userId, callback) {
  assert(modelClass, 'Model class is required');
  debug('isOwner(): %s %s %s', modelClass && modelClass.modelName, modelId, userId);
  // No userId is present
  if(!userId) {
    process.nextTick(function() {
      callback(null, false);
    });
    return;
  }

  // Is the modelClass User or a subclass of User?
  if(isUserClass(modelClass)) {
    process.nextTick(function() {
      callback(null, modelId == userId);
    });
    return;
  }

  modelClass.findById(modelId, function(err, inst) {
    if(err || !inst) {
      callback && callback(err, false);
      return;
    }
    debug('Model found: %j', inst);
    if(inst.userId || inst.owner) {
      callback && callback(null, (inst.userId || inst.owner) === userId);
      return;
    } else {
      // Try to follow belongsTo
      for(var r in modelClass.relations) {
        var rel = modelClass.relations[r];
        if(rel.type === 'belongsTo' && isUserClass(rel.modelTo)) {
          debug('Checking relation %s to %s: %j', r, rel.modelTo.modelName, rel);
          inst[r](function(err, user) {
            if(!err && user) {
              debug('User found: %j', user.id);
              callback && callback(null, user.id === userId);
            } else {
              callback && callback(err, false);
            }
          });
          return;
        }
      }
      callback && callback(null, false);
    }
  });
};

Role.registerResolver(Role.AUTHENTICATED, function(role, context, callback) {
  if(!context) {
    process.nextTick(function() {
      callback && callback(null, false);
    });
    return;
  }
  Role.isAuthenticated(context, callback);
});

/**
 * Check if the user id is authenticated
 * @param {Object} context The security context
 * @callback {Function} callback
 * @param {Error} err
 * @param {Boolean} isAuthenticated
 */
Role.isAuthenticated = function isAuthenticated(context, callback) {
  process.nextTick(function() {
    callback && callback(null, context.isAuthenticated());
  });
};

Role.registerResolver(Role.UNAUTHENTICATED, function(role, context, callback) {
  process.nextTick(function() {
    callback && callback(null, !context || !context.isAuthenticated());
  });
});

Role.registerResolver(Role.EVERYONE, function (role, context, callback) {
  process.nextTick(function () {
    callback && callback(null, true); // Always true
  });
});

/**
 * Check if a given principal is in the role
 *
 * @param {String} role The role name
 * @param {Object} context The context object
 * @callback {Function} callback
 * @param {Error} err
 * @param {Boolean} isInRole
 */
Role.isInRole = function (role, context, callback) {
  debug('isInRole(): %s %j', role, context);

  if (!(context instanceof AccessContext)) {
    context = new AccessContext(context);
  }

  var resolver = Role.resolvers[role];
  if (resolver) {
    debug('Custom resolver found for role %s', role);
    resolver(role, context, callback);
    return;
  }

  if (context.principals.length === 0) {
    debug('isInRole() returns: false');
    process.nextTick(function () {
      callback && callback(null, false);
    });
    return;
  }

  var inRole = context.principals.some(function (p) {

    var principalType = p.type || undefined;
    var principalId = p.id || undefined;

    // Check if it's the same role
    return principalType === RoleMapping.ROLE && principalId === role;
  });

  if (inRole) {
    debug('isInRole() returns: %j', inRole);
    process.nextTick(function () {
      callback && callback(null, true);
    });
    return;
  }

  var roleMappingModel = this.RoleMapping || loopback.getModelByType(RoleMapping);
  this.findOne({where: {name: role}}, function (err, result) {
    if (err) {
      callback && callback(err);
      return;
    }
    if (!result) {
      callback && callback(null, false);
      return;
    }
    debug('Role found: %j', result);

    // Iterate through the list of principals
    async.some(context.principals, function (p, done) {
      var principalType = p.type || undefined;
      var principalId = p.id || undefined;
      if (principalType && principalId) {
        roleMappingModel.findOne({where: {roleId: result.id,
            principalType: principalType, principalId: principalId}},
          function (err, result) {
            debug('Role mapping found: %j', result);
            done(!err && result); // The only arg is the result
          });
      } else {
        process.nextTick(function () {
          done(false);
        });
      }
    }, function (inRole) {
      debug('isInRole() returns: %j', inRole);
      callback && callback(null, inRole);
    });
  });

};

/**
 * List roles for a given principal
 * @param {Object} context The security context
 * @param {Function} callback
 *
 * @callback {Function} callback
 * @param err
 * @param {String[]} An array of role ids
 */
Role.getRoles = function (context, callback) {
  debug('getRoles(): %j', context);

  if(!(context instanceof AccessContext)) {
    context = new AccessContext(context);
  }
  var roles = [];

  var addRole = function (role) {
    if (role && roles.indexOf(role) === -1) {
      roles.push(role);
    }
  };

  var self = this;
  // Check against the smart roles
  var inRoleTasks = [];
  Object.keys(Role.resolvers).forEach(function (role) {
    inRoleTasks.push(function (done) {
      self.isInRole(role, context, function (err, inRole) {
        if (!err && inRole) {
          addRole(role);
          done();
        } else {
          done(err, null);
        }
      });
    });
  });

  var roleMappingModel = this.RoleMapping || loopback.getModelByType(RoleMapping);
  context.principals.forEach(function (p) {
    // Check against the role mappings
    var principalType = p.type || undefined;
    var principalId = p.id || undefined;

    // Add the role itself
    if (principalType === RoleMapping.ROLE && principalId) {
      addRole(principalId);
    }

    if (principalType && principalId) {
      // Please find() treat undefined matches all values
      inRoleTasks.push(function (done) {
        roleMappingModel.find({where: {principalType: principalType,
          principalId: principalId}}, function (err, mappings) {
          debug('Role mappings found: %s %j', err, mappings);
          if (err) {
            done && done(err);
            return;
          }
          mappings.forEach(function (m) {
            addRole(m.roleId);
          });
          done && done();
        });
      });
    }
  });

  async.parallel(inRoleTasks, function (err, results) {
    debug('getRoles() returns: %j %j', err, roles);
    callback && callback(err, roles);
  });
};

module.exports = {
  Role: Role,
  RoleMapping: RoleMapping
};




},{"../loopback":9,"./access-context":10,"__browserify_process":39,"assert":24,"async":20,"debug":60}],19:[function(require,module,exports){
var __dirname="/lib/models";/**
 * Module Dependencies.
 */

var Model = require('../loopback').Model
  , loopback = require('../loopback')
  , path = require('path')
  , SALT_WORK_FACTOR = 10
  , crypto = require('crypto')
  , bcrypt = require('bcryptjs')
  , passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , BaseAccessToken = require('./access-token')
  , DEFAULT_TTL = 1209600 // 2 weeks in seconds
  , DEFAULT_RESET_PW_TTL = 15 * 60 // 15 mins in seconds
  , DEFAULT_MAX_TTL = 31556926 // 1 year in seconds
  , Role = require('./role').Role
  , ACL = require('./acl').ACL
  , assert = require('assert');

var debug = require('debug')('loopback:user');
/**
 * Default User properties.
 */

var properties = {
    realm: {type: String},
    username: {type: String},
    password: {type: String, required: true},
    email: {type: String, required: true},
    emailVerified: Boolean,
    verificationToken: String,

    credentials: [
        'UserCredential' // User credentials, private or public, such as private/public keys, Kerberos tickets, oAuth tokens, facebook, google, github ids
    ],
    challenges: [
        'Challenge' // Security questions/answers
    ],
    // https://en.wikipedia.org/wiki/Multi-factor_authentication
    /*
    factors: [
        'AuthenticationFactor'
    ],
    */
    status: String,
    created: Date,
    lastUpdated: Date
};

var options = {
  acls: [
    {
      principalType: ACL.ROLE,
      principalId: Role.EVERYONE,
      permission: ACL.DENY,
    },
    {
      principalType: ACL.ROLE,
      principalId: Role.EVERYONE,
      permission: ACL.ALLOW,
      property: 'create'
    },
    {
      principalType: ACL.ROLE,
      principalId: Role.OWNER,
      permission: ACL.ALLOW,
      property: 'removeById'
    },
    {
      principalType: ACL.ROLE,
      principalId: Role.EVERYONE,
      permission: ACL.ALLOW,
      property: "login"
    },
    {
      principalType: ACL.ROLE,
      principalId: Role.EVERYONE,
      permission: ACL.ALLOW,
      property: "logout"
    },
    {
      principalType: ACL.ROLE,
      principalId: Role.OWNER,
      permission: ACL.ALLOW,
      property: "findById"
    },
    {
      principalType: ACL.ROLE,
      principalId: Role.OWNER,
      permission: ACL.ALLOW,
      property: "updateAttributes"
    }
  ]
};

/**
 * Extends from the built in `loopback.Model` type.
 *
 * Default `User` ACLs.
 * 
 * - DENY EVERYONE `*`
 * - ALLOW EVERYONE `create`
 * - ALLOW OWNER `removeById`
 * - ALLOW EVERYONE `login`
 * - ALLOW EVERYONE `logout`
 * - ALLOW EVERYONE `findById`
 * - ALLOW OWNER `updateAttributes`
 *
 * @class
 * @inherits {Model}
 */

var User = module.exports = Model.extend('User', properties, options);

/**
 * Login a user by with the given `credentials`.
 *
 * ```js
 *    User.login({username: 'foo', password: 'bar'}, function (err, token) {
 *      console.log(token.id);
 *    });
 * ```
 *
 * @param {Object} credentials
 * @callback {Function} callback
 * @param {Error} err
 * @param {AccessToken} token
 */

User.login = function (credentials, include, fn) {
  if (typeof include === 'function') {
    fn = include;
    include = undefined;
  }

  include = (include || '').toLowerCase();

  var query = {};
  if(credentials.email) {
    query.email = credentials.email;
  } else if(credentials.username) {
    query.username = credentials.username;
  } else {
    return fn(new Error('must provide username or email'));
  }
  
  this.findOne({where: query}, function(err, user) {
    var defaultError = new Error('login failed');
    
    if(err) {
      debug('An error is reported from User.findOne: %j', err);
      fn(defaultError);
    } else if(user) {
      user.hasPassword(credentials.password, function(err, isMatch) {
        if(err) {
          debug('An error is reported from User.hasPassword: %j', err);
          fn(defaultError);
        } else if(isMatch) {
          user.accessTokens.create({
            ttl: Math.min(credentials.ttl || User.settings.ttl, User.settings.maxTTL)
          }, function(err, token) {
            if (err) return fn(err);
            if (include === 'user') {
              // NOTE(bajtos) We can't set token.user here:
              //  1. token.user already exists, it's a function injected by
              //     "AccessToken belongsTo User" relation
              //  2. ModelBaseClass.toJSON() ignores own properties, thus
              //     the value won't be included in the HTTP response
              // See also loopback#161 and loopback#162
              token.__data.user = user;
            }
            fn(err, token);
          });
        } else {
          debug('The password is invalid for user %s', query.email || query.username);
          fn(defaultError);
        }
      });
    } else {
      debug('No matching record is found for user %s', query.email || query.username);
      fn(defaultError);
    }
  });
}

/**
 * Logout a user with the given accessToken id.
 *
 * ```js
 *    User.logout('asd0a9f8dsj9s0s3223mk', function (err) {
 *      console.log(err || 'Logged out');
 *    });
 * ```
 *
 * @param {String} accessTokenID
 * @callback {Function} callback
 * @param {Error} err
 */

User.logout = function (tokenId, fn) {
  this.relations.accessTokens.modelTo.findById(tokenId, function (err, accessToken) {
    if(err) {
      fn(err);
    } else if(accessToken) {
      accessToken.destroy(fn);
    } else {
      fn(new Error('could not find accessToken'));
    }
  });
}

/**
 * Compare the given `password` with the users hashed password.
 *
 * @param {String} password The plain text password
 * @returns {Boolean}
 */

User.prototype.hasPassword = function (plain, fn) {
  if(this.password && plain) {
    bcrypt.compare(plain, this.password, function(err, isMatch) {
      if(err) return fn(err);
      fn(null, isMatch);
    });
  } else {
    fn(null, false);
  }
}

/**
 * Verify a user's identity by sending them a confirmation email.
 *
 * ```js
 *    var options = {
 *      type: 'email',
 *      to: user.email,
 *      template: 'verify.ejs',
 *      redirect: '/'
 *    };
 *
 *    user.verify(options, next);
 * ```
 *
 * @param {Object} options
 */

User.prototype.verify = function (options, fn) {
  var user = this;
  assert(typeof options === 'object', 'options required when calling user.verify()');
  assert(options.type, 'You must supply a verification type (options.type)');
  assert(options.type === 'email', 'Unsupported verification type');
  assert(options.to || this.email, 'Must include options.to when calling user.verify() or the user must have an email property');
  assert(options.from, 'Must include options.from when calling user.verify() or the user must have an email property');
  
  options.redirect = options.redirect || '/';
  options.template = path.resolve(options.template || path.join(__dirname, '..', '..', 'templates', 'verify.ejs'));
  options.user = this;
  options.protocol = options.protocol || 'http';
  options.host = options.host || 'localhost';
  options.verifyHref = options.verifyHref ||
                       options.protocol
                       + '://'
                       + options.host
                       + User.http.path
                       + User.confirm.http.path;
  

  
  // Email model
  var Email = options.mailer || this.constructor.email || loopback.getModelByType(loopback.Email);
  
  crypto.randomBytes(64, function(err, buf) {
    if(err) {
      fn(err);
    } else {
      user.verificationToken = buf.toString('base64');
      user.save(function (err) {
        if(err) {
          fn(err);
        } else {
          sendEmail(user);      
        }
      });
    }
  });
  
  // TODO - support more verification types
  function sendEmail(user) {
    options.verifyHref += '?token=' + user.verificationToken;
  
    options.text = options.text || 'Please verify your email by opening this link in a web browser:\n\t{href}';
  
    options.text = options.text.replace('{href}', options.verifyHref);
    
    var template = loopback.template(options.template);
    Email.send({
      to: options.to || user.email,
      subject: options.subject || 'Thanks for Registering',
      text: options.text,
      html: template(options)
    }, function (err, email) {
      if(err) {
        fn(err);
      } else {
        fn(null, {email: email, token: user.verificationToken, uid: user.id});
      }
    });
  }
}


/**
 * Confirm the user's identity.
 *
 * @param {Any} userId
 * @param {String} token The validation token
 * @param {String} redirect URL to redirect the user to once confirmed
 * @callback {Function} callback
 * @param {Error} err
 */
User.confirm = function (uid, token, redirect, fn) {
  this.findById(uid, function (err, user) {
    if(err) {
      fn(err);
    } else {
      if(user.verificationToken === token) {
        user.verificationToken = undefined;
        user.emailVerified = true;
        user.save(function (err) {
          if(err) {
            fn(err)
          } else {
            fn();
          }
        });
      } else {
        fn(new Error('invalid token'));
      }
    }
  });
}

/**
 * Create a short lived acess token for temporary login. Allows users
 * to change passwords if forgotten.
 *
 * @options {Object} options
 * @prop {String} email The user's email address
 * @callback {Function} callback
 * @param {Error} err
 */

User.resetPassword = function(options, cb) {
  var UserModel = this;
  var ttl = UserModel.settings.resetPasswordTokenTTL || DEFAULT_RESET_PW_TTL;

  options = options || {};
  if(typeof options.email === 'string') {
    UserModel.findOne({email: options.email}, function(err, user) {
      if(err) {
        cb(err);
      } else if(user) {
        // create a short lived access token for temp login to change password
        // TODO(ritch) - eventually this should only allow password change
        user.accessTokens.create({ttl: ttl}, function(err, accessToken) {
          if(err) {
            cb(err);
          } else {
            cb();
            UserModel.emit('resetPasswordRequest', {
              email: options.email,
              accessToken: accessToken
            });
          }
        })
      } else {
        cb();
      }
    });
  } else {
    var err = new Error('email is required');
    err.statusCode = 400;

    cb(err);
  }
}

/*!
 * Setup an extended user model.
 */

User.setup = function () {
  // We need to call the base class's setup method
  Model.setup.call(this);
  var UserModel = this;
  
  // max ttl
  this.settings.maxTTL = this.settings.maxTTL || DEFAULT_MAX_TTL;
  this.settings.ttl = DEFAULT_TTL;

  UserModel.setter.password = function (plain) {
    var salt = bcrypt.genSaltSync(this.constructor.settings.saltWorkFactor || SALT_WORK_FACTOR);
    this.$password = bcrypt.hashSync(plain, salt);
  }
  
  loopback.remoteMethod(
    UserModel.login,
    {
      accepts: [
        {arg: 'credentials', type: 'object', required: true, http: {source: 'body'}},
        {arg: 'include', type: 'string', http: {source: 'query' }, description:
          'Related objects to include in the response. ' +
            'See the description of return value for more details.'}
      ],
      returns: {
        arg: 'accessToken', type: 'object', root: true, description:
          'The response body contains properties of the AccessToken created on login.\n' +
            'Depending on the value of `include` parameter, the body may contain ' +
            'additional properties:\n\n' +
            '  - `user` - `{User}` - Data of the currently logged in user. (`include=user`)\n\n'
      },
      http: {verb: 'post'}
    }
  );
  
  loopback.remoteMethod(
    UserModel.logout,
    {
      accepts: [
        {arg: 'access_token', type: 'string', required: true, http: function(ctx) {
          var req = ctx && ctx.req;
          var accessToken = req && req.accessToken;
          var tokenID = accessToken && accessToken.id;

          return tokenID;
        }, description:
          'Do not supply this argument, it is automatically extracted ' +
            'from request headers.'
        }
      ],
      http: {verb: 'all'}
    }
  );
  
  loopback.remoteMethod(
    UserModel.confirm,
    {
      accepts: [
        {arg: 'uid', type: 'string', required: true},
        {arg: 'token', type: 'string', required: true},
        {arg: 'redirect', type: 'string', required: true}
      ],
      http: {verb: 'get', path: '/confirm'}
    }
  );
  
  loopback.remoteMethod(
    UserModel.resetPassword,
    {
      accepts: [
        {arg: 'options', type: 'object', required: true, http: {source: 'body'}}
      ],
      http: {verb: 'post', path: '/reset'}
    }
  );

  UserModel.on('attached', function () {
    UserModel.afterRemote('confirm', function (ctx, inst, next) {
      if(ctx.req) {
        ctx.res.redirect(ctx.req.param('redirect'));
      } else {
        fn(new Error('transport unsupported'));
      }
    });
  });
  
  // default models
  UserModel.email = require('./email');
  UserModel.accessToken = require('./access-token');
  
  UserModel.validatesUniquenessOf('email', {message: 'Email already exists'});
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  
  UserModel.validatesFormatOf('email', {with: re, message: 'Must provide a valid email'});
  
  return UserModel;
}

/*!
 * Setup the base user.
 */

User.setup();

},{"../loopback":9,"./access-token":11,"./acl":12,"./email":16,"./role":18,"assert":24,"bcryptjs":21,"crypto":27,"debug":60,"passport":23,"passport-local":25,"path":43}],20:[function(require,module,exports){
var process=require("__browserify_process");/*global setImmediate: false, setTimeout: false, console: false */
(function () {

    var async = {};

    // global on the server, window in the browser
    var root, previous_async;

    root = this;
    if (root != null) {
      previous_async = root.async;
    }

    async.noConflict = function () {
        root.async = previous_async;
        return async;
    };

    function only_once(fn) {
        var called = false;
        return function() {
            if (called) throw new Error("Callback was already called.");
            called = true;
            fn.apply(root, arguments);
        }
    }

    //// cross-browser compatiblity functions ////

    var _each = function (arr, iterator) {
        if (arr.forEach) {
            return arr.forEach(iterator);
        }
        for (var i = 0; i < arr.length; i += 1) {
            iterator(arr[i], i, arr);
        }
    };

    var _map = function (arr, iterator) {
        if (arr.map) {
            return arr.map(iterator);
        }
        var results = [];
        _each(arr, function (x, i, a) {
            results.push(iterator(x, i, a));
        });
        return results;
    };

    var _reduce = function (arr, iterator, memo) {
        if (arr.reduce) {
            return arr.reduce(iterator, memo);
        }
        _each(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    };

    var _keys = function (obj) {
        if (Object.keys) {
            return Object.keys(obj);
        }
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    //// exported async module functions ////

    //// nextTick implementation with browser-compatible fallback ////
    if (typeof process === 'undefined' || !(process.nextTick)) {
        if (typeof setImmediate === 'function') {
            async.nextTick = function (fn) {
                // not a direct alias for IE10 compatibility
                setImmediate(fn);
            };
            async.setImmediate = async.nextTick;
        }
        else {
            async.nextTick = function (fn) {
                setTimeout(fn, 0);
            };
            async.setImmediate = async.nextTick;
        }
    }
    else {
        async.nextTick = process.nextTick;
        if (typeof setImmediate !== 'undefined') {
            async.setImmediate = function (fn) {
              // not a direct alias for IE10 compatibility
              setImmediate(fn);
            };
        }
        else {
            async.setImmediate = async.nextTick;
        }
    }

    async.each = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        _each(arr, function (x) {
            iterator(x, only_once(function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed >= arr.length) {
                        callback(null);
                    }
                }
            }));
        });
    };
    async.forEach = async.each;

    async.eachSeries = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        var iterate = function () {
            iterator(arr[completed], function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed >= arr.length) {
                        callback(null);
                    }
                    else {
                        iterate();
                    }
                }
            });
        };
        iterate();
    };
    async.forEachSeries = async.eachSeries;

    async.eachLimit = function (arr, limit, iterator, callback) {
        var fn = _eachLimit(limit);
        fn.apply(null, [arr, iterator, callback]);
    };
    async.forEachLimit = async.eachLimit;

    var _eachLimit = function (limit) {

        return function (arr, iterator, callback) {
            callback = callback || function () {};
            if (!arr.length || limit <= 0) {
                return callback();
            }
            var completed = 0;
            var started = 0;
            var running = 0;

            (function replenish () {
                if (completed >= arr.length) {
                    return callback();
                }

                while (running < limit && started < arr.length) {
                    started += 1;
                    running += 1;
                    iterator(arr[started - 1], function (err) {
                        if (err) {
                            callback(err);
                            callback = function () {};
                        }
                        else {
                            completed += 1;
                            running -= 1;
                            if (completed >= arr.length) {
                                callback();
                            }
                            else {
                                replenish();
                            }
                        }
                    });
                }
            })();
        };
    };


    var doParallel = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.each].concat(args));
        };
    };
    var doParallelLimit = function(limit, fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [_eachLimit(limit)].concat(args));
        };
    };
    var doSeries = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.eachSeries].concat(args));
        };
    };


    var _asyncMap = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (err, v) {
                results[x.index] = v;
                callback(err);
            });
        }, function (err) {
            callback(err, results);
        });
    };
    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);
    async.mapLimit = function (arr, limit, iterator, callback) {
        return _mapLimit(limit)(arr, iterator, callback);
    };

    var _mapLimit = function(limit) {
        return doParallelLimit(limit, _asyncMap);
    };

    // reduce only has a series version, as doing reduce in parallel won't
    // work in many situations.
    async.reduce = function (arr, memo, iterator, callback) {
        async.eachSeries(arr, function (x, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    };
    // inject alias
    async.inject = async.reduce;
    // foldl alias
    async.foldl = async.reduce;

    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, function (x) {
            return x;
        }).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };
    // foldr alias
    async.foldr = async.reduceRight;

    var _filter = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.filter = doParallel(_filter);
    async.filterSeries = doSeries(_filter);
    // select alias
    async.select = async.filter;
    async.selectSeries = async.filterSeries;

    var _reject = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (!v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.reject = doParallel(_reject);
    async.rejectSeries = doSeries(_reject);

    var _detect = function (eachfn, arr, iterator, main_callback) {
        eachfn(arr, function (x, callback) {
            iterator(x, function (result) {
                if (result) {
                    main_callback(x);
                    main_callback = function () {};
                }
                else {
                    callback();
                }
            });
        }, function (err) {
            main_callback();
        });
    };
    async.detect = doParallel(_detect);
    async.detectSeries = doSeries(_detect);

    async.some = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (v) {
                    main_callback(true);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(false);
        });
    };
    // any alias
    async.any = async.some;

    async.every = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (!v) {
                    main_callback(false);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(true);
        });
    };
    // all alias
    async.all = async.every;

    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                var fn = function (left, right) {
                    var a = left.criteria, b = right.criteria;
                    return a < b ? -1 : a > b ? 1 : 0;
                };
                callback(null, _map(results.sort(fn), function (x) {
                    return x.value;
                }));
            }
        });
    };

    async.auto = function (tasks, callback) {
        callback = callback || function () {};
        var keys = _keys(tasks);
        if (!keys.length) {
            return callback(null);
        }

        var results = {};

        var listeners = [];
        var addListener = function (fn) {
            listeners.unshift(fn);
        };
        var removeListener = function (fn) {
            for (var i = 0; i < listeners.length; i += 1) {
                if (listeners[i] === fn) {
                    listeners.splice(i, 1);
                    return;
                }
            }
        };
        var taskComplete = function () {
            _each(listeners.slice(0), function (fn) {
                fn();
            });
        };

        addListener(function () {
            if (_keys(results).length === keys.length) {
                callback(null, results);
                callback = function () {};
            }
        });

        _each(keys, function (k) {
            var task = (tasks[k] instanceof Function) ? [tasks[k]]: tasks[k];
            var taskCallback = function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (args.length <= 1) {
                    args = args[0];
                }
                if (err) {
                    var safeResults = {};
                    _each(_keys(results), function(rkey) {
                        safeResults[rkey] = results[rkey];
                    });
                    safeResults[k] = args;
                    callback(err, safeResults);
                    // stop subsequent errors hitting callback multiple times
                    callback = function () {};
                }
                else {
                    results[k] = args;
                    async.setImmediate(taskComplete);
                }
            };
            var requires = task.slice(0, Math.abs(task.length - 1)) || [];
            var ready = function () {
                return _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true) && !results.hasOwnProperty(k);
            };
            if (ready()) {
                task[task.length - 1](taskCallback, results);
            }
            else {
                var listener = function () {
                    if (ready()) {
                        removeListener(listener);
                        task[task.length - 1](taskCallback, results);
                    }
                };
                addListener(listener);
            }
        });
    };

    async.waterfall = function (tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor !== Array) {
          var err = new Error('First argument to waterfall must be an array of functions');
          return callback(err);
        }
        if (!tasks.length) {
            return callback();
        }
        var wrapIterator = function (iterator) {
            return function (err) {
                if (err) {
                    callback.apply(null, arguments);
                    callback = function () {};
                }
                else {
                    var args = Array.prototype.slice.call(arguments, 1);
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    }
                    else {
                        args.push(callback);
                    }
                    async.setImmediate(function () {
                        iterator.apply(null, args);
                    });
                }
            };
        };
        wrapIterator(async.iterator(tasks))();
    };

    var _parallel = function(eachfn, tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor === Array) {
            eachfn.map(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            eachfn.each(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.parallel = function (tasks, callback) {
        _parallel({ map: async.map, each: async.each }, tasks, callback);
    };

    async.parallelLimit = function(tasks, limit, callback) {
        _parallel({ map: _mapLimit(limit), each: _eachLimit(limit) }, tasks, callback);
    };

    async.series = function (tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor === Array) {
            async.mapSeries(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            async.eachSeries(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.iterator = function (tasks) {
        var makeCallback = function (index) {
            var fn = function () {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            };
            fn.next = function () {
                return (index < tasks.length - 1) ? makeCallback(index + 1): null;
            };
            return fn;
        };
        return makeCallback(0);
    };

    async.apply = function (fn) {
        var args = Array.prototype.slice.call(arguments, 1);
        return function () {
            return fn.apply(
                null, args.concat(Array.prototype.slice.call(arguments))
            );
        };
    };

    var _concat = function (eachfn, arr, fn, callback) {
        var r = [];
        eachfn(arr, function (x, cb) {
            fn(x, function (err, y) {
                r = r.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, r);
        });
    };
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = function (test, iterator, callback) {
        if (test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.whilst(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doWhilst = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            if (test()) {
                async.doWhilst(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.until = function (test, iterator, callback) {
        if (!test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.until(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doUntil = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            if (!test()) {
                async.doUntil(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.queue = function (worker, concurrency) {
        if (concurrency === undefined) {
            concurrency = 1;
        }
        function _insert(q, data, pos, callback) {
          if(data.constructor !== Array) {
              data = [data];
          }
          _each(data, function(task) {
              var item = {
                  data: task,
                  callback: typeof callback === 'function' ? callback : null
              };

              if (pos) {
                q.tasks.unshift(item);
              } else {
                q.tasks.push(item);
              }

              if (q.saturated && q.tasks.length === concurrency) {
                  q.saturated();
              }
              async.setImmediate(q.process);
          });
        }

        var workers = 0;
        var q = {
            tasks: [],
            concurrency: concurrency,
            saturated: null,
            empty: null,
            drain: null,
            push: function (data, callback) {
              _insert(q, data, false, callback);
            },
            unshift: function (data, callback) {
              _insert(q, data, true, callback);
            },
            process: function () {
                if (workers < q.concurrency && q.tasks.length) {
                    var task = q.tasks.shift();
                    if (q.empty && q.tasks.length === 0) {
                        q.empty();
                    }
                    workers += 1;
                    var next = function () {
                        workers -= 1;
                        if (task.callback) {
                            task.callback.apply(task, arguments);
                        }
                        if (q.drain && q.tasks.length + workers === 0) {
                            q.drain();
                        }
                        q.process();
                    };
                    var cb = only_once(next);
                    worker(task.data, cb);
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            }
        };
        return q;
    };

    async.cargo = function (worker, payload) {
        var working     = false,
            tasks       = [];

        var cargo = {
            tasks: tasks,
            payload: payload,
            saturated: null,
            empty: null,
            drain: null,
            push: function (data, callback) {
                if(data.constructor !== Array) {
                    data = [data];
                }
                _each(data, function(task) {
                    tasks.push({
                        data: task,
                        callback: typeof callback === 'function' ? callback : null
                    });
                    if (cargo.saturated && tasks.length === payload) {
                        cargo.saturated();
                    }
                });
                async.setImmediate(cargo.process);
            },
            process: function process() {
                if (working) return;
                if (tasks.length === 0) {
                    if(cargo.drain) cargo.drain();
                    return;
                }

                var ts = typeof payload === 'number'
                            ? tasks.splice(0, payload)
                            : tasks.splice(0);

                var ds = _map(ts, function (task) {
                    return task.data;
                });

                if(cargo.empty) cargo.empty();
                working = true;
                worker(ds, function () {
                    working = false;

                    var args = arguments;
                    _each(ts, function (data) {
                        if (data.callback) {
                            data.callback.apply(null, args);
                        }
                    });

                    process();
                });
            },
            length: function () {
                return tasks.length;
            },
            running: function () {
                return working;
            }
        };
        return cargo;
    };

    var _console_fn = function (name) {
        return function (fn) {
            var args = Array.prototype.slice.call(arguments, 1);
            fn.apply(null, args.concat([function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (typeof console !== 'undefined') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    }
                    else if (console[name]) {
                        _each(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            }]));
        };
    };
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        hasher = hasher || function (x) {
            return x;
        };
        var memoized = function () {
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (key in memo) {
                callback.apply(null, memo[key]);
            }
            else if (key in queues) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([function () {
                    memo[key] = arguments;
                    var q = queues[key];
                    delete queues[key];
                    for (var i = 0, l = q.length; i < l; i++) {
                      q[i].apply(null, arguments);
                    }
                }]));
            }
        };
        memoized.memo = memo;
        memoized.unmemoized = fn;
        return memoized;
    };

    async.unmemoize = function (fn) {
      return function () {
        return (fn.unmemoized || fn).apply(null, arguments);
      };
    };

    async.times = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.map(counter, iterator, callback);
    };

    async.timesSeries = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.mapSeries(counter, iterator, callback);
    };

    async.compose = function (/* functions... */) {
        var fns = Array.prototype.reverse.call(arguments);
        return function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            async.reduce(fns, args, function (newargs, fn, cb) {
                fn.apply(that, newargs.concat([function () {
                    var err = arguments[0];
                    var nextargs = Array.prototype.slice.call(arguments, 1);
                    cb(err, nextargs);
                }]))
            },
            function (err, results) {
                callback.apply(that, [err].concat(results));
            });
        };
    };

    var _applyEach = function (eachfn, fns /*args...*/) {
        var go = function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            return eachfn(fns, function (fn, cb) {
                fn.apply(that, args.concat([cb]));
            },
            callback);
        };
        if (arguments.length > 2) {
            var args = Array.prototype.slice.call(arguments, 2);
            return go.apply(this, args);
        }
        else {
            return go;
        }
    };
    async.applyEach = doParallel(_applyEach);
    async.applyEachSeries = doSeries(_applyEach);

    async.forever = function (fn, callback) {
        function next(err) {
            if (err) {
                if (callback) {
                    return callback(err);
                }
                throw err;
            }
            fn(next);
        }
        next();
    };

    // AMD / RequireJS
    if (typeof define !== 'undefined' && define.amd) {
        define([], function () {
            return async;
        });
    }
    // Node.js
    else if (typeof module !== 'undefined' && module.exports) {
        module.exports = async;
    }
    // included directly via <script> tag
    else {
        root.async = async;
    }

}());

},{"__browserify_process":39}],21:[function(require,module,exports){
var process=require("__browserify_process");/*
 bcrypt.js (c) 2013 Daniel Wirtz <dcode@dcode.io>
 Released under the Apache License, Version 2.0
 see: https://github.com/dcodeIO/bcrypt.js for details
*/
function p(n){throw n;}var q=null;
(function(n){function u(c,a,b,f){for(var d,e=c[a],l=c[a+1],e=e^b[0],h=0;14>=h;)d=f[e>>24&255],d+=f[256|e>>16&255],d^=f[512|e>>8&255],d+=f[768|e&255],l^=d^b[++h],d=f[l>>24&255],d+=f[256|l>>16&255],d^=f[512|l>>8&255],d+=f[768|l&255],e^=d^b[++h];c[a]=l^b[17];c[a+1]=e;return c}function s(c,a){var b,f=0;for(b=0;4>b;b++)f=f<<8|c[a]&255,a=(a+1)%c.length;return{key:f,a:a}}function y(c,a,b){for(var f=0,d=[0,0],e=a.length,l=b.length,h=0;h<e;h++){var g=s(c,f),f=g.a;a[h]^=g.key}for(h=0;h<e;h+=2)d=u(d,0,a,b),
a[h]=d[0],a[h+1]=d[1];for(h=0;h<l;h+=2)d=u(d,0,a,b),b[h]=d[0],b[h+1]=d[1]}function C(c,a,b,f){for(var d=0,e=[0,0],l=b.length,h=f.length,g,k=0;k<l;k++)g=s(a,d),d=g.a,b[k]^=g.key;for(k=d=0;k<l;k+=2)g=s(c,d),d=g.a,e[0]^=g.key,g=s(c,d),d=g.a,e[1]^=g.key,e=u(e,0,b,f),b[k]=e[0],b[k+1]=e[1];for(k=0;k<h;k+=2)g=s(c,d),d=g.a,e[0]^=g.key,g=s(c,d),d=g.a,e[1]^=g.key,e=u(e,0,b,f),f[k]=e[0],f[k+1]=e[1]}function z(c){"undefined"!==typeof process&&"function"===typeof process.nextTick?process.nextTick(c):setTimeout(c,
0)}function A(c,a,b,f){function d(){if(k<b)for(var n=new Date;k<b&&!(k+=1,y(c,h,g),y(a,h,g),100<Date.now()-n););else{for(k=0;64>k;k++)for(m=0;m<l>>1;m++)u(e,m<<1,h,g);n=[];for(k=0;k<l;k++)n.push((e[k]>>24&255)>>>0),n.push((e[k]>>16&255)>>>0),n.push((e[k]>>8&255)>>>0),n.push((e[k]&255)>>>0);return f?(f(q,n),q):n}f&&z(d);return q}var e=B.slice(),l=e.length;(4>b||31<b)&&p(Error("Illegal number of rounds: "+b));16!=a.length&&p(Error("Illegal salt length: "+a.length+" != 16"));b=1<<b;var h=D.slice(),g=
E.slice();C(a,c,h,g);var k=0,m;if("undefined"!==typeof f)return d(),q;for(var n;;)if((n=d())!==q)return n}function F(c){for(var a,b,f=[],d=0;d<c.length;d++){a=c.charCodeAt(d);b=[];do b.push(a&255),a>>=8;while(a);f=f.concat(b.reverse())}return f}function w(c,a,b){function f(a){var b=[];b.push("$2");"a"<=d&&b.push(d);b.push("$");10>l&&b.push("0");b.push(l.toString());b.push("$");b.push(v.b(h,h.length));b.push(v.b(a,4*B.length-1));return b.join("")}var d,e;("$"!=a.charAt(0)||"2"!=a.charAt(1))&&p(Error("Invalid salt version: "+
a.substring(0,2)));"$"==a.charAt(2)?(d=String.fromCharCode(0),e=3):(d=a.charAt(2),("a"!=d||"$"!=a.charAt(3))&&p(Error("Invalid salt revision: "+a.substring(2,4))),e=4);"$"<a.charAt(e+2)&&p(Error("Missing salt rounds"));var l=10*parseInt(a.substring(e,e+1),10)+parseInt(a.substring(e+1,e+2),10);a=a.substring(e+3,e+25);c=F(c+("a"<=d?"\x00":""));var h=[],h=v.c(a,16);if("undefined"==typeof b)return f(A(c,h,l));A(c,h,l,function(a,c){a?b(a,q):b(q,f(c))});return q}function G(){if("undefined"!==typeof module&&
module.exports)return require("crypto").randomBytes(16);var c=new Uint32Array(16);n.crypto&&"function"===typeof n.crypto.getRandomValues?n.crypto.getRandomValues(c):"function"===typeof x?x(c):p(Error("Failed to generate random values: Web Crypto API not available / no polyfill set"));return Array.prototype.slice.call(c)}var t="./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split(""),r=[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,0,1,54,55,56,57,58,59,60,61,62,63,-1,-1,-1,-1,-1,-1,-1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,-1,-1,-1,-1,-1,-1,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,-1,-1,-1,-1,-1],v={b:function(c,a){var b=0,f=[],d,e;for((0>=a||a>c.length)&&p(Error("Invalid 'len': "+a));b<a;){d=c[b++]&255;f.push(t[d>>2&63]);d=(d&3)<<4;if(b>=a){f.push(t[d&63]);break}e=c[b++]&255;d|=e>>4&15;f.push(t[d&63]);d=(e&15)<<
2;if(b>=a){f.push(t[d&63]);break}e=c[b++]&255;d|=e>>6&3;f.push(t[d&63]);f.push(t[e&63])}return f.join("")},c:function(c,a){var b=0,f=c.length,d=0,e=[],l,h,g;for(0>=a&&p(Error("Illegal 'len': "+a));b<f-1&&d<a;){g=c.charCodeAt(b++);l=g<r.length?r[g]:-1;g=c.charCodeAt(b++);h=g<r.length?r[g]:-1;if(-1==l||-1==h)break;g=l<<2>>>0;g|=(h&48)>>4;e.push(String.fromCharCode(g));if(++d>=a||b>=f)break;g=c.charCodeAt(b++);l=g<r.length?r[g]:-1;if(-1==l)break;g=(h&15)<<4>>>0;g|=(l&60)>>2;e.push(String.fromCharCode(g));
if(++d>=a||b>=f)break;g=c.charCodeAt(b++);h=g<r.length?r[g]:-1;g=(l&3)<<6>>>0;g|=h;e.push(String.fromCharCode(g));++d}f=[];for(b=0;b<d;b++)f.push(e[b].charCodeAt(0));return f}},m={},D=[608135816,2242054355,320440878,57701188,2752067618,698298832,137296536,3964562569,1160258022,953160567,3193202383,887688300,3232508343,3380367581,1065670069,3041331479,2450970073,2306472731],E=[3509652390,2564797868,805139163,3491422135,3101798381,1780907670,3128725573,4046225305,614570311,3012652279,134345442,2240740374,
1667834072,1901547113,2757295779,4103290238,227898511,1921955416,1904987480,2182433518,2069144605,3260701109,2620446009,720527379,3318853667,677414384,3393288472,3101374703,2390351024,1614419982,1822297739,2954791486,3608508353,3174124327,2024746970,1432378464,3864339955,2857741204,1464375394,1676153920,1439316330,715854006,3033291828,289532110,2706671279,2087905683,3018724369,1668267050,732546397,1947742710,3462151702,2609353502,2950085171,1814351708,2050118529,680887927,999245976,1800124847,3300911131,
1713906067,1641548236,4213287313,1216130144,1575780402,4018429277,3917837745,3693486850,3949271944,596196993,3549867205,258830323,2213823033,772490370,2760122372,1774776394,2652871518,566650946,4142492826,1728879713,2882767088,1783734482,3629395816,2517608232,2874225571,1861159788,326777828,3124490320,2130389656,2716951837,967770486,1724537150,2185432712,2364442137,1164943284,2105845187,998989502,3765401048,2244026483,1075463327,1455516326,1322494562,910128902,469688178,1117454909,936433444,3490320968,
3675253459,1240580251,122909385,2157517691,634681816,4142456567,3825094682,3061402683,2540495037,79693498,3249098678,1084186820,1583128258,426386531,1761308591,1047286709,322548459,995290223,1845252383,2603652396,3431023940,2942221577,3202600964,3727903485,1712269319,422464435,3234572375,1170764815,3523960633,3117677531,1434042557,442511882,3600875718,1076654713,1738483198,4213154764,2393238008,3677496056,1014306527,4251020053,793779912,2902807211,842905082,4246964064,1395751752,1040244610,2656851899,
3396308128,445077038,3742853595,3577915638,679411651,2892444358,2354009459,1767581616,3150600392,3791627101,3102740896,284835224,4246832056,1258075500,768725851,2589189241,3069724005,3532540348,1274779536,3789419226,2764799539,1660621633,3471099624,4011903706,913787905,3497959166,737222580,2514213453,2928710040,3937242737,1804850592,3499020752,2949064160,2386320175,2390070455,2415321851,4061277028,2290661394,2416832540,1336762016,1754252060,3520065937,3014181293,791618072,3188594551,3933548030,2332172193,
3852520463,3043980520,413987798,3465142937,3030929376,4245938359,2093235073,3534596313,375366246,2157278981,2479649556,555357303,3870105701,2008414854,3344188149,4221384143,3956125452,2067696032,3594591187,2921233993,2428461,544322398,577241275,1471733935,610547355,4027169054,1432588573,1507829418,2025931657,3646575487,545086370,48609733,2200306550,1653985193,298326376,1316178497,3007786442,2064951626,458293330,2589141269,3591329599,3164325604,727753846,2179363840,146436021,1461446943,4069977195,
705550613,3059967265,3887724982,4281599278,3313849956,1404054877,2845806497,146425753,1854211946,1266315497,3048417604,3681880366,3289982499,290971E4,1235738493,2632868024,2414719590,3970600049,1771706367,1449415276,3266420449,422970021,1963543593,2690192192,3826793022,1062508698,1531092325,1804592342,2583117782,2714934279,4024971509,1294809318,4028980673,1289560198,2221992742,1669523910,35572830,157838143,1052438473,1016535060,1802137761,1753167236,1386275462,3080475397,2857371447,1040679964,2145300060,
2390574316,1461121720,2956646967,4031777805,4028374788,33600511,2920084762,1018524850,629373528,3691585981,3515945977,2091462646,2486323059,586499841,988145025,935516892,3367335476,2599673255,2839830854,265290510,3972581182,2759138881,3795373465,1005194799,847297441,406762289,1314163512,1332590856,1866599683,4127851711,750260880,613907577,1450815602,3165620655,3734664991,3650291728,3012275730,3704569646,1427272223,778793252,1343938022,2676280711,2052605720,1946737175,3164576444,3914038668,3967478842,
3682934266,1661551462,3294938066,4011595847,840292616,3712170807,616741398,312560963,711312465,1351876610,322626781,1910503582,271666773,2175563734,1594956187,70604529,3617834859,1007753275,1495573769,4069517037,2549218298,2663038764,504708206,2263041392,3941167025,2249088522,1514023603,1998579484,1312622330,694541497,2582060303,2151582166,1382467621,776784248,2618340202,3323268794,2497899128,2784771155,503983604,4076293799,907881277,423175695,432175456,1378068232,4145222326,3954048622,3938656102,
3820766613,2793130115,2977904593,26017576,3274890735,3194772133,1700274565,1756076034,4006520079,3677328699,720338349,1533947780,354530856,688349552,3973924725,1637815568,332179504,3949051286,53804574,2852348879,3044236432,1282449977,3583942155,3416972820,4006381244,1617046695,2628476075,3002303598,1686838959,431878346,2686675385,1700445008,1080580658,1009431731,832498133,3223435511,2605976345,2271191193,2516031870,1648197032,4164389018,2548247927,300782431,375919233,238389289,3353747414,2531188641,
2019080857,1475708069,455242339,2609103871,448939670,3451063019,1395535956,2413381860,1841049896,1491858159,885456874,4264095073,4001119347,1565136089,3898914787,1108368660,540939232,1173283510,2745871338,3681308437,4207628240,3343053890,4016749493,1699691293,1103962373,3625875870,2256883143,3830138730,1031889488,3479347698,1535977030,4236805024,3251091107,2132092099,1774941330,1199868427,1452454533,157007616,2904115357,342012276,595725824,1480756522,206960106,497939518,591360097,863170706,2375253569,
3596610801,1814182875,2094937945,3421402208,1082520231,3463918190,2785509508,435703966,3908032597,1641649973,2842273706,3305899714,1510255612,2148256476,2655287854,3276092548,4258621189,236887753,3681803219,274041037,1734335097,3815195456,3317970021,1899903192,1026095262,4050517792,356393447,2410691914,3873677099,3682840055,3913112168,2491498743,4132185628,2489919796,1091903735,1979897079,3170134830,3567386728,3557303409,857797738,1136121015,1342202287,507115054,2535736646,337727348,3213592640,1301675037,
2528481711,1895095763,1721773893,3216771564,62756741,2142006736,835421444,2531993523,1442658625,3659876326,2882144922,676362277,1392781812,170690266,3921047035,1759253602,3611846912,1745797284,664899054,1329594018,3901205900,3045908486,2062866102,2865634940,3543621612,3464012697,1080764994,553557557,3656615353,3996768171,991055499,499776247,1265440854,648242737,3940784050,980351604,3713745714,1749149687,3396870395,4211799374,3640570775,1161844396,3125318951,1431517754,545492359,4268468663,3499529547,
1437099964,2702547544,3433638243,2581715763,2787789398,1060185593,1593081372,2418618748,4260947970,69676912,2159744348,86519011,2512459080,3838209314,1220612927,3339683548,133810670,1090789135,1078426020,1569222167,845107691,3583754449,4072456591,1091646820,628848692,1613405280,3757631651,526609435,236106946,48312990,2942717905,3402727701,1797494240,859738849,992217954,4005476642,2243076622,3870952857,3732016268,765654824,3490871365,2511836413,1685915746,3888969200,1414112111,2273134842,3281911079,
4080962846,172450625,2569994100,980381355,4109958455,2819808352,2716589560,2568741196,3681446669,3329971472,1835478071,660984891,3704678404,4045999559,3422617507,3040415634,1762651403,1719377915,3470491036,2693910283,3642056355,3138596744,1364962596,2073328063,1983633131,926494387,3423689081,2150032023,4096667949,1749200295,3328846651,309677260,2016342300,1779581495,3079819751,111262694,1274766160,443224088,298511866,1025883608,3806446537,1145181785,168956806,3641502830,3584813610,1689216846,3666258015,
3200248200,1692713982,2646376535,4042768518,1618508792,1610833997,3523052358,4130873264,2001055236,3610705100,2202168115,4028541809,2961195399,1006657119,2006996926,3186142756,1430667929,3210227297,1314452623,4074634658,4101304120,2273951170,1399257539,3367210612,3027628629,1190975929,2062231137,2333990788,2221543033,2438960610,1181637006,548689776,2362791313,3372408396,3104550113,3145860560,296247880,1970579870,3078560182,3769228297,1714227617,3291629107,3898220290,166772364,1251581989,493813264,
448347421,195405023,2709975567,677966185,3703036547,1463355134,2715995803,1338867538,1343315457,2802222074,2684532164,233230375,2599980071,2000651841,3277868038,1638401717,4028070440,3237316320,6314154,819756386,300326615,590932579,1405279636,3267499572,3150704214,2428286686,3959192993,3461946742,1862657033,1266418056,963775037,2089974820,2263052895,1917689273,448879540,3550394620,3981727096,150775221,3627908307,1303187396,508620638,2975983352,2726630617,1817252668,1876281319,1457606340,908771278,
3720792119,3617206836,2455994898,1729034894,1080033504,976866871,3556439503,2881648439,1522871579,1555064734,1336096578,3548522304,2579274686,3574697629,3205460757,3593280638,3338716283,3079412587,564236357,2993598910,1781952180,1464380207,3163844217,3332601554,1699332808,1393555694,1183702653,3581086237,1288719814,691649499,2847557200,2895455976,3193889540,2717570544,1781354906,1676643554,2592534050,3230253752,1126444790,2770207658,2633158820,2210423226,2615765581,2414155088,3127139286,673620729,
2805611233,1269405062,4015350505,3341807571,4149409754,1057255273,2012875353,2162469141,2276492801,2601117357,993977747,3918593370,2654263191,753973209,36408145,2530585658,25011837,3520020182,2088578344,530523599,2918365339,1524020338,1518925132,3760827505,3759777254,1202760957,3985898139,3906192525,674977740,4174734889,2031300136,2019492241,3983892565,4153806404,3822280332,352677332,2297720250,60907813,90501309,3286998549,1016092578,2535922412,2839152426,457141659,509813237,4120667899,652014361,
1966332200,2975202805,55981186,2327461051,676427537,3255491064,2882294119,3433927263,1307055953,942726286,933058658,2468411793,3933900994,4215176142,1361170020,2001714738,2830558078,3274259782,1222529897,1679025792,2729314320,3714953764,1770335741,151462246,3013232138,1682292957,1483529935,471910574,1539241949,458788160,3436315007,1807016891,3718408830,978976581,1043663428,3165965781,1927990952,4200891579,2372276910,3208408903,3533431907,1412390302,2931980059,4132332400,1947078029,3881505623,4168226417,
2941484381,1077988104,1320477388,886195818,18198404,3786409E3,2509781533,112762804,3463356488,1866414978,891333506,18488651,661792760,1628790961,3885187036,3141171499,876946877,2693282273,1372485963,791857591,2686433993,3759982718,3167212022,3472953795,2716379847,445679433,3561995674,3504004811,3574258232,54117162,3331405415,2381918588,3769707343,4154350007,1140177722,4074052095,668550556,3214352940,367459370,261225585,2610173221,4209349473,3468074219,3265815641,314222801,3066103646,3808782860,282218597,
3406013506,3773591054,379116347,1285071038,846784868,2669647154,3771962079,3550491691,2305946142,453669953,1268987020,3317592352,3279303384,3744833421,2610507566,3859509063,266596637,3847019092,517658769,3462560207,3443424879,370717030,4247526661,2224018117,4143653529,4112773975,2788324899,2477274417,1456262402,2901442914,1517677493,1846949527,2295493580,3734397586,2176403920,1280348187,1908823572,3871786941,846861322,1172426758,3287448474,3383383037,1655181056,3139813346,901632758,1897031941,2986607138,
3066810236,3447102507,1393639104,373351379,950779232,625454576,3124240540,4148612726,2007998917,544563296,2244738638,2330496472,2058025392,1291430526,424198748,50039436,29584100,3605783033,2429876329,2791104160,1057563949,3255363231,3075367218,3463963227,1469046755,985887462],B=[1332899944,1700884034,1701343084,1684370003,1668446532,1869963892],x=q;m.setRandomPolyfill=function(c){x=c};m.genSaltSync=function(c){c||(c=10);var a;c=c||10;(4>c||31<c)&&p(Error("Illegal number of rounds: "+c));var b=[];
b.push("$2a$");10>c&&b.push("0");b.push(c.toString());b.push("$");try{b.push(v.b(G(),16)),a=b.join("")}catch(f){p(f)}return a};m.genSalt=function(c,a,b){"function"==typeof a&&(b=a,a=-1);var f;"function"==typeof c?(b=c,f=10):f=parseInt(c,10);"function"!=typeof b&&p(Error("Illegal or missing 'callback': "+b));z(function(){try{var a=m.genSaltSync(f);b(q,a)}catch(c){b(c,q)}})};m.hashSync=function(c,a){a||(a=10);"number"==typeof a&&(a=m.genSaltSync(a));return w(c,a)};m.hash=function(c,a,b){"function"!=
typeof b&&p(Error("Illegal 'callback': "+b));"number"==typeof a?m.genSalt(a,function(a,d){w(c,d,b)}):w(c,a,b)};m.compareSync=function(c,a){("string"!=typeof c||"string"!=typeof a)&&p(Error("Illegal argument types: "+typeof c+", "+typeof a));60!=a.length&&p(Error("Illegal hash length: "+a.length+" != 60"));for(var b=m.hashSync(c,a.substr(0,a.length-31)),f=b.length==a.length,d=b.length<a.length?b.length:a.length,e=0;e<d;++e)b.length>=e&&(a.length>=e&&b[e]!=a[e])&&(f=!1);return f};m.compare=function(c,
a,b){"function"!=typeof b&&p(Error("Illegal 'callback': "+b));m.hash(c,a.substr(0,29),function(c,d){b(c,a===d)})};m.getRounds=function(c){"string"!=typeof c&&p(Error("Illegal type of 'hash': "+typeof c));return parseInt(c.split("$")[2],10)};m.getSalt=function(c){"string"!=typeof c&&p(Error("Illegal type of 'hash': "+typeof c));60!=c.length&&p(Error("Illegal hash length: "+c.length+" != 60"));return c.substring(0,29)};"undefined"!=typeof module&&module.exports?module.exports=m:"undefined"!=typeof define&&
define.amd?define("bcrypt",function(){return m}):(n.dcodeIO||(n.dcodeIO={}),n.dcodeIO.bcrypt=m)})(this);

},{"__browserify_process":39,"crypto":27}],22:[function(require,module,exports){
// Browser Request
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var XHR = XMLHttpRequest
if (!XHR) throw new Error('missing XMLHttpRequest')

module.exports = request
request.log = {
  'trace': noop, 'debug': noop, 'info': noop, 'warn': noop, 'error': noop
}

var DEFAULT_TIMEOUT = 3 * 60 * 1000 // 3 minutes

//
// request
//

function request(options, callback) {
  // The entry-point to the API: prep the options object and pass the real work to run_xhr.
  if(typeof callback !== 'function')
    throw new Error('Bad callback given: ' + callback)

  if(!options)
    throw new Error('No options given')

  var options_onResponse = options.onResponse; // Save this for later.

  if(typeof options === 'string')
    options = {'uri':options};
  else
    options = JSON.parse(JSON.stringify(options)); // Use a duplicate for mutating.

  options.onResponse = options_onResponse // And put it back.

  if (options.verbose) request.log = getLogger();

  if(options.url) {
    options.uri = options.url;
    delete options.url;
  }

  if(!options.uri && options.uri !== "")
    throw new Error("options.uri is a required argument");

  if(typeof options.uri != "string")
    throw new Error("options.uri must be a string");

  var unsupported_options = ['proxy', '_redirectsFollowed', 'maxRedirects', 'followRedirect']
  for (var i = 0; i < unsupported_options.length; i++)
    if(options[ unsupported_options[i] ])
      throw new Error("options." + unsupported_options[i] + " is not supported")

  options.callback = callback
  options.method = options.method || 'GET';
  options.headers = options.headers || {};
  options.body    = options.body || null
  options.timeout = options.timeout || request.DEFAULT_TIMEOUT

  if(options.headers.host)
    throw new Error("Options.headers.host is not supported");

  if(options.json) {
    options.headers.accept = options.headers.accept || 'application/json'
    if(options.method !== 'GET')
      options.headers['content-type'] = 'application/json'

    if(typeof options.json !== 'boolean')
      options.body = JSON.stringify(options.json)
    else if(typeof options.body !== 'string')
      options.body = JSON.stringify(options.body)
  }

  // If onResponse is boolean true, call back immediately when the response is known,
  // not when the full request is complete.
  options.onResponse = options.onResponse || noop
  if(options.onResponse === true) {
    options.onResponse = callback
    options.callback = noop
  }

  // XXX Browsers do not like this.
  //if(options.body)
  //  options.headers['content-length'] = options.body.length;

  // HTTP basic authentication
  if(!options.headers.authorization && options.auth)
    options.headers.authorization = 'Basic ' + b64_enc(options.auth.username + ':' + options.auth.password);

  return run_xhr(options)
}

var req_seq = 0
function run_xhr(options) {
  var xhr = new XHR
    , timed_out = false
    , is_cors = is_crossDomain(options.uri)
    , supports_cors = ('withCredentials' in xhr)

  req_seq += 1
  xhr.seq_id = req_seq
  xhr.id = req_seq + ': ' + options.method + ' ' + options.uri
  xhr._id = xhr.id // I know I will type "_id" from habit all the time.

  if(is_cors && !supports_cors) {
    var cors_err = new Error('Browser does not support cross-origin request: ' + options.uri)
    cors_err.cors = 'unsupported'
    return options.callback(cors_err, xhr)
  }

  xhr.timeoutTimer = setTimeout(too_late, options.timeout)
  function too_late() {
    timed_out = true
    var er = new Error('ETIMEDOUT')
    er.code = 'ETIMEDOUT'
    er.duration = options.timeout

    request.log.error('Timeout', { 'id':xhr._id, 'milliseconds':options.timeout })
    return options.callback(er, xhr)
  }

  // Some states can be skipped over, so remember what is still incomplete.
  var did = {'response':false, 'loading':false, 'end':false}

  xhr.onreadystatechange = on_state_change
  xhr.open(options.method, options.uri, true) // asynchronous
  if(is_cors)
    xhr.withCredentials = !! options.withCredentials
  xhr.send(options.body)
  return xhr

  function on_state_change(event) {
    if(timed_out)
      return request.log.debug('Ignoring timed out state change', {'state':xhr.readyState, 'id':xhr.id})

    request.log.debug('State change', {'state':xhr.readyState, 'id':xhr.id, 'timed_out':timed_out})

    if(xhr.readyState === XHR.OPENED) {
      request.log.debug('Request started', {'id':xhr.id})
      for (var key in options.headers)
        xhr.setRequestHeader(key, options.headers[key])
    }

    else if(xhr.readyState === XHR.HEADERS_RECEIVED)
      on_response()

    else if(xhr.readyState === XHR.LOADING) {
      on_response()
      on_loading()
    }

    else if(xhr.readyState === XHR.DONE) {
      on_response()
      on_loading()
      on_end()
    }
  }

  function on_response() {
    if(did.response)
      return

    did.response = true
    request.log.debug('Got response', {'id':xhr.id, 'status':xhr.status})
    clearTimeout(xhr.timeoutTimer)
    xhr.statusCode = xhr.status // Node request compatibility

    // Detect failed CORS requests.
    if(is_cors && xhr.statusCode == 0) {
      var cors_err = new Error('CORS request rejected: ' + options.uri)
      cors_err.cors = 'rejected'

      // Do not process this request further.
      did.loading = true
      did.end = true

      return options.callback(cors_err, xhr)
    }

    options.onResponse(null, xhr)
  }

  function on_loading() {
    if(did.loading)
      return

    did.loading = true
    request.log.debug('Response body loading', {'id':xhr.id})
    // TODO: Maybe simulate "data" events by watching xhr.responseText
  }

  function on_end() {
    if(did.end)
      return

    did.end = true
    request.log.debug('Request done', {'id':xhr.id})

    xhr.body = xhr.responseText
    if(options.json) {
      try        { xhr.body = JSON.parse(xhr.responseText) }
      catch (er) { return options.callback(er, xhr)        }
    }

    options.callback(null, xhr, xhr.body)
  }

} // request

request.withCredentials = false;
request.DEFAULT_TIMEOUT = DEFAULT_TIMEOUT;

//
// defaults
//

request.defaults = function(options, requester) {
  var def = function (method) {
    var d = function (params, callback) {
      if(typeof params === 'string')
        params = {'uri': params};
      else {
        params = JSON.parse(JSON.stringify(params));
      }
      for (var i in options) {
        if (params[i] === undefined) params[i] = options[i]
      }
      return method(params, callback)
    }
    return d
  }
  var de = def(request)
  de.get = def(request.get)
  de.post = def(request.post)
  de.put = def(request.put)
  de.head = def(request.head)
  return de
}

//
// HTTP method shortcuts
//

var shortcuts = [ 'get', 'put', 'post', 'head' ];
shortcuts.forEach(function(shortcut) {
  var method = shortcut.toUpperCase();
  var func   = shortcut.toLowerCase();

  request[func] = function(opts) {
    if(typeof opts === 'string')
      opts = {'method':method, 'uri':opts};
    else {
      opts = JSON.parse(JSON.stringify(opts));
      opts.method = method;
    }

    var args = [opts].concat(Array.prototype.slice.apply(arguments, [1]));
    return request.apply(this, args);
  }
})

//
// CouchDB shortcut
//

request.couch = function(options, callback) {
  if(typeof options === 'string')
    options = {'uri':options}

  // Just use the request API to do JSON.
  options.json = true
  if(options.body)
    options.json = options.body
  delete options.body

  callback = callback || noop

  var xhr = request(options, couch_handler)
  return xhr

  function couch_handler(er, resp, body) {
    if(er)
      return callback(er, resp, body)

    if((resp.statusCode < 200 || resp.statusCode > 299) && body.error) {
      // The body is a Couch JSON object indicating the error.
      er = new Error('CouchDB error: ' + (body.error.reason || body.error.error))
      for (var key in body)
        er[key] = body[key]
      return callback(er, resp, body);
    }

    return callback(er, resp, body);
  }
}

//
// Utility
//

function noop() {}

function getLogger() {
  var logger = {}
    , levels = ['trace', 'debug', 'info', 'warn', 'error']
    , level, i

  for(i = 0; i < levels.length; i++) {
    level = levels[i]

    logger[level] = noop
    if(typeof console !== 'undefined' && console && console[level])
      logger[level] = formatted(console, level)
  }

  return logger
}

function formatted(obj, method) {
  return formatted_logger

  function formatted_logger(str, context) {
    if(typeof context === 'object')
      str += ' ' + JSON.stringify(context)

    return obj[method].call(obj, str)
  }
}

// Return whether a URL is a cross-domain request.
function is_crossDomain(url) {
  var rurl = /^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+))?)?/

  // jQuery #8138, IE may throw an exception when accessing
  // a field from window.location if document.domain has been set
  var ajaxLocation
  try { ajaxLocation = location.href }
  catch (e) {
    // Use the href attribute of an A element since IE will modify it given document.location
    ajaxLocation = document.createElement( "a" );
    ajaxLocation.href = "";
    ajaxLocation = ajaxLocation.href;
  }

  var ajaxLocParts = rurl.exec(ajaxLocation.toLowerCase()) || []
    , parts = rurl.exec(url.toLowerCase() )

  var result = !!(
    parts &&
    (  parts[1] != ajaxLocParts[1]
    || parts[2] != ajaxLocParts[2]
    || (parts[3] || (parts[1] === "http:" ? 80 : 443)) != (ajaxLocParts[3] || (ajaxLocParts[1] === "http:" ? 80 : 443))
    )
  )

  //console.debug('is_crossDomain('+url+') -> ' + result)
  return result
}

// MIT License from http://phpjs.org/functions/base64_encode:358
function b64_enc (data) {
    // Encodes string using MIME base64 algorithm
    var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var o1, o2, o3, h1, h2, h3, h4, bits, i = 0, ac = 0, enc="", tmp_arr = [];

    if (!data) {
        return data;
    }

    // assume utf8 data
    // data = this.utf8_encode(data+'');

    do { // pack three octets into four hexets
        o1 = data.charCodeAt(i++);
        o2 = data.charCodeAt(i++);
        o3 = data.charCodeAt(i++);

        bits = o1<<16 | o2<<8 | o3;

        h1 = bits>>18 & 0x3f;
        h2 = bits>>12 & 0x3f;
        h3 = bits>>6 & 0x3f;
        h4 = bits & 0x3f;

        // use hexets to index into b64, and append result to encoded string
        tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
    } while (i < data.length);

    enc = tmp_arr.join('');

    switch (data.length % 3) {
        case 1:
            enc = enc.slice(0, -2) + '==';
        break;
        case 2:
            enc = enc.slice(0, -1) + '=';
        break;
    }

    return enc;
}

},{}],23:[function(require,module,exports){

},{}],24:[function(require,module,exports){
// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// when used in node, this will actually load the util module we depend on
// versus loading the builtin util module as happens otherwise
// this is a bug in node module loading as far as I am concerned
var util = require('util/');

var pSlice = Array.prototype.slice;
var hasOwn = Object.prototype.hasOwnProperty;

// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function replacer(key, value) {
  if (util.isUndefined(value)) {
    return '' + value;
  }
  if (util.isNumber(value) && (isNaN(value) || !isFinite(value))) {
    return value.toString();
  }
  if (util.isFunction(value) || util.isRegExp(value)) {
    return value.toString();
  }
  return value;
}

function truncate(s, n) {
  if (util.isString(s)) {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}

function getMessage(self) {
  return truncate(JSON.stringify(self.actual, replacer), 128) + ' ' +
         self.operator + ' ' +
         truncate(JSON.stringify(self.expected, replacer), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

function _deepEqual(actual, expected) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (util.isBuffer(actual) && util.isBuffer(expected)) {
    if (actual.length != expected.length) return false;

    for (var i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) return false;
    }

    return true;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (!util.isObject(actual) && !util.isObject(expected)) {
    return actual == expected;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b) {
  if (util.isNullOrUndefined(a) || util.isNullOrUndefined(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (!isArguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b);
  }
  try {
    var ka = objectKeys(a),
        kb = objectKeys(b),
        key, i;
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  } else if (actual instanceof expected) {
    return true;
  } else if (expected.call({}, actual) === true) {
    return true;
  }

  return false;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (util.isString(expected)) {
    message = expected;
    expected = null;
  }

  try {
    block();
  } catch (e) {
    actual = e;
  }

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  if (!shouldThrow && expectedException(actual, expected)) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [true].concat(pSlice.call(arguments)));
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/message) {
  _throws.apply(this, [false].concat(pSlice.call(arguments)));
};

assert.ifError = function(err) { if (err) {throw err;}};

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

},{"util/":58}],25:[function(require,module,exports){
module.exports=require(23)
},{}],26:[function(require,module,exports){
var Buffer = require('buffer').Buffer;
var intSize = 4;
var zeroBuffer = new Buffer(intSize); zeroBuffer.fill(0);
var chrsz = 8;

function toArray(buf, bigEndian) {
  if ((buf.length % intSize) !== 0) {
    var len = buf.length + (intSize - (buf.length % intSize));
    buf = Buffer.concat([buf, zeroBuffer], len);
  }

  var arr = [];
  var fn = bigEndian ? buf.readInt32BE : buf.readInt32LE;
  for (var i = 0; i < buf.length; i += intSize) {
    arr.push(fn.call(buf, i));
  }
  return arr;
}

function toBuffer(arr, size, bigEndian) {
  var buf = new Buffer(size);
  var fn = bigEndian ? buf.writeInt32BE : buf.writeInt32LE;
  for (var i = 0; i < arr.length; i++) {
    fn.call(buf, arr[i], i * 4, true);
  }
  return buf;
}

function hash(buf, fn, hashSize, bigEndian) {
  if (!Buffer.isBuffer(buf)) buf = new Buffer(buf);
  var arr = fn(toArray(buf, bigEndian), buf.length * chrsz);
  return toBuffer(arr, hashSize, bigEndian);
}

module.exports = { hash: hash };

},{"buffer":40}],27:[function(require,module,exports){
var Buffer = require('buffer').Buffer
var sha = require('./sha')
var sha256 = require('./sha256')
var rng = require('./rng')
var md5 = require('./md5')

var algorithms = {
  sha1: sha,
  sha256: sha256,
  md5: md5
}

var blocksize = 64
var zeroBuffer = new Buffer(blocksize); zeroBuffer.fill(0)
function hmac(fn, key, data) {
  if(!Buffer.isBuffer(key)) key = new Buffer(key)
  if(!Buffer.isBuffer(data)) data = new Buffer(data)

  if(key.length > blocksize) {
    key = fn(key)
  } else if(key.length < blocksize) {
    key = Buffer.concat([key, zeroBuffer], blocksize)
  }

  var ipad = new Buffer(blocksize), opad = new Buffer(blocksize)
  for(var i = 0; i < blocksize; i++) {
    ipad[i] = key[i] ^ 0x36
    opad[i] = key[i] ^ 0x5C
  }

  var hash = fn(Buffer.concat([ipad, data]))
  return fn(Buffer.concat([opad, hash]))
}

function hash(alg, key) {
  alg = alg || 'sha1'
  var fn = algorithms[alg]
  var bufs = []
  var length = 0
  if(!fn) error('algorithm:', alg, 'is not yet supported')
  return {
    update: function (data) {
      if(!Buffer.isBuffer(data)) data = new Buffer(data)
        
      bufs.push(data)
      length += data.length
      return this
    },
    digest: function (enc) {
      var buf = Buffer.concat(bufs)
      var r = key ? hmac(fn, key, buf) : fn(buf)
      bufs = null
      return enc ? r.toString(enc) : r
    }
  }
}

function error () {
  var m = [].slice.call(arguments).join(' ')
  throw new Error([
    m,
    'we accept pull requests',
    'http://github.com/dominictarr/crypto-browserify'
    ].join('\n'))
}

exports.createHash = function (alg) { return hash(alg) }
exports.createHmac = function (alg, key) { return hash(alg, key) }
exports.randomBytes = function(size, callback) {
  if (callback && callback.call) {
    try {
      callback.call(this, undefined, new Buffer(rng(size)))
    } catch (err) { callback(err) }
  } else {
    return new Buffer(rng(size))
  }
}

function each(a, f) {
  for(var i in a)
    f(a[i], i)
}

// the least I can do is make error messages for the rest of the node.js/crypto api.
each(['createCredentials'
, 'createCipher'
, 'createCipheriv'
, 'createDecipher'
, 'createDecipheriv'
, 'createSign'
, 'createVerify'
, 'createDiffieHellman'
, 'pbkdf2'], function (name) {
  exports[name] = function () {
    error('sorry,', name, 'is not implemented yet')
  }
})

},{"./md5":28,"./rng":29,"./sha":30,"./sha256":31,"buffer":40}],28:[function(require,module,exports){
/*
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Version 2.1 Copyright (C) Paul Johnston 1999 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 */

var helpers = require('./helpers');

/*
 * Perform a simple self-test to see if the VM is working
 */
function md5_vm_test()
{
  return hex_md5("abc") == "900150983cd24fb0d6963f7d28e17f72";
}

/*
 * Calculate the MD5 of an array of little-endian words, and a bit length
 */
function core_md5(x, len)
{
  /* append padding */
  x[len >> 5] |= 0x80 << ((len) % 32);
  x[(((len + 64) >>> 9) << 4) + 14] = len;

  var a =  1732584193;
  var b = -271733879;
  var c = -1732584194;
  var d =  271733878;

  for(var i = 0; i < x.length; i += 16)
  {
    var olda = a;
    var oldb = b;
    var oldc = c;
    var oldd = d;

    a = md5_ff(a, b, c, d, x[i+ 0], 7 , -680876936);
    d = md5_ff(d, a, b, c, x[i+ 1], 12, -389564586);
    c = md5_ff(c, d, a, b, x[i+ 2], 17,  606105819);
    b = md5_ff(b, c, d, a, x[i+ 3], 22, -1044525330);
    a = md5_ff(a, b, c, d, x[i+ 4], 7 , -176418897);
    d = md5_ff(d, a, b, c, x[i+ 5], 12,  1200080426);
    c = md5_ff(c, d, a, b, x[i+ 6], 17, -1473231341);
    b = md5_ff(b, c, d, a, x[i+ 7], 22, -45705983);
    a = md5_ff(a, b, c, d, x[i+ 8], 7 ,  1770035416);
    d = md5_ff(d, a, b, c, x[i+ 9], 12, -1958414417);
    c = md5_ff(c, d, a, b, x[i+10], 17, -42063);
    b = md5_ff(b, c, d, a, x[i+11], 22, -1990404162);
    a = md5_ff(a, b, c, d, x[i+12], 7 ,  1804603682);
    d = md5_ff(d, a, b, c, x[i+13], 12, -40341101);
    c = md5_ff(c, d, a, b, x[i+14], 17, -1502002290);
    b = md5_ff(b, c, d, a, x[i+15], 22,  1236535329);

    a = md5_gg(a, b, c, d, x[i+ 1], 5 , -165796510);
    d = md5_gg(d, a, b, c, x[i+ 6], 9 , -1069501632);
    c = md5_gg(c, d, a, b, x[i+11], 14,  643717713);
    b = md5_gg(b, c, d, a, x[i+ 0], 20, -373897302);
    a = md5_gg(a, b, c, d, x[i+ 5], 5 , -701558691);
    d = md5_gg(d, a, b, c, x[i+10], 9 ,  38016083);
    c = md5_gg(c, d, a, b, x[i+15], 14, -660478335);
    b = md5_gg(b, c, d, a, x[i+ 4], 20, -405537848);
    a = md5_gg(a, b, c, d, x[i+ 9], 5 ,  568446438);
    d = md5_gg(d, a, b, c, x[i+14], 9 , -1019803690);
    c = md5_gg(c, d, a, b, x[i+ 3], 14, -187363961);
    b = md5_gg(b, c, d, a, x[i+ 8], 20,  1163531501);
    a = md5_gg(a, b, c, d, x[i+13], 5 , -1444681467);
    d = md5_gg(d, a, b, c, x[i+ 2], 9 , -51403784);
    c = md5_gg(c, d, a, b, x[i+ 7], 14,  1735328473);
    b = md5_gg(b, c, d, a, x[i+12], 20, -1926607734);

    a = md5_hh(a, b, c, d, x[i+ 5], 4 , -378558);
    d = md5_hh(d, a, b, c, x[i+ 8], 11, -2022574463);
    c = md5_hh(c, d, a, b, x[i+11], 16,  1839030562);
    b = md5_hh(b, c, d, a, x[i+14], 23, -35309556);
    a = md5_hh(a, b, c, d, x[i+ 1], 4 , -1530992060);
    d = md5_hh(d, a, b, c, x[i+ 4], 11,  1272893353);
    c = md5_hh(c, d, a, b, x[i+ 7], 16, -155497632);
    b = md5_hh(b, c, d, a, x[i+10], 23, -1094730640);
    a = md5_hh(a, b, c, d, x[i+13], 4 ,  681279174);
    d = md5_hh(d, a, b, c, x[i+ 0], 11, -358537222);
    c = md5_hh(c, d, a, b, x[i+ 3], 16, -722521979);
    b = md5_hh(b, c, d, a, x[i+ 6], 23,  76029189);
    a = md5_hh(a, b, c, d, x[i+ 9], 4 , -640364487);
    d = md5_hh(d, a, b, c, x[i+12], 11, -421815835);
    c = md5_hh(c, d, a, b, x[i+15], 16,  530742520);
    b = md5_hh(b, c, d, a, x[i+ 2], 23, -995338651);

    a = md5_ii(a, b, c, d, x[i+ 0], 6 , -198630844);
    d = md5_ii(d, a, b, c, x[i+ 7], 10,  1126891415);
    c = md5_ii(c, d, a, b, x[i+14], 15, -1416354905);
    b = md5_ii(b, c, d, a, x[i+ 5], 21, -57434055);
    a = md5_ii(a, b, c, d, x[i+12], 6 ,  1700485571);
    d = md5_ii(d, a, b, c, x[i+ 3], 10, -1894986606);
    c = md5_ii(c, d, a, b, x[i+10], 15, -1051523);
    b = md5_ii(b, c, d, a, x[i+ 1], 21, -2054922799);
    a = md5_ii(a, b, c, d, x[i+ 8], 6 ,  1873313359);
    d = md5_ii(d, a, b, c, x[i+15], 10, -30611744);
    c = md5_ii(c, d, a, b, x[i+ 6], 15, -1560198380);
    b = md5_ii(b, c, d, a, x[i+13], 21,  1309151649);
    a = md5_ii(a, b, c, d, x[i+ 4], 6 , -145523070);
    d = md5_ii(d, a, b, c, x[i+11], 10, -1120210379);
    c = md5_ii(c, d, a, b, x[i+ 2], 15,  718787259);
    b = md5_ii(b, c, d, a, x[i+ 9], 21, -343485551);

    a = safe_add(a, olda);
    b = safe_add(b, oldb);
    c = safe_add(c, oldc);
    d = safe_add(d, oldd);
  }
  return Array(a, b, c, d);

}

/*
 * These functions implement the four basic operations the algorithm uses.
 */
function md5_cmn(q, a, b, x, s, t)
{
  return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s),b);
}
function md5_ff(a, b, c, d, x, s, t)
{
  return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
}
function md5_gg(a, b, c, d, x, s, t)
{
  return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
}
function md5_hh(a, b, c, d, x, s, t)
{
  return md5_cmn(b ^ c ^ d, a, b, x, s, t);
}
function md5_ii(a, b, c, d, x, s, t)
{
  return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
}

/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */
function safe_add(x, y)
{
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
}

/*
 * Bitwise rotate a 32-bit number to the left.
 */
function bit_rol(num, cnt)
{
  return (num << cnt) | (num >>> (32 - cnt));
}

module.exports = function md5(buf) {
  return helpers.hash(buf, core_md5, 16);
};

},{"./helpers":26}],29:[function(require,module,exports){
// Original code adapted from Robert Kieffer.
// details at https://github.com/broofa/node-uuid
(function() {
  var _global = this;

  var mathRNG, whatwgRNG;

  // NOTE: Math.random() does not guarantee "cryptographic quality"
  mathRNG = function(size) {
    var bytes = new Array(size);
    var r;

    for (var i = 0, r; i < size; i++) {
      if ((i & 0x03) == 0) r = Math.random() * 0x100000000;
      bytes[i] = r >>> ((i & 0x03) << 3) & 0xff;
    }

    return bytes;
  }

  if (_global.crypto && crypto.getRandomValues) {
    whatwgRNG = function(size) {
      var bytes = new Uint8Array(size);
      crypto.getRandomValues(bytes);
      return bytes;
    }
  }

  module.exports = whatwgRNG || mathRNG;

}())

},{}],30:[function(require,module,exports){
/*
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
 * in FIPS PUB 180-1
 * Version 2.1a Copyright Paul Johnston 2000 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for details.
 */

var helpers = require('./helpers');

/*
 * Calculate the SHA-1 of an array of big-endian words, and a bit length
 */
function core_sha1(x, len)
{
  /* append padding */
  x[len >> 5] |= 0x80 << (24 - len % 32);
  x[((len + 64 >> 9) << 4) + 15] = len;

  var w = Array(80);
  var a =  1732584193;
  var b = -271733879;
  var c = -1732584194;
  var d =  271733878;
  var e = -1009589776;

  for(var i = 0; i < x.length; i += 16)
  {
    var olda = a;
    var oldb = b;
    var oldc = c;
    var oldd = d;
    var olde = e;

    for(var j = 0; j < 80; j++)
    {
      if(j < 16) w[j] = x[i + j];
      else w[j] = rol(w[j-3] ^ w[j-8] ^ w[j-14] ^ w[j-16], 1);
      var t = safe_add(safe_add(rol(a, 5), sha1_ft(j, b, c, d)),
                       safe_add(safe_add(e, w[j]), sha1_kt(j)));
      e = d;
      d = c;
      c = rol(b, 30);
      b = a;
      a = t;
    }

    a = safe_add(a, olda);
    b = safe_add(b, oldb);
    c = safe_add(c, oldc);
    d = safe_add(d, oldd);
    e = safe_add(e, olde);
  }
  return Array(a, b, c, d, e);

}

/*
 * Perform the appropriate triplet combination function for the current
 * iteration
 */
function sha1_ft(t, b, c, d)
{
  if(t < 20) return (b & c) | ((~b) & d);
  if(t < 40) return b ^ c ^ d;
  if(t < 60) return (b & c) | (b & d) | (c & d);
  return b ^ c ^ d;
}

/*
 * Determine the appropriate additive constant for the current iteration
 */
function sha1_kt(t)
{
  return (t < 20) ?  1518500249 : (t < 40) ?  1859775393 :
         (t < 60) ? -1894007588 : -899497514;
}

/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */
function safe_add(x, y)
{
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
}

/*
 * Bitwise rotate a 32-bit number to the left.
 */
function rol(num, cnt)
{
  return (num << cnt) | (num >>> (32 - cnt));
}

module.exports = function sha1(buf) {
  return helpers.hash(buf, core_sha1, 20, true);
};

},{"./helpers":26}],31:[function(require,module,exports){

/**
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-256, as defined
 * in FIPS 180-2
 * Version 2.2-beta Copyright Angel Marin, Paul Johnston 2000 - 2009.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 *
 */

var helpers = require('./helpers');

var safe_add = function(x, y) {
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
};

var S = function(X, n) {
  return (X >>> n) | (X << (32 - n));
};

var R = function(X, n) {
  return (X >>> n);
};

var Ch = function(x, y, z) {
  return ((x & y) ^ ((~x) & z));
};

var Maj = function(x, y, z) {
  return ((x & y) ^ (x & z) ^ (y & z));
};

var Sigma0256 = function(x) {
  return (S(x, 2) ^ S(x, 13) ^ S(x, 22));
};

var Sigma1256 = function(x) {
  return (S(x, 6) ^ S(x, 11) ^ S(x, 25));
};

var Gamma0256 = function(x) {
  return (S(x, 7) ^ S(x, 18) ^ R(x, 3));
};

var Gamma1256 = function(x) {
  return (S(x, 17) ^ S(x, 19) ^ R(x, 10));
};

var core_sha256 = function(m, l) {
  var K = new Array(0x428A2F98,0x71374491,0xB5C0FBCF,0xE9B5DBA5,0x3956C25B,0x59F111F1,0x923F82A4,0xAB1C5ED5,0xD807AA98,0x12835B01,0x243185BE,0x550C7DC3,0x72BE5D74,0x80DEB1FE,0x9BDC06A7,0xC19BF174,0xE49B69C1,0xEFBE4786,0xFC19DC6,0x240CA1CC,0x2DE92C6F,0x4A7484AA,0x5CB0A9DC,0x76F988DA,0x983E5152,0xA831C66D,0xB00327C8,0xBF597FC7,0xC6E00BF3,0xD5A79147,0x6CA6351,0x14292967,0x27B70A85,0x2E1B2138,0x4D2C6DFC,0x53380D13,0x650A7354,0x766A0ABB,0x81C2C92E,0x92722C85,0xA2BFE8A1,0xA81A664B,0xC24B8B70,0xC76C51A3,0xD192E819,0xD6990624,0xF40E3585,0x106AA070,0x19A4C116,0x1E376C08,0x2748774C,0x34B0BCB5,0x391C0CB3,0x4ED8AA4A,0x5B9CCA4F,0x682E6FF3,0x748F82EE,0x78A5636F,0x84C87814,0x8CC70208,0x90BEFFFA,0xA4506CEB,0xBEF9A3F7,0xC67178F2);
  var HASH = new Array(0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A, 0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19);
    var W = new Array(64);
    var a, b, c, d, e, f, g, h, i, j;
    var T1, T2;
  /* append padding */
  m[l >> 5] |= 0x80 << (24 - l % 32);
  m[((l + 64 >> 9) << 4) + 15] = l;
  for (var i = 0; i < m.length; i += 16) {
    a = HASH[0]; b = HASH[1]; c = HASH[2]; d = HASH[3]; e = HASH[4]; f = HASH[5]; g = HASH[6]; h = HASH[7];
    for (var j = 0; j < 64; j++) {
      if (j < 16) {
        W[j] = m[j + i];
      } else {
        W[j] = safe_add(safe_add(safe_add(Gamma1256(W[j - 2]), W[j - 7]), Gamma0256(W[j - 15])), W[j - 16]);
      }
      T1 = safe_add(safe_add(safe_add(safe_add(h, Sigma1256(e)), Ch(e, f, g)), K[j]), W[j]);
      T2 = safe_add(Sigma0256(a), Maj(a, b, c));
      h = g; g = f; f = e; e = safe_add(d, T1); d = c; c = b; b = a; a = safe_add(T1, T2);
    }
    HASH[0] = safe_add(a, HASH[0]); HASH[1] = safe_add(b, HASH[1]); HASH[2] = safe_add(c, HASH[2]); HASH[3] = safe_add(d, HASH[3]);
    HASH[4] = safe_add(e, HASH[4]); HASH[5] = safe_add(f, HASH[5]); HASH[6] = safe_add(g, HASH[6]); HASH[7] = safe_add(h, HASH[7]);
  }
  return HASH;
};

module.exports = function sha256(buf) {
  return helpers.hash(buf, core_sha256, 32, true);
};

},{"./helpers":26}],32:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        throw TypeError('Uncaught, unspecified "error" event.');
      }
      return false;
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      console.trace();
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],33:[function(require,module,exports){
var http = module.exports;
var EventEmitter = require('events').EventEmitter;
var Request = require('./lib/request');

http.request = function (params, cb) {
    if (!params) params = {};
    if (!params.host && !params.port) {
        params.port = parseInt(window.location.port, 10);
    }
    if (!params.host && params.hostname) {
        params.host = params.hostname;
    }
    
    if (!params.scheme) params.scheme = window.location.protocol.split(':')[0];
    if (!params.host) {
        params.host = window.location.hostname || window.location.host;
    }
    if (/:/.test(params.host)) {
        if (!params.port) {
            params.port = params.host.split(':')[1];
        }
        params.host = params.host.split(':')[0];
    }
    if (!params.port) params.port = params.scheme == 'https' ? 443 : 80;
    
    var req = new Request(new xhrHttp, params);
    if (cb) req.on('response', cb);
    return req;
};

http.get = function (params, cb) {
    params.method = 'GET';
    var req = http.request(params, cb);
    req.end();
    return req;
};

http.Agent = function () {};
http.Agent.defaultMaxSockets = 4;

var xhrHttp = (function () {
    if (typeof window === 'undefined') {
        throw new Error('no window object present');
    }
    else if (window.XMLHttpRequest) {
        return window.XMLHttpRequest;
    }
    else if (window.ActiveXObject) {
        var axs = [
            'Msxml2.XMLHTTP.6.0',
            'Msxml2.XMLHTTP.3.0',
            'Microsoft.XMLHTTP'
        ];
        for (var i = 0; i < axs.length; i++) {
            try {
                var ax = new(window.ActiveXObject)(axs[i]);
                return function () {
                    if (ax) {
                        var ax_ = ax;
                        ax = null;
                        return ax_;
                    }
                    else {
                        return new(window.ActiveXObject)(axs[i]);
                    }
                };
            }
            catch (e) {}
        }
        throw new Error('ajax not supported in this browser')
    }
    else {
        throw new Error('ajax not supported in this browser');
    }
})();

},{"./lib/request":34,"events":32}],34:[function(require,module,exports){
var Stream = require('stream');
var Response = require('./response');
var Base64 = require('Base64');
var inherits = require('inherits');

var Request = module.exports = function (xhr, params) {
    var self = this;
    self.writable = true;
    self.xhr = xhr;
    self.body = [];
    
    self.uri = (params.scheme || 'http') + '://'
        + params.host
        + (params.port ? ':' + params.port : '')
        + (params.path || '/')
    ;
    
    try { xhr.withCredentials = true }
    catch (e) {}
    
    xhr.open(
        params.method || 'GET',
        self.uri,
        true
    );
    
    if (params.headers) {
        var keys = objectKeys(params.headers);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (!self.isSafeRequestHeader(key)) continue;
            var value = params.headers[key];
            if (isArray(value)) {
                for (var j = 0; j < value.length; j++) {
                    xhr.setRequestHeader(key, value[j]);
                }
            }
            else xhr.setRequestHeader(key, value)
        }
    }
    
    if (params.auth) {
        //basic auth
        this.setHeader('Authorization', 'Basic ' + Base64.btoa(params.auth));
    }

    var res = new Response;
    res.on('close', function () {
        self.emit('close');
    });
    
    res.on('ready', function () {
        self.emit('response', res);
    });
    
    xhr.onreadystatechange = function () {
        res.handle(xhr);
    };
};

inherits(Request, Stream);

Request.prototype.setHeader = function (key, value) {
    if (isArray(value)) {
        for (var i = 0; i < value.length; i++) {
            this.xhr.setRequestHeader(key, value[i]);
        }
    }
    else {
        this.xhr.setRequestHeader(key, value);
    }
};

Request.prototype.write = function (s) {
    this.body.push(s);
};

Request.prototype.destroy = function (s) {
    this.xhr.abort();
    this.emit('close');
};

Request.prototype.end = function (s) {
    if (s !== undefined) this.body.push(s);
    if (this.body.length === 0) {
        this.xhr.send('');
    }
    else if (typeof this.body[0] === 'string') {
        this.xhr.send(this.body.join(''));
    }
    else if (isArray(this.body[0])) {
        var body = [];
        for (var i = 0; i < this.body.length; i++) {
            body.push.apply(body, this.body[i]);
        }
        this.xhr.send(body);
    }
    else if (/Array/.test(Object.prototype.toString.call(this.body[0]))) {
        var len = 0;
        for (var i = 0; i < this.body.length; i++) {
            len += this.body[i].length;
        }
        var body = new(this.body[0].constructor)(len);
        var k = 0;
        
        for (var i = 0; i < this.body.length; i++) {
            var b = this.body[i];
            for (var j = 0; j < b.length; j++) {
                body[k++] = b[j];
            }
        }
        this.xhr.send(body);
    }
    else {
        var body = '';
        for (var i = 0; i < this.body.length; i++) {
            body += this.body[i].toString();
        }
        this.xhr.send(body);
    }
};

// Taken from http://dxr.mozilla.org/mozilla/mozilla-central/content/base/src/nsXMLHttpRequest.cpp.html
Request.unsafeHeaders = [
    "accept-charset",
    "accept-encoding",
    "access-control-request-headers",
    "access-control-request-method",
    "connection",
    "content-length",
    "cookie",
    "cookie2",
    "content-transfer-encoding",
    "date",
    "expect",
    "host",
    "keep-alive",
    "origin",
    "referer",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
    "user-agent",
    "via"
];

Request.prototype.isSafeRequestHeader = function (headerName) {
    if (!headerName) return false;
    return indexOf(Request.unsafeHeaders, headerName.toLowerCase()) === -1;
};

var objectKeys = Object.keys || function (obj) {
    var keys = [];
    for (var key in obj) keys.push(key);
    return keys;
};

var isArray = Array.isArray || function (xs) {
    return Object.prototype.toString.call(xs) === '[object Array]';
};

var indexOf = function (xs, x) {
    if (xs.indexOf) return xs.indexOf(x);
    for (var i = 0; i < xs.length; i++) {
        if (xs[i] === x) return i;
    }
    return -1;
};

},{"./response":35,"Base64":36,"inherits":37,"stream":49}],35:[function(require,module,exports){
var Stream = require('stream');
var util = require('util');

var Response = module.exports = function (res) {
    this.offset = 0;
    this.readable = true;
};

util.inherits(Response, Stream);

var capable = {
    streaming : true,
    status2 : true
};

function parseHeaders (res) {
    var lines = res.getAllResponseHeaders().split(/\r?\n/);
    var headers = {};
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (line === '') continue;
        
        var m = line.match(/^([^:]+):\s*(.*)/);
        if (m) {
            var key = m[1].toLowerCase(), value = m[2];
            
            if (headers[key] !== undefined) {
            
                if (isArray(headers[key])) {
                    headers[key].push(value);
                }
                else {
                    headers[key] = [ headers[key], value ];
                }
            }
            else {
                headers[key] = value;
            }
        }
        else {
            headers[line] = true;
        }
    }
    return headers;
}

Response.prototype.getResponse = function (xhr) {
    var respType = String(xhr.responseType).toLowerCase();
    if (respType === 'blob') return xhr.responseBlob || xhr.response;
    if (respType === 'arraybuffer') return xhr.response;
    return xhr.responseText;
}

Response.prototype.getHeader = function (key) {
    return this.headers[key.toLowerCase()];
};

Response.prototype.handle = function (res) {
    if (res.readyState === 2 && capable.status2) {
        try {
            this.statusCode = res.status;
            this.headers = parseHeaders(res);
        }
        catch (err) {
            capable.status2 = false;
        }
        
        if (capable.status2) {
            this.emit('ready');
        }
    }
    else if (capable.streaming && res.readyState === 3) {
        try {
            if (!this.statusCode) {
                this.statusCode = res.status;
                this.headers = parseHeaders(res);
                this.emit('ready');
            }
        }
        catch (err) {}
        
        try {
            this._emitData(res);
        }
        catch (err) {
            capable.streaming = false;
        }
    }
    else if (res.readyState === 4) {
        if (!this.statusCode) {
            this.statusCode = res.status;
            this.emit('ready');
        }
        this._emitData(res);
        
        if (res.error) {
            this.emit('error', this.getResponse(res));
        }
        else this.emit('end');
        
        this.emit('close');
    }
};

Response.prototype._emitData = function (res) {
    var respBody = this.getResponse(res);
    if (respBody.toString().match(/ArrayBuffer/)) {
        this.emit('data', new Uint8Array(respBody, this.offset));
        this.offset = respBody.byteLength;
        return;
    }
    if (respBody.length > this.offset) {
        this.emit('data', respBody.slice(this.offset));
        this.offset = respBody.length;
    }
};

var isArray = Array.isArray || function (xs) {
    return Object.prototype.toString.call(xs) === '[object Array]';
};

},{"stream":49,"util":58}],36:[function(require,module,exports){
;(function () {

  var object = typeof exports != 'undefined' ? exports : this; // #8: web workers
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

  function InvalidCharacterError(message) {
    this.message = message;
  }
  InvalidCharacterError.prototype = new Error;
  InvalidCharacterError.prototype.name = 'InvalidCharacterError';

  // encoder
  // [https://gist.github.com/999166] by [https://github.com/nignag]
  object.btoa || (
  object.btoa = function (input) {
    for (
      // initialize result and counter
      var block, charCode, idx = 0, map = chars, output = '';
      // if the next input index does not exist:
      //   change the mapping table to "="
      //   check if d has no fractional digits
      input.charAt(idx | 0) || (map = '=', idx % 1);
      // "8 - idx % 1 * 8" generates the sequence 2, 4, 6, 8
      output += map.charAt(63 & block >> 8 - idx % 1 * 8)
    ) {
      charCode = input.charCodeAt(idx += 3/4);
      if (charCode > 0xFF) {
        throw new InvalidCharacterError("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
      }
      block = block << 8 | charCode;
    }
    return output;
  });

  // decoder
  // [https://gist.github.com/1020396] by [https://github.com/atk]
  object.atob || (
  object.atob = function (input) {
    input = input.replace(/=+$/, '')
    if (input.length % 4 == 1) {
      throw new InvalidCharacterError("'atob' failed: The string to be decoded is not correctly encoded.");
    }
    for (
      // initialize result and counters
      var bc = 0, bs, buffer, idx = 0, output = '';
      // get next character
      buffer = input.charAt(idx++);
      // character found in table? initialize bit storage and add its ascii value;
      ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
        // and if not first of each 4 characters,
        // convert the first 8 bits to one ascii character
        bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
    ) {
      // try to find character in table (0-63, not found => -1)
      buffer = chars.indexOf(buffer);
    }
    return output;
  });

}());

},{}],37:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],38:[function(require,module,exports){
require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"PcZj9L":[function(require,module,exports){
var TA = require('typedarray')
var xDataView = typeof DataView === 'undefined'
  ? TA.DataView : DataView
var xArrayBuffer = typeof ArrayBuffer === 'undefined'
  ? TA.ArrayBuffer : ArrayBuffer
var xUint8Array = typeof Uint8Array === 'undefined'
  ? TA.Uint8Array : Uint8Array

exports.Buffer = Buffer
exports.SlowBuffer = Buffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192

var browserSupport

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 *
 * Firefox is a special case because it doesn't allow augmenting "native" object
 * instances. See `ProxyBuffer` below for more details.
 */
function Buffer (subject, encoding) {
  var type = typeof subject

  // Work-around: node's base64 implementation
  // allows for non-padded strings while base64-js
  // does not..
  if (encoding === 'base64' && type === 'string') {
    subject = stringtrim(subject)
    while (subject.length % 4 !== 0) {
      subject = subject + '='
    }
  }

  // Find the length
  var length
  if (type === 'number')
    length = coerce(subject)
  else if (type === 'string')
    length = Buffer.byteLength(subject, encoding)
  else if (type === 'object')
    length = coerce(subject.length) // Assume object is an array
  else
    throw new Error('First argument needs to be a number, array or string.')

  var buf = augment(new xUint8Array(length))
  if (Buffer.isBuffer(subject)) {
    // Speed optimization -- use set if we're copying from a Uint8Array
    buf.set(subject)
  } else if (isArrayIsh(subject)) {
    // Treat array-ish objects as a byte array.
    for (var i = 0; i < length; i++) {
      if (Buffer.isBuffer(subject))
        buf[i] = subject.readUInt8(i)
      else
        buf[i] = subject[i]
    }
  } else if (type === 'string') {
    buf.write(subject, 0, encoding)
  }

  return buf
}

// STATIC METHODS
// ==============

Buffer.isEncoding = function(encoding) {
  switch ((encoding + '').toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
    case 'raw':
      return true

    default:
      return false
  }
}

Buffer.isBuffer = function isBuffer (b) {
  return b && b._isBuffer
}

Buffer.byteLength = function (str, encoding) {
  switch (encoding || 'utf8') {
    case 'hex':
      return str.length / 2

    case 'utf8':
    case 'utf-8':
      return utf8ToBytes(str).length

    case 'ascii':
    case 'binary':
      return str.length

    case 'base64':
      return base64ToBytes(str).length

    default:
      throw new Error('Unknown encoding')
  }
}

Buffer.concat = function (list, totalLength) {
  if (!Array.isArray(list)) {
    throw new Error('Usage: Buffer.concat(list, [totalLength])\n' +
        'list should be an Array.')
  }

  var i
  var buf

  if (list.length === 0) {
    return new Buffer(0)
  } else if (list.length === 1) {
    return list[0]
  }

  if (typeof totalLength !== 'number') {
    totalLength = 0
    for (i = 0; i < list.length; i++) {
      buf = list[i]
      totalLength += buf.length
    }
  }

  var buffer = new Buffer(totalLength)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    buf = list[i]
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

// INSTANCE METHODS
// ================

function _hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) {
    throw new Error('Invalid hex string')
  }
  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var byte = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(byte)) throw new Error('Invalid hex string')
    buf[offset + i] = byte
  }
  Buffer._charsWritten = i * 2
  return i
}

function _utf8Write (buf, string, offset, length) {
  var bytes, pos
  return Buffer._charsWritten = blitBuffer(utf8ToBytes(string), buf, offset, length)
}

function _asciiWrite (buf, string, offset, length) {
  var bytes, pos
  return Buffer._charsWritten = blitBuffer(asciiToBytes(string), buf, offset, length)
}

function _binaryWrite (buf, string, offset, length) {
  return _asciiWrite(buf, string, offset, length)
}

function _base64Write (buf, string, offset, length) {
  var bytes, pos
  return Buffer._charsWritten = blitBuffer(base64ToBytes(string), buf, offset, length)
}

function BufferWrite (string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length
      length = undefined
    }
  } else {  // legacy
    var swap = encoding
    encoding = offset
    offset = length
    length = swap
  }

  offset = Number(offset) || 0
  var remaining = this.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase()

  switch (encoding) {
    case 'hex':
      return _hexWrite(this, string, offset, length)

    case 'utf8':
    case 'utf-8':
      return _utf8Write(this, string, offset, length)

    case 'ascii':
      return _asciiWrite(this, string, offset, length)

    case 'binary':
      return _binaryWrite(this, string, offset, length)

    case 'base64':
      return _base64Write(this, string, offset, length)

    default:
      throw new Error('Unknown encoding')
  }
}

function BufferToString (encoding, start, end) {
  var self = (this instanceof ProxyBuffer)
    ? this._proxy
    : this

  encoding = String(encoding || 'utf8').toLowerCase()
  start = Number(start) || 0
  end = (end !== undefined)
    ? Number(end)
    : end = self.length

  // Fastpath empty strings
  if (end === start)
    return ''

  switch (encoding) {
    case 'hex':
      return _hexSlice(self, start, end)

    case 'utf8':
    case 'utf-8':
      return _utf8Slice(self, start, end)

    case 'ascii':
      return _asciiSlice(self, start, end)

    case 'binary':
      return _binarySlice(self, start, end)

    case 'base64':
      return _base64Slice(self, start, end)

    default:
      throw new Error('Unknown encoding')
  }
}

function BufferToJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this, 0)
  }
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
function BufferCopy (target, target_start, start, end) {
  var source = this

  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (!target_start) target_start = 0

  // Copy 0 bytes; we're done
  if (end === start) return
  if (target.length === 0 || source.length === 0) return

  // Fatal error conditions
  if (end < start)
    throw new Error('sourceEnd < sourceStart')
  if (target_start < 0 || target_start >= target.length)
    throw new Error('targetStart out of bounds')
  if (start < 0 || start >= source.length)
    throw new Error('sourceStart out of bounds')
  if (end < 0 || end > source.length)
    throw new Error('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length)
    end = this.length
  if (target.length - target_start < end - start)
    end = target.length - target_start + start

  // copy!
  for (var i = 0; i < end - start; i++)
    target[i + target_start] = this[i + start]
}

function _base64Slice (buf, start, end) {
  var bytes = buf.slice(start, end)
  return require('base64-js').fromByteArray(bytes)
}

function _utf8Slice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  var tmp = ''
  var i = 0
  while (i < bytes.length) {
    if (bytes[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(bytes[i])
      tmp = ''
    } else {
      tmp += '%' + bytes[i].toString(16)
    }

    i++
  }

  return res + decodeUtf8Char(tmp)
}

function _asciiSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var ret = ''
  for (var i = 0; i < bytes.length; i++)
    ret += String.fromCharCode(bytes[i])
  return ret
}

function _binarySlice (buf, start, end) {
  return _asciiSlice(buf, start, end)
}

function _hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

// TODO: add test that modifying the new buffer slice will modify memory in the
// original buffer! Use code from:
// http://nodejs.org/api/buffer.html#buffer_buf_slice_start_end
function BufferSlice (start, end) {
  var len = this.length
  start = clamp(start, len, 0)
  end = clamp(end, len, len)
  return augment(this.subarray(start, end)) // Uint8Array built-in method
}

function BufferReadUInt8 (offset, noAssert) {
  var buf = this
  if (!noAssert) {
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < buf.length, 'Trying to read beyond buffer length')
  }

  if (offset >= buf.length)
    return

  return buf[offset]
}

function _readUInt16 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof (littleEndian) === 'boolean',
        'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len) {
    return
  } else if (offset + 1 === len) {
    var dv = new xDataView(new xArrayBuffer(2))
    dv.setUint8(0, buf[len - 1])
    return dv.getUint16(0, littleEndian)
  } else {
    return buf._dataview.getUint16(offset, littleEndian)
  }
}

function BufferReadUInt16LE (offset, noAssert) {
  return _readUInt16(this, offset, true, noAssert)
}

function BufferReadUInt16BE (offset, noAssert) {
  return _readUInt16(this, offset, false, noAssert)
}

function _readUInt32 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof (littleEndian) === 'boolean',
        'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len) {
    return
  } else if (offset + 3 >= len) {
    var dv = new xDataView(new xArrayBuffer(4))
    for (var i = 0; i + offset < len; i++) {
      dv.setUint8(i, buf[i + offset])
    }
    return dv.getUint32(0, littleEndian)
  } else {
    return buf._dataview.getUint32(offset, littleEndian)
  }
}

function BufferReadUInt32LE (offset, noAssert) {
  return _readUInt32(this, offset, true, noAssert)
}

function BufferReadUInt32BE (offset, noAssert) {
  return _readUInt32(this, offset, false, noAssert)
}

function BufferReadInt8 (offset, noAssert) {
  var buf = this
  if (!noAssert) {
    assert(offset !== undefined && offset !== null,
        'missing offset')
    assert(offset < buf.length, 'Trying to read beyond buffer length')
  }

  if (offset >= buf.length)
    return

  return buf._dataview.getInt8(offset)
}

function _readInt16 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof (littleEndian) === 'boolean',
        'missing or invalid endian')
    assert(offset !== undefined && offset !== null,
        'missing offset')
    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len) {
    return
  } else if (offset + 1 === len) {
    var dv = new xDataView(new xArrayBuffer(2))
    dv.setUint8(0, buf[len - 1])
    return dv.getInt16(0, littleEndian)
  } else {
    return buf._dataview.getInt16(offset, littleEndian)
  }
}

function BufferReadInt16LE (offset, noAssert) {
  return _readInt16(this, offset, true, noAssert)
}

function BufferReadInt16BE (offset, noAssert) {
  return _readInt16(this, offset, false, noAssert)
}

function _readInt32 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof (littleEndian) === 'boolean',
        'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len) {
    return
  } else if (offset + 3 >= len) {
    var dv = new xDataView(new xArrayBuffer(4))
    for (var i = 0; i + offset < len; i++) {
      dv.setUint8(i, buf[i + offset])
    }
    return dv.getInt32(0, littleEndian)
  } else {
    return buf._dataview.getInt32(offset, littleEndian)
  }
}

function BufferReadInt32LE (offset, noAssert) {
  return _readInt32(this, offset, true, noAssert)
}

function BufferReadInt32BE (offset, noAssert) {
  return _readInt32(this, offset, false, noAssert)
}

function _readFloat (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof (littleEndian) === 'boolean',
        'missing or invalid endian')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  return buf._dataview.getFloat32(offset, littleEndian)
}

function BufferReadFloatLE (offset, noAssert) {
  return _readFloat(this, offset, true, noAssert)
}

function BufferReadFloatBE (offset, noAssert) {
  return _readFloat(this, offset, false, noAssert)
}

function _readDouble (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof (littleEndian) === 'boolean',
        'missing or invalid endian')
    assert(offset + 7 < buf.length, 'Trying to read beyond buffer length')
  }

  return buf._dataview.getFloat64(offset, littleEndian)
}

function BufferReadDoubleLE (offset, noAssert) {
  return _readDouble(this, offset, true, noAssert)
}

function BufferReadDoubleBE (offset, noAssert) {
  return _readDouble(this, offset, false, noAssert)
}

function BufferWriteUInt8 (value, offset, noAssert) {
  var buf = this
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xff)
  }

  if (offset >= buf.length) return

  buf[offset] = value
}

function _writeUInt16 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof (littleEndian) === 'boolean',
        'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xffff)
  }

  var len = buf.length
  if (offset >= len) {
    return
  } else if (offset + 1 === len) {
    var dv = new xDataView(new xArrayBuffer(2))
    dv.setUint16(0, value, littleEndian)
    buf[offset] = dv.getUint8(0)
  } else {
    buf._dataview.setUint16(offset, value, littleEndian)
  }
}

function BufferWriteUInt16LE (value, offset, noAssert) {
  _writeUInt16(this, value, offset, true, noAssert)
}

function BufferWriteUInt16BE (value, offset, noAssert) {
  _writeUInt16(this, value, offset, false, noAssert)
}

function _writeUInt32 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof (littleEndian) === 'boolean',
        'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xffffffff)
  }

  var len = buf.length
  if (offset >= len) {
    return
  } else if (offset + 3 >= len) {
    var dv = new xDataView(new xArrayBuffer(4))
    dv.setUint32(0, value, littleEndian)
    for (var i = 0; i + offset < len; i++) {
      buf[i + offset] = dv.getUint8(i)
    }
  } else {
    buf._dataview.setUint32(offset, value, littleEndian)
  }
}

function BufferWriteUInt32LE (value, offset, noAssert) {
  _writeUInt32(this, value, offset, true, noAssert)
}

function BufferWriteUInt32BE (value, offset, noAssert) {
  _writeUInt32(this, value, offset, false, noAssert)
}

function BufferWriteInt8 (value, offset, noAssert) {
  var buf = this
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7f, -0x80)
  }

  if (offset >= buf.length) return

  buf._dataview.setInt8(offset, value)
}

function _writeInt16 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof (littleEndian) === 'boolean',
        'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7fff, -0x8000)
  }

  var len = buf.length
  if (offset >= len) {
    return
  } else if (offset + 1 === len) {
    var dv = new xDataView(new xArrayBuffer(2))
    dv.setInt16(0, value, littleEndian)
    buf[offset] = dv.getUint8(0)
  } else {
    buf._dataview.setInt16(offset, value, littleEndian)
  }
}

function BufferWriteInt16LE (value, offset, noAssert) {
  _writeInt16(this, value, offset, true, noAssert)
}

function BufferWriteInt16BE (value, offset, noAssert) {
  _writeInt16(this, value, offset, false, noAssert)
}

function _writeInt32 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof (littleEndian) === 'boolean',
        'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7fffffff, -0x80000000)
  }

  var len = buf.length
  if (offset >= len) {
    return
  } else if (offset + 3 >= len) {
    var dv = new xDataView(new xArrayBuffer(4))
    dv.setInt32(0, value, littleEndian)
    for (var i = 0; i + offset < len; i++) {
      buf[i + offset] = dv.getUint8(i)
    }
  } else {
    buf._dataview.setInt32(offset, value, littleEndian)
  }
}

function BufferWriteInt32LE (value, offset, noAssert) {
  _writeInt32(this, value, offset, true, noAssert)
}

function BufferWriteInt32BE (value, offset, noAssert) {
  _writeInt32(this, value, offset, false, noAssert)
}

function _writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof (littleEndian) === 'boolean',
        'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
    verifIEEE754(value, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }

  var len = buf.length
  if (offset >= len) {
    return
  } else if (offset + 3 >= len) {
    var dv = new xDataView(new xArrayBuffer(4))
    dv.setFloat32(0, value, littleEndian)
    for (var i = 0; i + offset < len; i++) {
      buf[i + offset] = dv.getUint8(i)
    }
  } else {
    buf._dataview.setFloat32(offset, value, littleEndian)
  }
}

function BufferWriteFloatLE (value, offset, noAssert) {
  _writeFloat(this, value, offset, true, noAssert)
}

function BufferWriteFloatBE (value, offset, noAssert) {
  _writeFloat(this, value, offset, false, noAssert)
}

function _writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof (littleEndian) === 'boolean',
        'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 7 < buf.length,
        'Trying to write beyond buffer length')
    verifIEEE754(value, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }

  var len = buf.length
  if (offset >= len) {
    return
  } else if (offset + 7 >= len) {
    var dv = new xDataView(new xArrayBuffer(8))
    dv.setFloat64(0, value, littleEndian)
    for (var i = 0; i + offset < len; i++) {
      buf[i + offset] = dv.getUint8(i)
    }
  } else {
    buf._dataview.setFloat64(offset, value, littleEndian)
  }
}

function BufferWriteDoubleLE (value, offset, noAssert) {
  _writeDouble(this, value, offset, true, noAssert)
}

function BufferWriteDoubleBE (value, offset, noAssert) {
  _writeDouble(this, value, offset, false, noAssert)
}

// fill(value, start=0, end=buffer.length)
function BufferFill (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (typeof value === 'string') {
    value = value.charCodeAt(0)
  }

  if (typeof value !== 'number' || isNaN(value)) {
    throw new Error('value is not a number')
  }

  if (end < start) throw new Error('end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  if (start < 0 || start >= this.length) {
    throw new Error('start out of bounds')
  }

  if (end < 0 || end > this.length) {
    throw new Error('end out of bounds')
  }

  for (var i = start; i < end; i++) {
    this[i] = value
  }
}

function BufferInspect () {
  var out = []
  var len = this.length
  for (var i = 0; i < len; i++) {
    out[i] = toHex(this[i])
    if (i === exports.INSPECT_MAX_BYTES) {
      out[i + 1] = '...'
      break
    }
  }
  return '<Buffer ' + out.join(' ') + '>'
}

// Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
// Added in Node 0.12.
function BufferToArrayBuffer () {
  return (new Buffer(this)).buffer
}


// HELPER FUNCTIONS
// ================

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

/**
 * Check to see if the browser supports augmenting a `Uint8Array` instance.
 * @return {boolean}
 */
function _browserSupport () {
  var arr = new xUint8Array(0)
  arr.foo = function () { return 42 }

  try {
    return (42 === arr.foo())
  } catch (e) {
    return false
  }
}

/**
 * Class: ProxyBuffer
 * ==================
 *
 * Only used in Firefox, since Firefox does not allow augmenting "native"
 * objects (like Uint8Array instances) with new properties for some unknown
 * (probably silly) reason. So we'll use an ES6 Proxy (supported since
 * Firefox 18) to wrap the Uint8Array instance without actually adding any
 * properties to it.
 *
 * Instances of this "fake" Buffer class are the "target" of the
 * ES6 Proxy (see `augment` function).
 *
 * We couldn't just use the `Uint8Array` as the target of the `Proxy` because
 * Proxies have an important limitation on trapping the `toString` method.
 * `Object.prototype.toString.call(proxy)` gets called whenever something is
 * implicitly cast to a String. Unfortunately, with a `Proxy` this
 * unconditionally returns `Object.prototype.toString.call(target)` which would
 * always return "[object Uint8Array]" if we used the `Uint8Array` instance as
 * the target. And, remember, in Firefox we cannot redefine the `Uint8Array`
 * instance's `toString` method.
 *
 * So, we use this `ProxyBuffer` class as the proxy's "target". Since this class
 * has its own custom `toString` method, it will get called whenever `toString`
 * gets called, implicitly or explicitly, on the `Proxy` instance.
 *
 * We also have to define the Uint8Array methods `subarray` and `set` on
 * `ProxyBuffer` because if we didn't then `proxy.subarray(0)` would have its
 * `this` set to `proxy` (a `Proxy` instance) which throws an exception in
 * Firefox which expects it to be a `TypedArray` instance.
 */
function ProxyBuffer (arr) {
  this._arr = arr

  if (arr.byteLength !== 0)
    this._dataview = new xDataView(arr.buffer, arr.byteOffset, arr.byteLength)
}

ProxyBuffer.prototype.write = BufferWrite
ProxyBuffer.prototype.toString = BufferToString
ProxyBuffer.prototype.toLocaleString = BufferToString
ProxyBuffer.prototype.toJSON = BufferToJSON
ProxyBuffer.prototype.copy = BufferCopy
ProxyBuffer.prototype.slice = BufferSlice
ProxyBuffer.prototype.readUInt8 = BufferReadUInt8
ProxyBuffer.prototype.readUInt16LE = BufferReadUInt16LE
ProxyBuffer.prototype.readUInt16BE = BufferReadUInt16BE
ProxyBuffer.prototype.readUInt32LE = BufferReadUInt32LE
ProxyBuffer.prototype.readUInt32BE = BufferReadUInt32BE
ProxyBuffer.prototype.readInt8 = BufferReadInt8
ProxyBuffer.prototype.readInt16LE = BufferReadInt16LE
ProxyBuffer.prototype.readInt16BE = BufferReadInt16BE
ProxyBuffer.prototype.readInt32LE = BufferReadInt32LE
ProxyBuffer.prototype.readInt32BE = BufferReadInt32BE
ProxyBuffer.prototype.readFloatLE = BufferReadFloatLE
ProxyBuffer.prototype.readFloatBE = BufferReadFloatBE
ProxyBuffer.prototype.readDoubleLE = BufferReadDoubleLE
ProxyBuffer.prototype.readDoubleBE = BufferReadDoubleBE
ProxyBuffer.prototype.writeUInt8 = BufferWriteUInt8
ProxyBuffer.prototype.writeUInt16LE = BufferWriteUInt16LE
ProxyBuffer.prototype.writeUInt16BE = BufferWriteUInt16BE
ProxyBuffer.prototype.writeUInt32LE = BufferWriteUInt32LE
ProxyBuffer.prototype.writeUInt32BE = BufferWriteUInt32BE
ProxyBuffer.prototype.writeInt8 = BufferWriteInt8
ProxyBuffer.prototype.writeInt16LE = BufferWriteInt16LE
ProxyBuffer.prototype.writeInt16BE = BufferWriteInt16BE
ProxyBuffer.prototype.writeInt32LE = BufferWriteInt32LE
ProxyBuffer.prototype.writeInt32BE = BufferWriteInt32BE
ProxyBuffer.prototype.writeFloatLE = BufferWriteFloatLE
ProxyBuffer.prototype.writeFloatBE = BufferWriteFloatBE
ProxyBuffer.prototype.writeDoubleLE = BufferWriteDoubleLE
ProxyBuffer.prototype.writeDoubleBE = BufferWriteDoubleBE
ProxyBuffer.prototype.fill = BufferFill
ProxyBuffer.prototype.inspect = BufferInspect
ProxyBuffer.prototype.toArrayBuffer = BufferToArrayBuffer
ProxyBuffer.prototype._isBuffer = true
ProxyBuffer.prototype.subarray = function () {
  return this._arr.subarray.apply(this._arr, arguments)
}
ProxyBuffer.prototype.set = function () {
  return this._arr.set.apply(this._arr, arguments)
}

var ProxyHandler = {
  get: function (target, name) {
    if (name in target) return target[name]
    else return target._arr[name]
  },
  set: function (target, name, value) {
    target._arr[name] = value
  }
}

function augment (arr) {
  if (browserSupport === undefined) {
    browserSupport = _browserSupport()
  }

  if (browserSupport) {
    // Augment the Uint8Array *instance* (not the class!) with Buffer methods
    arr.write = BufferWrite
    arr.toString = BufferToString
    arr.toLocaleString = BufferToString
    arr.toJSON = BufferToJSON
    arr.copy = BufferCopy
    arr.slice = BufferSlice
    arr.readUInt8 = BufferReadUInt8
    arr.readUInt16LE = BufferReadUInt16LE
    arr.readUInt16BE = BufferReadUInt16BE
    arr.readUInt32LE = BufferReadUInt32LE
    arr.readUInt32BE = BufferReadUInt32BE
    arr.readInt8 = BufferReadInt8
    arr.readInt16LE = BufferReadInt16LE
    arr.readInt16BE = BufferReadInt16BE
    arr.readInt32LE = BufferReadInt32LE
    arr.readInt32BE = BufferReadInt32BE
    arr.readFloatLE = BufferReadFloatLE
    arr.readFloatBE = BufferReadFloatBE
    arr.readDoubleLE = BufferReadDoubleLE
    arr.readDoubleBE = BufferReadDoubleBE
    arr.writeUInt8 = BufferWriteUInt8
    arr.writeUInt16LE = BufferWriteUInt16LE
    arr.writeUInt16BE = BufferWriteUInt16BE
    arr.writeUInt32LE = BufferWriteUInt32LE
    arr.writeUInt32BE = BufferWriteUInt32BE
    arr.writeInt8 = BufferWriteInt8
    arr.writeInt16LE = BufferWriteInt16LE
    arr.writeInt16BE = BufferWriteInt16BE
    arr.writeInt32LE = BufferWriteInt32LE
    arr.writeInt32BE = BufferWriteInt32BE
    arr.writeFloatLE = BufferWriteFloatLE
    arr.writeFloatBE = BufferWriteFloatBE
    arr.writeDoubleLE = BufferWriteDoubleLE
    arr.writeDoubleBE = BufferWriteDoubleBE
    arr.fill = BufferFill
    arr.inspect = BufferInspect
    arr.toArrayBuffer = BufferToArrayBuffer
    arr._isBuffer = true

    if (arr.byteLength !== 0)
      arr._dataview = new xDataView(arr.buffer, arr.byteOffset, arr.byteLength)

    return arr

  } else {
    // This is a browser that doesn't support augmenting the `Uint8Array`
    // instance (*ahem* Firefox) so use an ES6 `Proxy`.
    var proxyBuffer = new ProxyBuffer(arr)
    var proxy = new Proxy(proxyBuffer, ProxyHandler)
    proxyBuffer._proxy = proxy
    return proxy
  }
}

// slice(start, end)
function clamp (index, len, defaultValue) {
  if (typeof index !== 'number') return defaultValue
  index = ~~index;  // Coerce to integer.
  if (index >= len) return len
  if (index >= 0) return index
  index += len
  if (index >= 0) return index
  return 0
}

function coerce (length) {
  // Coerce length to a number (possibly NaN), round up
  // in case it's fractional (e.g. 123.456) then do a
  // double negate to coerce a NaN to 0. Easy, right?
  length = ~~Math.ceil(+length)
  return length < 0 ? 0 : length
}

function isArrayIsh (subject) {
  return Array.isArray(subject) || Buffer.isBuffer(subject) ||
      subject && typeof subject === 'object' &&
      typeof subject.length === 'number'
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++)
    if (str.charCodeAt(i) <= 0x7F)
      byteArray.push(str.charCodeAt(i))
    else {
      var h = encodeURIComponent(str.charAt(i)).substr(1).split('%')
      for (var j = 0; j < h.length; j++)
        byteArray.push(parseInt(h[j], 16))
    }

  return byteArray
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }

  return byteArray
}

function base64ToBytes (str) {
  return require('base64-js').toByteArray(str)
}

function blitBuffer (src, dst, offset, length) {
  var pos, i = 0
  while (i < length) {
    if ((i + offset >= dst.length) || (i >= src.length))
      break

    dst[i + offset] = src[i]
    i++
  }
  return i
}

function decodeUtf8Char (str) {
  try {
    return decodeURIComponent(str)
  } catch (err) {
    return String.fromCharCode(0xFFFD) // UTF 8 invalid char
  }
}

/*
 * We have to make sure that the value is a valid integer. This means that it
 * is non-negative. It has no fractional component and that it does not
 * exceed the maximum allowed value.
 *
 *      value           The number to check for validity
 *
 *      max             The maximum value
 */
function verifuint (value, max) {
  assert(typeof (value) == 'number', 'cannot write a non-number as a number')
  assert(value >= 0,
      'specified a negative value for writing an unsigned value')
  assert(value <= max, 'value is larger than maximum value for type')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

/*
 * A series of checks to make sure we actually have a signed 32-bit number
 */
function verifsint(value, max, min) {
  assert(typeof (value) == 'number', 'cannot write a non-number as a number')
  assert(value <= max, 'value larger than maximum allowed value')
  assert(value >= min, 'value smaller than minimum allowed value')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

function verifIEEE754(value, max, min) {
  assert(typeof (value) == 'number', 'cannot write a non-number as a number')
  assert(value <= max, 'value larger than maximum allowed value')
  assert(value >= min, 'value smaller than minimum allowed value')
}

function assert (test, message) {
  if (!test) throw new Error(message || 'Failed assertion')
}

},{"base64-js":3,"typedarray":4}],"native-buffer-browserify":[function(require,module,exports){
module.exports=require('PcZj9L');
},{}],3:[function(require,module,exports){
(function (exports) {
	'use strict';

	var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

	function b64ToByteArray(b64) {
		var i, j, l, tmp, placeHolders, arr;
	
		if (b64.length % 4 > 0) {
			throw 'Invalid string. Length must be a multiple of 4';
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		placeHolders = b64.indexOf('=');
		placeHolders = placeHolders > 0 ? b64.length - placeHolders : 0;

		// base64 is 4/3 + up to two characters of the original data
		arr = [];//new Uint8Array(b64.length * 3 / 4 - placeHolders);

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length;

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (lookup.indexOf(b64[i]) << 18) | (lookup.indexOf(b64[i + 1]) << 12) | (lookup.indexOf(b64[i + 2]) << 6) | lookup.indexOf(b64[i + 3]);
			arr.push((tmp & 0xFF0000) >> 16);
			arr.push((tmp & 0xFF00) >> 8);
			arr.push(tmp & 0xFF);
		}

		if (placeHolders === 2) {
			tmp = (lookup.indexOf(b64[i]) << 2) | (lookup.indexOf(b64[i + 1]) >> 4);
			arr.push(tmp & 0xFF);
		} else if (placeHolders === 1) {
			tmp = (lookup.indexOf(b64[i]) << 10) | (lookup.indexOf(b64[i + 1]) << 4) | (lookup.indexOf(b64[i + 2]) >> 2);
			arr.push((tmp >> 8) & 0xFF);
			arr.push(tmp & 0xFF);
		}

		return arr;
	}

	function uint8ToBase64(uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length;

		function tripletToBase64 (num) {
			return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F];
		};

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
			output += tripletToBase64(temp);
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1];
				output += lookup[temp >> 2];
				output += lookup[(temp << 4) & 0x3F];
				output += '==';
				break;
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1]);
				output += lookup[temp >> 10];
				output += lookup[(temp >> 4) & 0x3F];
				output += lookup[(temp << 2) & 0x3F];
				output += '=';
				break;
		}

		return output;
	}

	module.exports.toByteArray = b64ToByteArray;
	module.exports.fromByteArray = uint8ToBase64;
}());

},{}],4:[function(require,module,exports){
var undefined = (void 0); // Paranoia

// Beyond this value, index getters/setters (i.e. array[0], array[1]) are so slow to
// create, and consume so much memory, that the browser appears frozen.
var MAX_ARRAY_LENGTH = 1e5;

// Approximations of internal ECMAScript conversion functions
var ECMAScript = (function() {
  // Stash a copy in case other scripts modify these
  var opts = Object.prototype.toString,
      ophop = Object.prototype.hasOwnProperty;

  return {
    // Class returns internal [[Class]] property, used to avoid cross-frame instanceof issues:
    Class: function(v) { return opts.call(v).replace(/^\[object *|\]$/g, ''); },
    HasProperty: function(o, p) { return p in o; },
    HasOwnProperty: function(o, p) { return ophop.call(o, p); },
    IsCallable: function(o) { return typeof o === 'function'; },
    ToInt32: function(v) { return v >> 0; },
    ToUint32: function(v) { return v >>> 0; }
  };
}());

// Snapshot intrinsics
var LN2 = Math.LN2,
    abs = Math.abs,
    floor = Math.floor,
    log = Math.log,
    min = Math.min,
    pow = Math.pow,
    round = Math.round;

// ES5: lock down object properties
function configureProperties(obj) {
  if (getOwnPropertyNames && defineProperty) {
    var props = getOwnPropertyNames(obj), i;
    for (i = 0; i < props.length; i += 1) {
      defineProperty(obj, props[i], {
        value: obj[props[i]],
        writable: false,
        enumerable: false,
        configurable: false
      });
    }
  }
}

// emulate ES5 getter/setter API using legacy APIs
// http://blogs.msdn.com/b/ie/archive/2010/09/07/transitioning-existing-code-to-the-es5-getter-setter-apis.aspx
// (second clause tests for Object.defineProperty() in IE<9 that only supports extending DOM prototypes, but
// note that IE<9 does not support __defineGetter__ or __defineSetter__ so it just renders the method harmless)
var defineProperty = Object.defineProperty || function(o, p, desc) {
  if (!o === Object(o)) throw new TypeError("Object.defineProperty called on non-object");
  if (ECMAScript.HasProperty(desc, 'get') && Object.prototype.__defineGetter__) { Object.prototype.__defineGetter__.call(o, p, desc.get); }
  if (ECMAScript.HasProperty(desc, 'set') && Object.prototype.__defineSetter__) { Object.prototype.__defineSetter__.call(o, p, desc.set); }
  if (ECMAScript.HasProperty(desc, 'value')) { o[p] = desc.value; }
  return o;
};

var getOwnPropertyNames = Object.getOwnPropertyNames || function getOwnPropertyNames(o) {
  if (o !== Object(o)) throw new TypeError("Object.getOwnPropertyNames called on non-object");
  var props = [], p;
  for (p in o) {
    if (ECMAScript.HasOwnProperty(o, p)) {
      props.push(p);
    }
  }
  return props;
};

// ES5: Make obj[index] an alias for obj._getter(index)/obj._setter(index, value)
// for index in 0 ... obj.length
function makeArrayAccessors(obj) {
  if (!defineProperty) { return; }

  if (obj.length > MAX_ARRAY_LENGTH) throw new RangeError("Array too large for polyfill");

  function makeArrayAccessor(index) {
    defineProperty(obj, index, {
      'get': function() { return obj._getter(index); },
      'set': function(v) { obj._setter(index, v); },
      enumerable: true,
      configurable: false
    });
  }

  var i;
  for (i = 0; i < obj.length; i += 1) {
    makeArrayAccessor(i);
  }
}

// Internal conversion functions:
//    pack<Type>()   - take a number (interpreted as Type), output a byte array
//    unpack<Type>() - take a byte array, output a Type-like number

function as_signed(value, bits) { var s = 32 - bits; return (value << s) >> s; }
function as_unsigned(value, bits) { var s = 32 - bits; return (value << s) >>> s; }

function packI8(n) { return [n & 0xff]; }
function unpackI8(bytes) { return as_signed(bytes[0], 8); }

function packU8(n) { return [n & 0xff]; }
function unpackU8(bytes) { return as_unsigned(bytes[0], 8); }

function packU8Clamped(n) { n = round(Number(n)); return [n < 0 ? 0 : n > 0xff ? 0xff : n & 0xff]; }

function packI16(n) { return [(n >> 8) & 0xff, n & 0xff]; }
function unpackI16(bytes) { return as_signed(bytes[0] << 8 | bytes[1], 16); }

function packU16(n) { return [(n >> 8) & 0xff, n & 0xff]; }
function unpackU16(bytes) { return as_unsigned(bytes[0] << 8 | bytes[1], 16); }

function packI32(n) { return [(n >> 24) & 0xff, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]; }
function unpackI32(bytes) { return as_signed(bytes[0] << 24 | bytes[1] << 16 | bytes[2] << 8 | bytes[3], 32); }

function packU32(n) { return [(n >> 24) & 0xff, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]; }
function unpackU32(bytes) { return as_unsigned(bytes[0] << 24 | bytes[1] << 16 | bytes[2] << 8 | bytes[3], 32); }

function packIEEE754(v, ebits, fbits) {

  var bias = (1 << (ebits - 1)) - 1,
      s, e, f, ln,
      i, bits, str, bytes;

  function roundToEven(n) {
    var w = floor(n), f = n - w;
    if (f < 0.5)
      return w;
    if (f > 0.5)
      return w + 1;
    return w % 2 ? w + 1 : w;
  }

  // Compute sign, exponent, fraction
  if (v !== v) {
    // NaN
    // http://dev.w3.org/2006/webapi/WebIDL/#es-type-mapping
    e = (1 << ebits) - 1; f = pow(2, fbits - 1); s = 0;
  } else if (v === Infinity || v === -Infinity) {
    e = (1 << ebits) - 1; f = 0; s = (v < 0) ? 1 : 0;
  } else if (v === 0) {
    e = 0; f = 0; s = (1 / v === -Infinity) ? 1 : 0;
  } else {
    s = v < 0;
    v = abs(v);

    if (v >= pow(2, 1 - bias)) {
      e = min(floor(log(v) / LN2), 1023);
      f = roundToEven(v / pow(2, e) * pow(2, fbits));
      if (f / pow(2, fbits) >= 2) {
        e = e + 1;
        f = 1;
      }
      if (e > bias) {
        // Overflow
        e = (1 << ebits) - 1;
        f = 0;
      } else {
        // Normalized
        e = e + bias;
        f = f - pow(2, fbits);
      }
    } else {
      // Denormalized
      e = 0;
      f = roundToEven(v / pow(2, 1 - bias - fbits));
    }
  }

  // Pack sign, exponent, fraction
  bits = [];
  for (i = fbits; i; i -= 1) { bits.push(f % 2 ? 1 : 0); f = floor(f / 2); }
  for (i = ebits; i; i -= 1) { bits.push(e % 2 ? 1 : 0); e = floor(e / 2); }
  bits.push(s ? 1 : 0);
  bits.reverse();
  str = bits.join('');

  // Bits to bytes
  bytes = [];
  while (str.length) {
    bytes.push(parseInt(str.substring(0, 8), 2));
    str = str.substring(8);
  }
  return bytes;
}

function unpackIEEE754(bytes, ebits, fbits) {

  // Bytes to bits
  var bits = [], i, j, b, str,
      bias, s, e, f;

  for (i = bytes.length; i; i -= 1) {
    b = bytes[i - 1];
    for (j = 8; j; j -= 1) {
      bits.push(b % 2 ? 1 : 0); b = b >> 1;
    }
  }
  bits.reverse();
  str = bits.join('');

  // Unpack sign, exponent, fraction
  bias = (1 << (ebits - 1)) - 1;
  s = parseInt(str.substring(0, 1), 2) ? -1 : 1;
  e = parseInt(str.substring(1, 1 + ebits), 2);
  f = parseInt(str.substring(1 + ebits), 2);

  // Produce number
  if (e === (1 << ebits) - 1) {
    return f !== 0 ? NaN : s * Infinity;
  } else if (e > 0) {
    // Normalized
    return s * pow(2, e - bias) * (1 + f / pow(2, fbits));
  } else if (f !== 0) {
    // Denormalized
    return s * pow(2, -(bias - 1)) * (f / pow(2, fbits));
  } else {
    return s < 0 ? -0 : 0;
  }
}

function unpackF64(b) { return unpackIEEE754(b, 11, 52); }
function packF64(v) { return packIEEE754(v, 11, 52); }
function unpackF32(b) { return unpackIEEE754(b, 8, 23); }
function packF32(v) { return packIEEE754(v, 8, 23); }


//
// 3 The ArrayBuffer Type
//

(function() {

  /** @constructor */
  var ArrayBuffer = function ArrayBuffer(length) {
    length = ECMAScript.ToInt32(length);
    if (length < 0) throw new RangeError('ArrayBuffer size is not a small enough positive integer');

    this.byteLength = length;
    this._bytes = [];
    this._bytes.length = length;

    var i;
    for (i = 0; i < this.byteLength; i += 1) {
      this._bytes[i] = 0;
    }

    configureProperties(this);
  };

  exports.ArrayBuffer = exports.ArrayBuffer || ArrayBuffer;

  //
  // 4 The ArrayBufferView Type
  //

  // NOTE: this constructor is not exported
  /** @constructor */
  var ArrayBufferView = function ArrayBufferView() {
    //this.buffer = null;
    //this.byteOffset = 0;
    //this.byteLength = 0;
  };

  //
  // 5 The Typed Array View Types
  //

  function makeConstructor(bytesPerElement, pack, unpack) {
    // Each TypedArray type requires a distinct constructor instance with
    // identical logic, which this produces.

    var ctor;
    ctor = function(buffer, byteOffset, length) {
      var array, sequence, i, s;

      if (!arguments.length || typeof arguments[0] === 'number') {
        // Constructor(unsigned long length)
        this.length = ECMAScript.ToInt32(arguments[0]);
        if (length < 0) throw new RangeError('ArrayBufferView size is not a small enough positive integer');

        this.byteLength = this.length * this.BYTES_PER_ELEMENT;
        this.buffer = new ArrayBuffer(this.byteLength);
        this.byteOffset = 0;
      } else if (typeof arguments[0] === 'object' && arguments[0].constructor === ctor) {
        // Constructor(TypedArray array)
        array = arguments[0];

        this.length = array.length;
        this.byteLength = this.length * this.BYTES_PER_ELEMENT;
        this.buffer = new ArrayBuffer(this.byteLength);
        this.byteOffset = 0;

        for (i = 0; i < this.length; i += 1) {
          this._setter(i, array._getter(i));
        }
      } else if (typeof arguments[0] === 'object' &&
                 !(arguments[0] instanceof ArrayBuffer || ECMAScript.Class(arguments[0]) === 'ArrayBuffer')) {
        // Constructor(sequence<type> array)
        sequence = arguments[0];

        this.length = ECMAScript.ToUint32(sequence.length);
        this.byteLength = this.length * this.BYTES_PER_ELEMENT;
        this.buffer = new ArrayBuffer(this.byteLength);
        this.byteOffset = 0;

        for (i = 0; i < this.length; i += 1) {
          s = sequence[i];
          this._setter(i, Number(s));
        }
      } else if (typeof arguments[0] === 'object' &&
                 (arguments[0] instanceof ArrayBuffer || ECMAScript.Class(arguments[0]) === 'ArrayBuffer')) {
        // Constructor(ArrayBuffer buffer,
        //             optional unsigned long byteOffset, optional unsigned long length)
        this.buffer = buffer;

        this.byteOffset = ECMAScript.ToUint32(byteOffset);
        if (this.byteOffset > this.buffer.byteLength) {
          throw new RangeError("byteOffset out of range");
        }

        if (this.byteOffset % this.BYTES_PER_ELEMENT) {
          // The given byteOffset must be a multiple of the element
          // size of the specific type, otherwise an exception is raised.
          throw new RangeError("ArrayBuffer length minus the byteOffset is not a multiple of the element size.");
        }

        if (arguments.length < 3) {
          this.byteLength = this.buffer.byteLength - this.byteOffset;

          if (this.byteLength % this.BYTES_PER_ELEMENT) {
            throw new RangeError("length of buffer minus byteOffset not a multiple of the element size");
          }
          this.length = this.byteLength / this.BYTES_PER_ELEMENT;
        } else {
          this.length = ECMAScript.ToUint32(length);
          this.byteLength = this.length * this.BYTES_PER_ELEMENT;
        }

        if ((this.byteOffset + this.byteLength) > this.buffer.byteLength) {
          throw new RangeError("byteOffset and length reference an area beyond the end of the buffer");
        }
      } else {
        throw new TypeError("Unexpected argument type(s)");
      }

      this.constructor = ctor;

      configureProperties(this);
      makeArrayAccessors(this);
    };

    ctor.prototype = new ArrayBufferView();
    ctor.prototype.BYTES_PER_ELEMENT = bytesPerElement;
    ctor.prototype._pack = pack;
    ctor.prototype._unpack = unpack;
    ctor.BYTES_PER_ELEMENT = bytesPerElement;

    // getter type (unsigned long index);
    ctor.prototype._getter = function(index) {
      if (arguments.length < 1) throw new SyntaxError("Not enough arguments");

      index = ECMAScript.ToUint32(index);
      if (index >= this.length) {
        return undefined;
      }

      var bytes = [], i, o;
      for (i = 0, o = this.byteOffset + index * this.BYTES_PER_ELEMENT;
           i < this.BYTES_PER_ELEMENT;
           i += 1, o += 1) {
        bytes.push(this.buffer._bytes[o]);
      }
      return this._unpack(bytes);
    };

    // NONSTANDARD: convenience alias for getter: type get(unsigned long index);
    ctor.prototype.get = ctor.prototype._getter;

    // setter void (unsigned long index, type value);
    ctor.prototype._setter = function(index, value) {
      if (arguments.length < 2) throw new SyntaxError("Not enough arguments");

      index = ECMAScript.ToUint32(index);
      if (index >= this.length) {
        return undefined;
      }

      var bytes = this._pack(value), i, o;
      for (i = 0, o = this.byteOffset + index * this.BYTES_PER_ELEMENT;
           i < this.BYTES_PER_ELEMENT;
           i += 1, o += 1) {
        this.buffer._bytes[o] = bytes[i];
      }
    };

    // void set(TypedArray array, optional unsigned long offset);
    // void set(sequence<type> array, optional unsigned long offset);
    ctor.prototype.set = function(index, value) {
      if (arguments.length < 1) throw new SyntaxError("Not enough arguments");
      var array, sequence, offset, len,
          i, s, d,
          byteOffset, byteLength, tmp;

      if (typeof arguments[0] === 'object' && arguments[0].constructor === this.constructor) {
        // void set(TypedArray array, optional unsigned long offset);
        array = arguments[0];
        offset = ECMAScript.ToUint32(arguments[1]);

        if (offset + array.length > this.length) {
          throw new RangeError("Offset plus length of array is out of range");
        }

        byteOffset = this.byteOffset + offset * this.BYTES_PER_ELEMENT;
        byteLength = array.length * this.BYTES_PER_ELEMENT;

        if (array.buffer === this.buffer) {
          tmp = [];
          for (i = 0, s = array.byteOffset; i < byteLength; i += 1, s += 1) {
            tmp[i] = array.buffer._bytes[s];
          }
          for (i = 0, d = byteOffset; i < byteLength; i += 1, d += 1) {
            this.buffer._bytes[d] = tmp[i];
          }
        } else {
          for (i = 0, s = array.byteOffset, d = byteOffset;
               i < byteLength; i += 1, s += 1, d += 1) {
            this.buffer._bytes[d] = array.buffer._bytes[s];
          }
        }
      } else if (typeof arguments[0] === 'object' && typeof arguments[0].length !== 'undefined') {
        // void set(sequence<type> array, optional unsigned long offset);
        sequence = arguments[0];
        len = ECMAScript.ToUint32(sequence.length);
        offset = ECMAScript.ToUint32(arguments[1]);

        if (offset + len > this.length) {
          throw new RangeError("Offset plus length of array is out of range");
        }

        for (i = 0; i < len; i += 1) {
          s = sequence[i];
          this._setter(offset + i, Number(s));
        }
      } else {
        throw new TypeError("Unexpected argument type(s)");
      }
    };

    // TypedArray subarray(long begin, optional long end);
    ctor.prototype.subarray = function(start, end) {
      function clamp(v, min, max) { return v < min ? min : v > max ? max : v; }

      start = ECMAScript.ToInt32(start);
      end = ECMAScript.ToInt32(end);

      if (arguments.length < 1) { start = 0; }
      if (arguments.length < 2) { end = this.length; }

      if (start < 0) { start = this.length + start; }
      if (end < 0) { end = this.length + end; }

      start = clamp(start, 0, this.length);
      end = clamp(end, 0, this.length);

      var len = end - start;
      if (len < 0) {
        len = 0;
      }

      return new this.constructor(
        this.buffer, this.byteOffset + start * this.BYTES_PER_ELEMENT, len);
    };

    return ctor;
  }

  var Int8Array = makeConstructor(1, packI8, unpackI8);
  var Uint8Array = makeConstructor(1, packU8, unpackU8);
  var Uint8ClampedArray = makeConstructor(1, packU8Clamped, unpackU8);
  var Int16Array = makeConstructor(2, packI16, unpackI16);
  var Uint16Array = makeConstructor(2, packU16, unpackU16);
  var Int32Array = makeConstructor(4, packI32, unpackI32);
  var Uint32Array = makeConstructor(4, packU32, unpackU32);
  var Float32Array = makeConstructor(4, packF32, unpackF32);
  var Float64Array = makeConstructor(8, packF64, unpackF64);

  exports.Int8Array = exports.Int8Array || Int8Array;
  exports.Uint8Array = exports.Uint8Array || Uint8Array;
  exports.Uint8ClampedArray = exports.Uint8ClampedArray || Uint8ClampedArray;
  exports.Int16Array = exports.Int16Array || Int16Array;
  exports.Uint16Array = exports.Uint16Array || Uint16Array;
  exports.Int32Array = exports.Int32Array || Int32Array;
  exports.Uint32Array = exports.Uint32Array || Uint32Array;
  exports.Float32Array = exports.Float32Array || Float32Array;
  exports.Float64Array = exports.Float64Array || Float64Array;
}());

//
// 6 The DataView View Type
//

(function() {
  function r(array, index) {
    return ECMAScript.IsCallable(array.get) ? array.get(index) : array[index];
  }

  var IS_BIG_ENDIAN = (function() {
    var u16array = new(exports.Uint16Array)([0x1234]),
        u8array = new(exports.Uint8Array)(u16array.buffer);
    return r(u8array, 0) === 0x12;
  }());

  // Constructor(ArrayBuffer buffer,
  //             optional unsigned long byteOffset,
  //             optional unsigned long byteLength)
  /** @constructor */
  var DataView = function DataView(buffer, byteOffset, byteLength) {
    if (arguments.length === 0) {
      buffer = new ArrayBuffer(0);
    } else if (!(buffer instanceof ArrayBuffer || ECMAScript.Class(buffer) === 'ArrayBuffer')) {
      throw new TypeError("TypeError");
    }

    this.buffer = buffer || new ArrayBuffer(0);

    this.byteOffset = ECMAScript.ToUint32(byteOffset);
    if (this.byteOffset > this.buffer.byteLength) {
      throw new RangeError("byteOffset out of range");
    }

    if (arguments.length < 3) {
      this.byteLength = this.buffer.byteLength - this.byteOffset;
    } else {
      this.byteLength = ECMAScript.ToUint32(byteLength);
    }

    if ((this.byteOffset + this.byteLength) > this.buffer.byteLength) {
      throw new RangeError("byteOffset and length reference an area beyond the end of the buffer");
    }

    configureProperties(this);
  };

  function makeGetter(arrayType) {
    return function(byteOffset, littleEndian) {

      byteOffset = ECMAScript.ToUint32(byteOffset);

      if (byteOffset + arrayType.BYTES_PER_ELEMENT > this.byteLength) {
        throw new RangeError("Array index out of range");
      }
      byteOffset += this.byteOffset;

      var uint8Array = new Uint8Array(this.buffer, byteOffset, arrayType.BYTES_PER_ELEMENT),
          bytes = [], i;
      for (i = 0; i < arrayType.BYTES_PER_ELEMENT; i += 1) {
        bytes.push(r(uint8Array, i));
      }

      if (Boolean(littleEndian) === Boolean(IS_BIG_ENDIAN)) {
        bytes.reverse();
      }

      return r(new arrayType(new Uint8Array(bytes).buffer), 0);
    };
  }

  DataView.prototype.getUint8 = makeGetter(exports.Uint8Array);
  DataView.prototype.getInt8 = makeGetter(exports.Int8Array);
  DataView.prototype.getUint16 = makeGetter(exports.Uint16Array);
  DataView.prototype.getInt16 = makeGetter(exports.Int16Array);
  DataView.prototype.getUint32 = makeGetter(exports.Uint32Array);
  DataView.prototype.getInt32 = makeGetter(exports.Int32Array);
  DataView.prototype.getFloat32 = makeGetter(exports.Float32Array);
  DataView.prototype.getFloat64 = makeGetter(exports.Float64Array);

  function makeSetter(arrayType) {
    return function(byteOffset, value, littleEndian) {

      byteOffset = ECMAScript.ToUint32(byteOffset);
      if (byteOffset + arrayType.BYTES_PER_ELEMENT > this.byteLength) {
        throw new RangeError("Array index out of range");
      }

      // Get bytes
      var typeArray = new arrayType([value]),
          byteArray = new Uint8Array(typeArray.buffer),
          bytes = [], i, byteView;

      for (i = 0; i < arrayType.BYTES_PER_ELEMENT; i += 1) {
        bytes.push(r(byteArray, i));
      }

      // Flip if necessary
      if (Boolean(littleEndian) === Boolean(IS_BIG_ENDIAN)) {
        bytes.reverse();
      }

      // Write them
      byteView = new Uint8Array(this.buffer, byteOffset, arrayType.BYTES_PER_ELEMENT);
      byteView.set(bytes);
    };
  }

  DataView.prototype.setUint8 = makeSetter(exports.Uint8Array);
  DataView.prototype.setInt8 = makeSetter(exports.Int8Array);
  DataView.prototype.setUint16 = makeSetter(exports.Uint16Array);
  DataView.prototype.setInt16 = makeSetter(exports.Int16Array);
  DataView.prototype.setUint32 = makeSetter(exports.Uint32Array);
  DataView.prototype.setInt32 = makeSetter(exports.Int32Array);
  DataView.prototype.setFloat32 = makeSetter(exports.Float32Array);
  DataView.prototype.setFloat64 = makeSetter(exports.Float64Array);

  exports.DataView = exports.DataView || DataView;

}());

},{}]},{},[])
;;module.exports=require("native-buffer-browserify").Buffer

},{}],39:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],40:[function(require,module,exports){
var base64 = require('base64-js')
var TA = require('typedarray')

exports.Buffer = Buffer
exports.SlowBuffer = Buffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192

/**
 * Use a shim for browsers that lack Typed Array support (< IE 9, < FF 3.6,
 * < Chrome 6, < Safari 5, < Opera 11.5, < iOS 4.1).
 */
var xDataView = typeof DataView === 'undefined'
  ? TA.DataView : DataView
var xArrayBuffer = typeof ArrayBuffer === 'undefined'
  ? TA.ArrayBuffer : ArrayBuffer
var xUint8Array = typeof Uint8Array === 'undefined'
  ? TA.Uint8Array : Uint8Array

/**
 * Check to see if the browser supports augmenting a `Uint8Array` instance.
 */
var browserSupport = (function () {
  try {
    var arr = new xUint8Array(0)
    arr.foo = function () { return 42 }
    return 42 === arr.foo()
  } catch (e) {
    return false
  }
})()

/**
 * Also use the shim in Firefox 4-17 (even though they have native Uint8Array),
 * since they don't support Proxy. Without that, it is not possible to augment
 * native Uint8Array instances in Firefox.
 */
if (xUint8Array !== TA.Uint8Array && !browserSupport) {
  xDataView = TA.DataView
  xArrayBuffer = TA.ArrayBuffer
  xUint8Array = TA.Uint8Array
  browserSupport = true
}

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 *
 * Firefox is a special case because it doesn't allow augmenting "native" object
 * instances. See `ProxyBuffer` below for more details.
 */
function Buffer (subject, encoding) {
  var type = typeof subject

  // Work-around: node's base64 implementation
  // allows for non-padded strings while base64-js
  // does not..
  if (encoding === 'base64' && type === 'string') {
    subject = stringtrim(subject)
    while (subject.length % 4 !== 0) {
      subject = subject + '='
    }
  }

  // Find the length
  var length
  if (type === 'number')
    length = coerce(subject)
  else if (type === 'string')
    length = Buffer.byteLength(subject, encoding)
  else if (type === 'object')
    length = coerce(subject.length) // Assume object is an array
  else
    throw new Error('First argument needs to be a number, array or string.')

  var buf = augment(new xUint8Array(length))
  if (Buffer.isBuffer(subject)) {
    // Speed optimization -- use set if we're copying from a Uint8Array
    buf.set(subject)
  } else if (isArrayIsh(subject)) {
    // Treat array-ish objects as a byte array.
    for (var i = 0; i < length; i++) {
      if (Buffer.isBuffer(subject))
        buf[i] = subject.readUInt8(i)
      else
        buf[i] = subject[i]
    }
  } else if (type === 'string') {
    buf.write(subject, 0, encoding)
  }

  return buf
}

// STATIC METHODS
// ==============

Buffer.isEncoding = function(encoding) {
  switch ((encoding + '').toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
    case 'raw':
      return true

    default:
      return false
  }
}

Buffer.isBuffer = function (b) {
  return b && b._isBuffer
}

Buffer.byteLength = function (str, encoding) {
  switch (encoding || 'utf8') {
    case 'hex':
      return str.length / 2

    case 'utf8':
    case 'utf-8':
      return utf8ToBytes(str).length

    case 'ascii':
    case 'binary':
      return str.length

    case 'base64':
      return base64ToBytes(str).length

    default:
      throw new Error('Unknown encoding')
  }
}

Buffer.concat = function (list, totalLength) {
  if (!isArray(list)) {
    throw new Error('Usage: Buffer.concat(list, [totalLength])\n' +
        'list should be an Array.')
  }

  var i
  var buf

  if (list.length === 0) {
    return new Buffer(0)
  } else if (list.length === 1) {
    return list[0]
  }

  if (typeof totalLength !== 'number') {
    totalLength = 0
    for (i = 0; i < list.length; i++) {
      buf = list[i]
      totalLength += buf.length
    }
  }

  var buffer = new Buffer(totalLength)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    buf = list[i]
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

// BUFFER INSTANCE METHODS
// =======================

function _hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) {
    throw new Error('Invalid hex string')
  }
  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var byte = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(byte)) throw new Error('Invalid hex string')
    buf[offset + i] = byte
  }
  Buffer._charsWritten = i * 2
  return i
}

function _utf8Write (buf, string, offset, length) {
  var bytes, pos
  return Buffer._charsWritten = blitBuffer(utf8ToBytes(string), buf, offset, length)
}

function _asciiWrite (buf, string, offset, length) {
  var bytes, pos
  return Buffer._charsWritten = blitBuffer(asciiToBytes(string), buf, offset, length)
}

function _binaryWrite (buf, string, offset, length) {
  return _asciiWrite(buf, string, offset, length)
}

function _base64Write (buf, string, offset, length) {
  var bytes, pos
  return Buffer._charsWritten = blitBuffer(base64ToBytes(string), buf, offset, length)
}

function BufferWrite (string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length
      length = undefined
    }
  } else {  // legacy
    var swap = encoding
    encoding = offset
    offset = length
    length = swap
  }

  offset = Number(offset) || 0
  var remaining = this.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase()

  switch (encoding) {
    case 'hex':
      return _hexWrite(this, string, offset, length)

    case 'utf8':
    case 'utf-8':
      return _utf8Write(this, string, offset, length)

    case 'ascii':
      return _asciiWrite(this, string, offset, length)

    case 'binary':
      return _binaryWrite(this, string, offset, length)

    case 'base64':
      return _base64Write(this, string, offset, length)

    default:
      throw new Error('Unknown encoding')
  }
}

function BufferToString (encoding, start, end) {
  var self = (this instanceof ProxyBuffer)
    ? this._proxy
    : this

  encoding = String(encoding || 'utf8').toLowerCase()
  start = Number(start) || 0
  end = (end !== undefined)
    ? Number(end)
    : end = self.length

  // Fastpath empty strings
  if (end === start)
    return ''

  switch (encoding) {
    case 'hex':
      return _hexSlice(self, start, end)

    case 'utf8':
    case 'utf-8':
      return _utf8Slice(self, start, end)

    case 'ascii':
      return _asciiSlice(self, start, end)

    case 'binary':
      return _binarySlice(self, start, end)

    case 'base64':
      return _base64Slice(self, start, end)

    default:
      throw new Error('Unknown encoding')
  }
}

function BufferToJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
function BufferCopy (target, target_start, start, end) {
  var source = this

  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (!target_start) target_start = 0

  // Copy 0 bytes; we're done
  if (end === start) return
  if (target.length === 0 || source.length === 0) return

  // Fatal error conditions
  if (end < start)
    throw new Error('sourceEnd < sourceStart')
  if (target_start < 0 || target_start >= target.length)
    throw new Error('targetStart out of bounds')
  if (start < 0 || start >= source.length)
    throw new Error('sourceStart out of bounds')
  if (end < 0 || end > source.length)
    throw new Error('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length)
    end = this.length
  if (target.length - target_start < end - start)
    end = target.length - target_start + start

  // copy!
  for (var i = 0; i < end - start; i++)
    target[i + target_start] = this[i + start]
}

function _base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function _utf8Slice (buf, start, end) {
  var res = ''
  var tmp = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    if (buf[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
      tmp = ''
    } else {
      tmp += '%' + buf[i].toString(16)
    }
  }

  return res + decodeUtf8Char(tmp)
}

function _asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++)
    ret += String.fromCharCode(buf[i])
  return ret
}

function _binarySlice (buf, start, end) {
  return _asciiSlice(buf, start, end)
}

function _hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

// TODO: add test that modifying the new buffer slice will modify memory in the
// original buffer! Use code from:
// http://nodejs.org/api/buffer.html#buffer_buf_slice_start_end
function BufferSlice (start, end) {
  var len = this.length
  start = clamp(start, len, 0)
  end = clamp(end, len, len)
  return augment(this.subarray(start, end)) // Uint8Array built-in method
}

function BufferReadUInt8 (offset, noAssert) {
  var buf = this
  if (!noAssert) {
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < buf.length, 'Trying to read beyond buffer length')
  }

  if (offset >= buf.length)
    return

  return buf[offset]
}

function _readUInt16 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof (littleEndian) === 'boolean',
        'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len) {
    return
  } else if (offset + 1 === len) {
    var dv = new xDataView(new xArrayBuffer(2))
    dv.setUint8(0, buf[len - 1])
    return dv.getUint16(0, littleEndian)
  } else {
    return buf._dataview.getUint16(offset, littleEndian)
  }
}

function BufferReadUInt16LE (offset, noAssert) {
  return _readUInt16(this, offset, true, noAssert)
}

function BufferReadUInt16BE (offset, noAssert) {
  return _readUInt16(this, offset, false, noAssert)
}

function _readUInt32 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof (littleEndian) === 'boolean',
        'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len) {
    return
  } else if (offset + 3 >= len) {
    var dv = new xDataView(new xArrayBuffer(4))
    for (var i = 0; i + offset < len; i++) {
      dv.setUint8(i, buf[i + offset])
    }
    return dv.getUint32(0, littleEndian)
  } else {
    return buf._dataview.getUint32(offset, littleEndian)
  }
}

function BufferReadUInt32LE (offset, noAssert) {
  return _readUInt32(this, offset, true, noAssert)
}

function BufferReadUInt32BE (offset, noAssert) {
  return _readUInt32(this, offset, false, noAssert)
}

function BufferReadInt8 (offset, noAssert) {
  var buf = this
  if (!noAssert) {
    assert(offset !== undefined && offset !== null,
        'missing offset')
    assert(offset < buf.length, 'Trying to read beyond buffer length')
  }

  if (offset >= buf.length)
    return

  return buf._dataview.getInt8(offset)
}

function _readInt16 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof (littleEndian) === 'boolean',
        'missing or invalid endian')
    assert(offset !== undefined && offset !== null,
        'missing offset')
    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len) {
    return
  } else if (offset + 1 === len) {
    var dv = new xDataView(new xArrayBuffer(2))
    dv.setUint8(0, buf[len - 1])
    return dv.getInt16(0, littleEndian)
  } else {
    return buf._dataview.getInt16(offset, littleEndian)
  }
}

function BufferReadInt16LE (offset, noAssert) {
  return _readInt16(this, offset, true, noAssert)
}

function BufferReadInt16BE (offset, noAssert) {
  return _readInt16(this, offset, false, noAssert)
}

function _readInt32 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof (littleEndian) === 'boolean',
        'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len) {
    return
  } else if (offset + 3 >= len) {
    var dv = new xDataView(new xArrayBuffer(4))
    for (var i = 0; i + offset < len; i++) {
      dv.setUint8(i, buf[i + offset])
    }
    return dv.getInt32(0, littleEndian)
  } else {
    return buf._dataview.getInt32(offset, littleEndian)
  }
}

function BufferReadInt32LE (offset, noAssert) {
  return _readInt32(this, offset, true, noAssert)
}

function BufferReadInt32BE (offset, noAssert) {
  return _readInt32(this, offset, false, noAssert)
}

function _readFloat (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof (littleEndian) === 'boolean',
        'missing or invalid endian')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  return buf._dataview.getFloat32(offset, littleEndian)
}

function BufferReadFloatLE (offset, noAssert) {
  return _readFloat(this, offset, true, noAssert)
}

function BufferReadFloatBE (offset, noAssert) {
  return _readFloat(this, offset, false, noAssert)
}

function _readDouble (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof (littleEndian) === 'boolean',
        'missing or invalid endian')
    assert(offset + 7 < buf.length, 'Trying to read beyond buffer length')
  }

  return buf._dataview.getFloat64(offset, littleEndian)
}

function BufferReadDoubleLE (offset, noAssert) {
  return _readDouble(this, offset, true, noAssert)
}

function BufferReadDoubleBE (offset, noAssert) {
  return _readDouble(this, offset, false, noAssert)
}

function BufferWriteUInt8 (value, offset, noAssert) {
  var buf = this
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xff)
  }

  if (offset >= buf.length) return

  buf[offset] = value
}

function _writeUInt16 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof (littleEndian) === 'boolean',
        'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xffff)
  }

  var len = buf.length
  if (offset >= len) {
    return
  } else if (offset + 1 === len) {
    var dv = new xDataView(new xArrayBuffer(2))
    dv.setUint16(0, value, littleEndian)
    buf[offset] = dv.getUint8(0)
  } else {
    buf._dataview.setUint16(offset, value, littleEndian)
  }
}

function BufferWriteUInt16LE (value, offset, noAssert) {
  _writeUInt16(this, value, offset, true, noAssert)
}

function BufferWriteUInt16BE (value, offset, noAssert) {
  _writeUInt16(this, value, offset, false, noAssert)
}

function _writeUInt32 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof (littleEndian) === 'boolean',
        'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xffffffff)
  }

  var len = buf.length
  if (offset >= len) {
    return
  } else if (offset + 3 >= len) {
    var dv = new xDataView(new xArrayBuffer(4))
    dv.setUint32(0, value, littleEndian)
    for (var i = 0; i + offset < len; i++) {
      buf[i + offset] = dv.getUint8(i)
    }
  } else {
    buf._dataview.setUint32(offset, value, littleEndian)
  }
}

function BufferWriteUInt32LE (value, offset, noAssert) {
  _writeUInt32(this, value, offset, true, noAssert)
}

function BufferWriteUInt32BE (value, offset, noAssert) {
  _writeUInt32(this, value, offset, false, noAssert)
}

function BufferWriteInt8 (value, offset, noAssert) {
  var buf = this
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7f, -0x80)
  }

  if (offset >= buf.length) return

  buf._dataview.setInt8(offset, value)
}

function _writeInt16 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof (littleEndian) === 'boolean',
        'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7fff, -0x8000)
  }

  var len = buf.length
  if (offset >= len) {
    return
  } else if (offset + 1 === len) {
    var dv = new xDataView(new xArrayBuffer(2))
    dv.setInt16(0, value, littleEndian)
    buf[offset] = dv.getUint8(0)
  } else {
    buf._dataview.setInt16(offset, value, littleEndian)
  }
}

function BufferWriteInt16LE (value, offset, noAssert) {
  _writeInt16(this, value, offset, true, noAssert)
}

function BufferWriteInt16BE (value, offset, noAssert) {
  _writeInt16(this, value, offset, false, noAssert)
}

function _writeInt32 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof (littleEndian) === 'boolean',
        'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7fffffff, -0x80000000)
  }

  var len = buf.length
  if (offset >= len) {
    return
  } else if (offset + 3 >= len) {
    var dv = new xDataView(new xArrayBuffer(4))
    dv.setInt32(0, value, littleEndian)
    for (var i = 0; i + offset < len; i++) {
      buf[i + offset] = dv.getUint8(i)
    }
  } else {
    buf._dataview.setInt32(offset, value, littleEndian)
  }
}

function BufferWriteInt32LE (value, offset, noAssert) {
  _writeInt32(this, value, offset, true, noAssert)
}

function BufferWriteInt32BE (value, offset, noAssert) {
  _writeInt32(this, value, offset, false, noAssert)
}

function _writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof (littleEndian) === 'boolean',
        'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
    verifIEEE754(value, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }

  var len = buf.length
  if (offset >= len) {
    return
  } else if (offset + 3 >= len) {
    var dv = new xDataView(new xArrayBuffer(4))
    dv.setFloat32(0, value, littleEndian)
    for (var i = 0; i + offset < len; i++) {
      buf[i + offset] = dv.getUint8(i)
    }
  } else {
    buf._dataview.setFloat32(offset, value, littleEndian)
  }
}

function BufferWriteFloatLE (value, offset, noAssert) {
  _writeFloat(this, value, offset, true, noAssert)
}

function BufferWriteFloatBE (value, offset, noAssert) {
  _writeFloat(this, value, offset, false, noAssert)
}

function _writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof (littleEndian) === 'boolean',
        'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 7 < buf.length,
        'Trying to write beyond buffer length')
    verifIEEE754(value, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }

  var len = buf.length
  if (offset >= len) {
    return
  } else if (offset + 7 >= len) {
    var dv = new xDataView(new xArrayBuffer(8))
    dv.setFloat64(0, value, littleEndian)
    for (var i = 0; i + offset < len; i++) {
      buf[i + offset] = dv.getUint8(i)
    }
  } else {
    buf._dataview.setFloat64(offset, value, littleEndian)
  }
}

function BufferWriteDoubleLE (value, offset, noAssert) {
  _writeDouble(this, value, offset, true, noAssert)
}

function BufferWriteDoubleBE (value, offset, noAssert) {
  _writeDouble(this, value, offset, false, noAssert)
}

// fill(value, start=0, end=buffer.length)
function BufferFill (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (typeof value === 'string') {
    value = value.charCodeAt(0)
  }

  if (typeof value !== 'number' || isNaN(value)) {
    throw new Error('value is not a number')
  }

  if (end < start) throw new Error('end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  if (start < 0 || start >= this.length) {
    throw new Error('start out of bounds')
  }

  if (end < 0 || end > this.length) {
    throw new Error('end out of bounds')
  }

  for (var i = start; i < end; i++) {
    this[i] = value
  }
}

function BufferInspect () {
  var out = []
  var len = this.length
  for (var i = 0; i < len; i++) {
    out[i] = toHex(this[i])
    if (i === exports.INSPECT_MAX_BYTES) {
      out[i + 1] = '...'
      break
    }
  }
  return '<Buffer ' + out.join(' ') + '>'
}

// Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
// Added in Node 0.12.
function BufferToArrayBuffer () {
  return (new Buffer(this)).buffer
}


// HELPER FUNCTIONS
// ================

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

/**
 * Class: ProxyBuffer
 * ==================
 *
 * Only used in Firefox, since Firefox does not allow augmenting "native"
 * objects (like Uint8Array instances) with new properties for some unknown
 * (probably silly) reason. So we'll use an ES6 Proxy (supported since
 * Firefox 18) to wrap the Uint8Array instance without actually adding any
 * properties to it.
 *
 * Instances of this "fake" Buffer class are the "target" of the
 * ES6 Proxy (see `augment` function).
 *
 * We couldn't just use the `Uint8Array` as the target of the `Proxy` because
 * Proxies have an important limitation on trapping the `toString` method.
 * `Object.prototype.toString.call(proxy)` gets called whenever something is
 * implicitly cast to a String. Unfortunately, with a `Proxy` this
 * unconditionally returns `Object.prototype.toString.call(target)` which would
 * always return "[object Uint8Array]" if we used the `Uint8Array` instance as
 * the target. And, remember, in Firefox we cannot redefine the `Uint8Array`
 * instance's `toString` method.
 *
 * So, we use this `ProxyBuffer` class as the proxy's "target". Since this class
 * has its own custom `toString` method, it will get called whenever `toString`
 * gets called, implicitly or explicitly, on the `Proxy` instance.
 *
 * We also have to define the Uint8Array methods `subarray` and `set` on
 * `ProxyBuffer` because if we didn't then `proxy.subarray(0)` would have its
 * `this` set to `proxy` (a `Proxy` instance) which throws an exception in
 * Firefox which expects it to be a `TypedArray` instance.
 */
function ProxyBuffer (arr) {
  this._arr = arr

  if (arr.byteLength !== 0)
    this._dataview = new xDataView(arr.buffer, arr.byteOffset, arr.byteLength)
}

ProxyBuffer.prototype = {
  _isBuffer: true,
  write: BufferWrite,
  toString: BufferToString,
  toLocaleString: BufferToString,
  toJSON: BufferToJSON,
  copy: BufferCopy,
  slice: BufferSlice,
  readUInt8: BufferReadUInt8,
  readUInt16LE: BufferReadUInt16LE,
  readUInt16BE: BufferReadUInt16BE,
  readUInt32LE: BufferReadUInt32LE,
  readUInt32BE: BufferReadUInt32BE,
  readInt8: BufferReadInt8,
  readInt16LE: BufferReadInt16LE,
  readInt16BE: BufferReadInt16BE,
  readInt32LE: BufferReadInt32LE,
  readInt32BE: BufferReadInt32BE,
  readFloatLE: BufferReadFloatLE,
  readFloatBE: BufferReadFloatBE,
  readDoubleLE: BufferReadDoubleLE,
  readDoubleBE: BufferReadDoubleBE,
  writeUInt8: BufferWriteUInt8,
  writeUInt16LE: BufferWriteUInt16LE,
  writeUInt16BE: BufferWriteUInt16BE,
  writeUInt32LE: BufferWriteUInt32LE,
  writeUInt32BE: BufferWriteUInt32BE,
  writeInt8: BufferWriteInt8,
  writeInt16LE: BufferWriteInt16LE,
  writeInt16BE: BufferWriteInt16BE,
  writeInt32LE: BufferWriteInt32LE,
  writeInt32BE: BufferWriteInt32BE,
  writeFloatLE: BufferWriteFloatLE,
  writeFloatBE: BufferWriteFloatBE,
  writeDoubleLE: BufferWriteDoubleLE,
  writeDoubleBE: BufferWriteDoubleBE,
  fill: BufferFill,
  inspect: BufferInspect,
  toArrayBuffer: BufferToArrayBuffer,
  subarray: function () {
    return this._arr.subarray.apply(this._arr, arguments)
  },
  set: function () {
    return this._arr.set.apply(this._arr, arguments)
  }
}

var ProxyHandler = {
  get: function (target, name) {
    if (name in target) return target[name]
    else return target._arr[name]
  },
  set: function (target, name, value) {
    target._arr[name] = value
  }
}

function augment (arr) {
  if (browserSupport) {
    arr._isBuffer = true

    // Augment the Uint8Array *instance* (not the class!) with Buffer methods
    arr.write = BufferWrite
    arr.toString = BufferToString
    arr.toLocaleString = BufferToString
    arr.toJSON = BufferToJSON
    arr.copy = BufferCopy
    arr.slice = BufferSlice
    arr.readUInt8 = BufferReadUInt8
    arr.readUInt16LE = BufferReadUInt16LE
    arr.readUInt16BE = BufferReadUInt16BE
    arr.readUInt32LE = BufferReadUInt32LE
    arr.readUInt32BE = BufferReadUInt32BE
    arr.readInt8 = BufferReadInt8
    arr.readInt16LE = BufferReadInt16LE
    arr.readInt16BE = BufferReadInt16BE
    arr.readInt32LE = BufferReadInt32LE
    arr.readInt32BE = BufferReadInt32BE
    arr.readFloatLE = BufferReadFloatLE
    arr.readFloatBE = BufferReadFloatBE
    arr.readDoubleLE = BufferReadDoubleLE
    arr.readDoubleBE = BufferReadDoubleBE
    arr.writeUInt8 = BufferWriteUInt8
    arr.writeUInt16LE = BufferWriteUInt16LE
    arr.writeUInt16BE = BufferWriteUInt16BE
    arr.writeUInt32LE = BufferWriteUInt32LE
    arr.writeUInt32BE = BufferWriteUInt32BE
    arr.writeInt8 = BufferWriteInt8
    arr.writeInt16LE = BufferWriteInt16LE
    arr.writeInt16BE = BufferWriteInt16BE
    arr.writeInt32LE = BufferWriteInt32LE
    arr.writeInt32BE = BufferWriteInt32BE
    arr.writeFloatLE = BufferWriteFloatLE
    arr.writeFloatBE = BufferWriteFloatBE
    arr.writeDoubleLE = BufferWriteDoubleLE
    arr.writeDoubleBE = BufferWriteDoubleBE
    arr.fill = BufferFill
    arr.inspect = BufferInspect

    // Only add `toArrayBuffer` if the browser supports ArrayBuffer natively
    if (xUint8Array !== TA.Uint8Array)
      arr.toArrayBuffer = BufferToArrayBuffer

    if (arr.byteLength !== 0)
      arr._dataview = new xDataView(arr.buffer, arr.byteOffset, arr.byteLength)

    return arr

  } else {
    // This is a browser that doesn't support augmenting the `Uint8Array`
    // instance (*ahem* Firefox) so use an ES6 `Proxy`.
    var proxyBuffer = new ProxyBuffer(arr)
    var proxy = new Proxy(proxyBuffer, ProxyHandler)
    proxyBuffer._proxy = proxy
    return proxy
  }
}

// slice(start, end)
function clamp (index, len, defaultValue) {
  if (typeof index !== 'number') return defaultValue
  index = ~~index;  // Coerce to integer.
  if (index >= len) return len
  if (index >= 0) return index
  index += len
  if (index >= 0) return index
  return 0
}

function coerce (length) {
  // Coerce length to a number (possibly NaN), round up
  // in case it's fractional (e.g. 123.456) then do a
  // double negate to coerce a NaN to 0. Easy, right?
  length = ~~Math.ceil(+length)
  return length < 0 ? 0 : length
}

function isArray (subject) {
  return (Array.isArray || function (subject) {
    return Object.prototype.toString.call(subject) === '[object Array]'
  })(subject)
}

function isArrayIsh (subject) {
  return isArray(subject) || Buffer.isBuffer(subject) ||
      subject && typeof subject === 'object' &&
      typeof subject.length === 'number'
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++)
    if (str.charCodeAt(i) <= 0x7F)
      byteArray.push(str.charCodeAt(i))
    else {
      var h = encodeURIComponent(str.charAt(i)).substr(1).split('%')
      for (var j = 0; j < h.length; j++)
        byteArray.push(parseInt(h[j], 16))
    }

  return byteArray
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(str)
}

function blitBuffer (src, dst, offset, length) {
  var pos
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length))
      break
    dst[i + offset] = src[i]
  }
  return i
}

function decodeUtf8Char (str) {
  try {
    return decodeURIComponent(str)
  } catch (err) {
    return String.fromCharCode(0xFFFD) // UTF 8 invalid char
  }
}

/*
 * We have to make sure that the value is a valid integer. This means that it
 * is non-negative. It has no fractional component and that it does not
 * exceed the maximum allowed value.
 *
 *      value           The number to check for validity
 *
 *      max             The maximum value
 */
function verifuint (value, max) {
  assert(typeof (value) == 'number', 'cannot write a non-number as a number')
  assert(value >= 0,
      'specified a negative value for writing an unsigned value')
  assert(value <= max, 'value is larger than maximum value for type')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

/*
 * A series of checks to make sure we actually have a signed 32-bit number
 */
function verifsint(value, max, min) {
  assert(typeof (value) == 'number', 'cannot write a non-number as a number')
  assert(value <= max, 'value larger than maximum allowed value')
  assert(value >= min, 'value smaller than minimum allowed value')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

function verifIEEE754(value, max, min) {
  assert(typeof (value) == 'number', 'cannot write a non-number as a number')
  assert(value <= max, 'value larger than maximum allowed value')
  assert(value >= min, 'value smaller than minimum allowed value')
}

function assert (test, message) {
  if (!test) throw new Error(message || 'Failed assertion')
}

},{"base64-js":41,"typedarray":42}],41:[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var ZERO   = '0'.charCodeAt(0)
	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if(code === PLUS)
			return 62 // '+'
		if(code === SLASH)
			return 63 // '/'
		if(code < NUMBER)
			return -1 //no match
		if(code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if(code < UPPER + 26)
			return code - UPPER
		if(code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray(b64) {
		var i, j, l, tmp, placeHolders, arr;

		if (b64.length % 4 > 0) {
			throw 'Invalid string. Length must be a multiple of 4';
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders);

		// if there are placeholders, only get up to the last complete 4 chars



		l = placeHolders > 0 ? b64.length - 4 : b64.length;

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3));
			push((tmp & 0xFF0000) >> 16);
			push((tmp & 0xFF00) >> 8);
			push(tmp & 0xFF);
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4);
			push(tmp & 0xFF);
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2);
			push((tmp >> 8) & 0xFF);
			push(tmp & 0xFF);
		}

		return arr;
	}

	function uint8ToBase64(uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length;

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F);
		};

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
			output += tripletToBase64(temp);
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1];
				output += encode(temp >> 2);
				output += encode((temp << 4) & 0x3F);
				output += '==';
				break;
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1]);
				output += encode(temp >> 10);
				output += encode((temp >> 4) & 0x3F);
				output += encode((temp << 2) & 0x3F);
				output += '=';
				break;
		}

		return output;
	}

	module.exports.toByteArray = b64ToByteArray;
	module.exports.fromByteArray = uint8ToBase64;
}());


},{}],42:[function(require,module,exports){
var undefined = (void 0); // Paranoia

// Beyond this value, index getters/setters (i.e. array[0], array[1]) are so slow to
// create, and consume so much memory, that the browser appears frozen.
var MAX_ARRAY_LENGTH = 1e5;

// Approximations of internal ECMAScript conversion functions
var ECMAScript = (function() {
  // Stash a copy in case other scripts modify these
  var opts = Object.prototype.toString,
      ophop = Object.prototype.hasOwnProperty;

  return {
    // Class returns internal [[Class]] property, used to avoid cross-frame instanceof issues:
    Class: function(v) { return opts.call(v).replace(/^\[object *|\]$/g, ''); },
    HasProperty: function(o, p) { return p in o; },
    HasOwnProperty: function(o, p) { return ophop.call(o, p); },
    IsCallable: function(o) { return typeof o === 'function'; },
    ToInt32: function(v) { return v >> 0; },
    ToUint32: function(v) { return v >>> 0; }
  };
}());

// Snapshot intrinsics
var LN2 = Math.LN2,
    abs = Math.abs,
    floor = Math.floor,
    log = Math.log,
    min = Math.min,
    pow = Math.pow,
    round = Math.round;

// ES5: lock down object properties
function configureProperties(obj) {
  if (getOwnPropNames && defineProp) {
    var props = getOwnPropNames(obj), i;
    for (i = 0; i < props.length; i += 1) {
      defineProp(obj, props[i], {
        value: obj[props[i]],
        writable: false,
        enumerable: false,
        configurable: false
      });
    }
  }
}

// emulate ES5 getter/setter API using legacy APIs
// http://blogs.msdn.com/b/ie/archive/2010/09/07/transitioning-existing-code-to-the-es5-getter-setter-apis.aspx
// (second clause tests for Object.defineProperty() in IE<9 that only supports extending DOM prototypes, but
// note that IE<9 does not support __defineGetter__ or __defineSetter__ so it just renders the method harmless)
var defineProp
if (Object.defineProperty && (function() {
      try {
        Object.defineProperty({}, 'x', {});
        return true;
      } catch (e) {
        return false;
      }
    })()) {
  defineProp = Object.defineProperty;
} else {
  defineProp = function(o, p, desc) {
    if (!o === Object(o)) throw new TypeError("Object.defineProperty called on non-object");
    if (ECMAScript.HasProperty(desc, 'get') && Object.prototype.__defineGetter__) { Object.prototype.__defineGetter__.call(o, p, desc.get); }
    if (ECMAScript.HasProperty(desc, 'set') && Object.prototype.__defineSetter__) { Object.prototype.__defineSetter__.call(o, p, desc.set); }
    if (ECMAScript.HasProperty(desc, 'value')) { o[p] = desc.value; }
    return o;
  };
}

var getOwnPropNames = Object.getOwnPropertyNames || function (o) {
  if (o !== Object(o)) throw new TypeError("Object.getOwnPropertyNames called on non-object");
  var props = [], p;
  for (p in o) {
    if (ECMAScript.HasOwnProperty(o, p)) {
      props.push(p);
    }
  }
  return props;
};

// ES5: Make obj[index] an alias for obj._getter(index)/obj._setter(index, value)
// for index in 0 ... obj.length
function makeArrayAccessors(obj) {
  if (!defineProp) { return; }

  if (obj.length > MAX_ARRAY_LENGTH) throw new RangeError("Array too large for polyfill");

  function makeArrayAccessor(index) {
    defineProp(obj, index, {
      'get': function() { return obj._getter(index); },
      'set': function(v) { obj._setter(index, v); },
      enumerable: true,
      configurable: false
    });
  }

  var i;
  for (i = 0; i < obj.length; i += 1) {
    makeArrayAccessor(i);
  }
}

// Internal conversion functions:
//    pack<Type>()   - take a number (interpreted as Type), output a byte array
//    unpack<Type>() - take a byte array, output a Type-like number

function as_signed(value, bits) { var s = 32 - bits; return (value << s) >> s; }
function as_unsigned(value, bits) { var s = 32 - bits; return (value << s) >>> s; }

function packI8(n) { return [n & 0xff]; }
function unpackI8(bytes) { return as_signed(bytes[0], 8); }

function packU8(n) { return [n & 0xff]; }
function unpackU8(bytes) { return as_unsigned(bytes[0], 8); }

function packU8Clamped(n) { n = round(Number(n)); return [n < 0 ? 0 : n > 0xff ? 0xff : n & 0xff]; }

function packI16(n) { return [(n >> 8) & 0xff, n & 0xff]; }
function unpackI16(bytes) { return as_signed(bytes[0] << 8 | bytes[1], 16); }

function packU16(n) { return [(n >> 8) & 0xff, n & 0xff]; }
function unpackU16(bytes) { return as_unsigned(bytes[0] << 8 | bytes[1], 16); }

function packI32(n) { return [(n >> 24) & 0xff, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]; }
function unpackI32(bytes) { return as_signed(bytes[0] << 24 | bytes[1] << 16 | bytes[2] << 8 | bytes[3], 32); }

function packU32(n) { return [(n >> 24) & 0xff, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]; }
function unpackU32(bytes) { return as_unsigned(bytes[0] << 24 | bytes[1] << 16 | bytes[2] << 8 | bytes[3], 32); }

function packIEEE754(v, ebits, fbits) {

  var bias = (1 << (ebits - 1)) - 1,
      s, e, f, ln,
      i, bits, str, bytes;

  function roundToEven(n) {
    var w = floor(n), f = n - w;
    if (f < 0.5)
      return w;
    if (f > 0.5)
      return w + 1;
    return w % 2 ? w + 1 : w;
  }

  // Compute sign, exponent, fraction
  if (v !== v) {
    // NaN
    // http://dev.w3.org/2006/webapi/WebIDL/#es-type-mapping
    e = (1 << ebits) - 1; f = pow(2, fbits - 1); s = 0;
  } else if (v === Infinity || v === -Infinity) {
    e = (1 << ebits) - 1; f = 0; s = (v < 0) ? 1 : 0;
  } else if (v === 0) {
    e = 0; f = 0; s = (1 / v === -Infinity) ? 1 : 0;
  } else {
    s = v < 0;
    v = abs(v);

    if (v >= pow(2, 1 - bias)) {
      e = min(floor(log(v) / LN2), 1023);
      f = roundToEven(v / pow(2, e) * pow(2, fbits));
      if (f / pow(2, fbits) >= 2) {
        e = e + 1;
        f = 1;
      }
      if (e > bias) {
        // Overflow
        e = (1 << ebits) - 1;
        f = 0;
      } else {
        // Normalized
        e = e + bias;
        f = f - pow(2, fbits);
      }
    } else {
      // Denormalized
      e = 0;
      f = roundToEven(v / pow(2, 1 - bias - fbits));
    }
  }

  // Pack sign, exponent, fraction
  bits = [];
  for (i = fbits; i; i -= 1) { bits.push(f % 2 ? 1 : 0); f = floor(f / 2); }
  for (i = ebits; i; i -= 1) { bits.push(e % 2 ? 1 : 0); e = floor(e / 2); }
  bits.push(s ? 1 : 0);
  bits.reverse();
  str = bits.join('');

  // Bits to bytes
  bytes = [];
  while (str.length) {
    bytes.push(parseInt(str.substring(0, 8), 2));
    str = str.substring(8);
  }
  return bytes;
}

function unpackIEEE754(bytes, ebits, fbits) {

  // Bytes to bits
  var bits = [], i, j, b, str,
      bias, s, e, f;

  for (i = bytes.length; i; i -= 1) {
    b = bytes[i - 1];
    for (j = 8; j; j -= 1) {
      bits.push(b % 2 ? 1 : 0); b = b >> 1;
    }
  }
  bits.reverse();
  str = bits.join('');

  // Unpack sign, exponent, fraction
  bias = (1 << (ebits - 1)) - 1;
  s = parseInt(str.substring(0, 1), 2) ? -1 : 1;
  e = parseInt(str.substring(1, 1 + ebits), 2);
  f = parseInt(str.substring(1 + ebits), 2);

  // Produce number
  if (e === (1 << ebits) - 1) {
    return f !== 0 ? NaN : s * Infinity;
  } else if (e > 0) {
    // Normalized
    return s * pow(2, e - bias) * (1 + f / pow(2, fbits));
  } else if (f !== 0) {
    // Denormalized
    return s * pow(2, -(bias - 1)) * (f / pow(2, fbits));
  } else {
    return s < 0 ? -0 : 0;
  }
}

function unpackF64(b) { return unpackIEEE754(b, 11, 52); }
function packF64(v) { return packIEEE754(v, 11, 52); }
function unpackF32(b) { return unpackIEEE754(b, 8, 23); }
function packF32(v) { return packIEEE754(v, 8, 23); }


//
// 3 The ArrayBuffer Type
//

(function() {

  /** @constructor */
  var ArrayBuffer = function ArrayBuffer(length) {
    length = ECMAScript.ToInt32(length);
    if (length < 0) throw new RangeError('ArrayBuffer size is not a small enough positive integer');

    this.byteLength = length;
    this._bytes = [];
    this._bytes.length = length;

    var i;
    for (i = 0; i < this.byteLength; i += 1) {
      this._bytes[i] = 0;
    }

    configureProperties(this);
  };

  exports.ArrayBuffer = exports.ArrayBuffer || ArrayBuffer;

  //
  // 4 The ArrayBufferView Type
  //

  // NOTE: this constructor is not exported
  /** @constructor */
  var ArrayBufferView = function ArrayBufferView() {
    //this.buffer = null;
    //this.byteOffset = 0;
    //this.byteLength = 0;
  };

  //
  // 5 The Typed Array View Types
  //

  function makeConstructor(bytesPerElement, pack, unpack) {
    // Each TypedArray type requires a distinct constructor instance with
    // identical logic, which this produces.

    var ctor;
    ctor = function(buffer, byteOffset, length) {
      var array, sequence, i, s;

      if (!arguments.length || typeof arguments[0] === 'number') {
        // Constructor(unsigned long length)
        this.length = ECMAScript.ToInt32(arguments[0]);
        if (length < 0) throw new RangeError('ArrayBufferView size is not a small enough positive integer');

        this.byteLength = this.length * this.BYTES_PER_ELEMENT;
        this.buffer = new ArrayBuffer(this.byteLength);
        this.byteOffset = 0;
      } else if (typeof arguments[0] === 'object' && arguments[0].constructor === ctor) {
        // Constructor(TypedArray array)
        array = arguments[0];

        this.length = array.length;
        this.byteLength = this.length * this.BYTES_PER_ELEMENT;
        this.buffer = new ArrayBuffer(this.byteLength);
        this.byteOffset = 0;

        for (i = 0; i < this.length; i += 1) {
          this._setter(i, array._getter(i));
        }
      } else if (typeof arguments[0] === 'object' &&
                 !(arguments[0] instanceof ArrayBuffer || ECMAScript.Class(arguments[0]) === 'ArrayBuffer')) {
        // Constructor(sequence<type> array)
        sequence = arguments[0];

        this.length = ECMAScript.ToUint32(sequence.length);
        this.byteLength = this.length * this.BYTES_PER_ELEMENT;
        this.buffer = new ArrayBuffer(this.byteLength);
        this.byteOffset = 0;

        for (i = 0; i < this.length; i += 1) {
          s = sequence[i];
          this._setter(i, Number(s));
        }
      } else if (typeof arguments[0] === 'object' &&
                 (arguments[0] instanceof ArrayBuffer || ECMAScript.Class(arguments[0]) === 'ArrayBuffer')) {
        // Constructor(ArrayBuffer buffer,
        //             optional unsigned long byteOffset, optional unsigned long length)
        this.buffer = buffer;

        this.byteOffset = ECMAScript.ToUint32(byteOffset);
        if (this.byteOffset > this.buffer.byteLength) {
          throw new RangeError("byteOffset out of range");
        }

        if (this.byteOffset % this.BYTES_PER_ELEMENT) {
          // The given byteOffset must be a multiple of the element
          // size of the specific type, otherwise an exception is raised.
          throw new RangeError("ArrayBuffer length minus the byteOffset is not a multiple of the element size.");
        }

        if (arguments.length < 3) {
          this.byteLength = this.buffer.byteLength - this.byteOffset;

          if (this.byteLength % this.BYTES_PER_ELEMENT) {
            throw new RangeError("length of buffer minus byteOffset not a multiple of the element size");
          }
          this.length = this.byteLength / this.BYTES_PER_ELEMENT;
        } else {
          this.length = ECMAScript.ToUint32(length);
          this.byteLength = this.length * this.BYTES_PER_ELEMENT;
        }

        if ((this.byteOffset + this.byteLength) > this.buffer.byteLength) {
          throw new RangeError("byteOffset and length reference an area beyond the end of the buffer");
        }
      } else {
        throw new TypeError("Unexpected argument type(s)");
      }

      this.constructor = ctor;

      configureProperties(this);
      makeArrayAccessors(this);
    };

    ctor.prototype = new ArrayBufferView();
    ctor.prototype.BYTES_PER_ELEMENT = bytesPerElement;
    ctor.prototype._pack = pack;
    ctor.prototype._unpack = unpack;
    ctor.BYTES_PER_ELEMENT = bytesPerElement;

    // getter type (unsigned long index);
    ctor.prototype._getter = function(index) {
      if (arguments.length < 1) throw new SyntaxError("Not enough arguments");

      index = ECMAScript.ToUint32(index);
      if (index >= this.length) {
        return undefined;
      }

      var bytes = [], i, o;
      for (i = 0, o = this.byteOffset + index * this.BYTES_PER_ELEMENT;
           i < this.BYTES_PER_ELEMENT;
           i += 1, o += 1) {
        bytes.push(this.buffer._bytes[o]);
      }
      return this._unpack(bytes);
    };

    // NONSTANDARD: convenience alias for getter: type get(unsigned long index);
    ctor.prototype.get = ctor.prototype._getter;

    // setter void (unsigned long index, type value);
    ctor.prototype._setter = function(index, value) {
      if (arguments.length < 2) throw new SyntaxError("Not enough arguments");

      index = ECMAScript.ToUint32(index);
      if (index >= this.length) {
        return undefined;
      }

      var bytes = this._pack(value), i, o;
      for (i = 0, o = this.byteOffset + index * this.BYTES_PER_ELEMENT;
           i < this.BYTES_PER_ELEMENT;
           i += 1, o += 1) {
        this.buffer._bytes[o] = bytes[i];
      }
    };

    // void set(TypedArray array, optional unsigned long offset);
    // void set(sequence<type> array, optional unsigned long offset);
    ctor.prototype.set = function(index, value) {
      if (arguments.length < 1) throw new SyntaxError("Not enough arguments");
      var array, sequence, offset, len,
          i, s, d,
          byteOffset, byteLength, tmp;

      if (typeof arguments[0] === 'object' && arguments[0].constructor === this.constructor) {
        // void set(TypedArray array, optional unsigned long offset);
        array = arguments[0];
        offset = ECMAScript.ToUint32(arguments[1]);

        if (offset + array.length > this.length) {
          throw new RangeError("Offset plus length of array is out of range");
        }

        byteOffset = this.byteOffset + offset * this.BYTES_PER_ELEMENT;
        byteLength = array.length * this.BYTES_PER_ELEMENT;

        if (array.buffer === this.buffer) {
          tmp = [];
          for (i = 0, s = array.byteOffset; i < byteLength; i += 1, s += 1) {
            tmp[i] = array.buffer._bytes[s];
          }
          for (i = 0, d = byteOffset; i < byteLength; i += 1, d += 1) {
            this.buffer._bytes[d] = tmp[i];
          }
        } else {
          for (i = 0, s = array.byteOffset, d = byteOffset;
               i < byteLength; i += 1, s += 1, d += 1) {
            this.buffer._bytes[d] = array.buffer._bytes[s];
          }
        }
      } else if (typeof arguments[0] === 'object' && typeof arguments[0].length !== 'undefined') {
        // void set(sequence<type> array, optional unsigned long offset);
        sequence = arguments[0];
        len = ECMAScript.ToUint32(sequence.length);
        offset = ECMAScript.ToUint32(arguments[1]);

        if (offset + len > this.length) {
          throw new RangeError("Offset plus length of array is out of range");
        }

        for (i = 0; i < len; i += 1) {
          s = sequence[i];
          this._setter(offset + i, Number(s));
        }
      } else {
        throw new TypeError("Unexpected argument type(s)");
      }
    };

    // TypedArray subarray(long begin, optional long end);
    ctor.prototype.subarray = function(start, end) {
      function clamp(v, min, max) { return v < min ? min : v > max ? max : v; }

      start = ECMAScript.ToInt32(start);
      end = ECMAScript.ToInt32(end);

      if (arguments.length < 1) { start = 0; }
      if (arguments.length < 2) { end = this.length; }

      if (start < 0) { start = this.length + start; }
      if (end < 0) { end = this.length + end; }

      start = clamp(start, 0, this.length);
      end = clamp(end, 0, this.length);

      var len = end - start;
      if (len < 0) {
        len = 0;
      }

      return new this.constructor(
        this.buffer, this.byteOffset + start * this.BYTES_PER_ELEMENT, len);
    };

    return ctor;
  }

  var Int8Array = makeConstructor(1, packI8, unpackI8);
  var Uint8Array = makeConstructor(1, packU8, unpackU8);
  var Uint8ClampedArray = makeConstructor(1, packU8Clamped, unpackU8);
  var Int16Array = makeConstructor(2, packI16, unpackI16);
  var Uint16Array = makeConstructor(2, packU16, unpackU16);
  var Int32Array = makeConstructor(4, packI32, unpackI32);
  var Uint32Array = makeConstructor(4, packU32, unpackU32);
  var Float32Array = makeConstructor(4, packF32, unpackF32);
  var Float64Array = makeConstructor(8, packF64, unpackF64);

  exports.Int8Array = exports.Int8Array || Int8Array;
  exports.Uint8Array = exports.Uint8Array || Uint8Array;
  exports.Uint8ClampedArray = exports.Uint8ClampedArray || Uint8ClampedArray;
  exports.Int16Array = exports.Int16Array || Int16Array;
  exports.Uint16Array = exports.Uint16Array || Uint16Array;
  exports.Int32Array = exports.Int32Array || Int32Array;
  exports.Uint32Array = exports.Uint32Array || Uint32Array;
  exports.Float32Array = exports.Float32Array || Float32Array;
  exports.Float64Array = exports.Float64Array || Float64Array;
}());

//
// 6 The DataView View Type
//

(function() {
  function r(array, index) {
    return ECMAScript.IsCallable(array.get) ? array.get(index) : array[index];
  }

  var IS_BIG_ENDIAN = (function() {
    var u16array = new(exports.Uint16Array)([0x1234]),
        u8array = new(exports.Uint8Array)(u16array.buffer);
    return r(u8array, 0) === 0x12;
  }());

  // Constructor(ArrayBuffer buffer,
  //             optional unsigned long byteOffset,
  //             optional unsigned long byteLength)
  /** @constructor */
  var DataView = function DataView(buffer, byteOffset, byteLength) {
    if (arguments.length === 0) {
      buffer = new exports.ArrayBuffer(0);
    } else if (!(buffer instanceof exports.ArrayBuffer || ECMAScript.Class(buffer) === 'ArrayBuffer')) {
      throw new TypeError("TypeError");
    }

    this.buffer = buffer || new exports.ArrayBuffer(0);

    this.byteOffset = ECMAScript.ToUint32(byteOffset);
    if (this.byteOffset > this.buffer.byteLength) {
      throw new RangeError("byteOffset out of range");
    }

    if (arguments.length < 3) {
      this.byteLength = this.buffer.byteLength - this.byteOffset;
    } else {
      this.byteLength = ECMAScript.ToUint32(byteLength);
    }

    if ((this.byteOffset + this.byteLength) > this.buffer.byteLength) {
      throw new RangeError("byteOffset and length reference an area beyond the end of the buffer");
    }

    configureProperties(this);
  };

  function makeGetter(arrayType) {
    return function(byteOffset, littleEndian) {

      byteOffset = ECMAScript.ToUint32(byteOffset);

      if (byteOffset + arrayType.BYTES_PER_ELEMENT > this.byteLength) {
        throw new RangeError("Array index out of range");
      }
      byteOffset += this.byteOffset;

      var uint8Array = new exports.Uint8Array(this.buffer, byteOffset, arrayType.BYTES_PER_ELEMENT),
          bytes = [], i;
      for (i = 0; i < arrayType.BYTES_PER_ELEMENT; i += 1) {
        bytes.push(r(uint8Array, i));
      }

      if (Boolean(littleEndian) === Boolean(IS_BIG_ENDIAN)) {
        bytes.reverse();
      }

      return r(new arrayType(new exports.Uint8Array(bytes).buffer), 0);
    };
  }

  DataView.prototype.getUint8 = makeGetter(exports.Uint8Array);
  DataView.prototype.getInt8 = makeGetter(exports.Int8Array);
  DataView.prototype.getUint16 = makeGetter(exports.Uint16Array);
  DataView.prototype.getInt16 = makeGetter(exports.Int16Array);
  DataView.prototype.getUint32 = makeGetter(exports.Uint32Array);
  DataView.prototype.getInt32 = makeGetter(exports.Int32Array);
  DataView.prototype.getFloat32 = makeGetter(exports.Float32Array);
  DataView.prototype.getFloat64 = makeGetter(exports.Float64Array);

  function makeSetter(arrayType) {
    return function(byteOffset, value, littleEndian) {

      byteOffset = ECMAScript.ToUint32(byteOffset);
      if (byteOffset + arrayType.BYTES_PER_ELEMENT > this.byteLength) {
        throw new RangeError("Array index out of range");
      }

      // Get bytes
      var typeArray = new arrayType([value]),
          byteArray = new exports.Uint8Array(typeArray.buffer),
          bytes = [], i, byteView;

      for (i = 0; i < arrayType.BYTES_PER_ELEMENT; i += 1) {
        bytes.push(r(byteArray, i));
      }

      // Flip if necessary
      if (Boolean(littleEndian) === Boolean(IS_BIG_ENDIAN)) {
        bytes.reverse();
      }

      // Write them
      byteView = new exports.Uint8Array(this.buffer, byteOffset, arrayType.BYTES_PER_ELEMENT);
      byteView.set(bytes);
    };
  }

  DataView.prototype.setUint8 = makeSetter(exports.Uint8Array);
  DataView.prototype.setInt8 = makeSetter(exports.Int8Array);
  DataView.prototype.setUint16 = makeSetter(exports.Uint16Array);
  DataView.prototype.setInt16 = makeSetter(exports.Int16Array);
  DataView.prototype.setUint32 = makeSetter(exports.Uint32Array);
  DataView.prototype.setInt32 = makeSetter(exports.Int32Array);
  DataView.prototype.setFloat32 = makeSetter(exports.Float32Array);
  DataView.prototype.setFloat64 = makeSetter(exports.Float64Array);

  exports.DataView = exports.DataView || DataView;

}());

},{}],43:[function(require,module,exports){
var process=require("__browserify_process");// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

},{"__browserify_process":39}],44:[function(require,module,exports){
var global=typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};/*! http://mths.be/punycode v1.2.3 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports;
	var freeModule = typeof module == 'object' && module &&
		module.exports == freeExports && module;
	var freeGlobal = typeof global == 'object' && global;
	if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^ -~]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /\x2E|\u3002|\uFF0E|\uFF61/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		while (length--) {
			array[length] = fn(array[length]);
		}
		return array;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings.
	 * @private
	 * @param {String} domain The domain name.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		return map(string.split(regexSeparators), fn).join('.');
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <http://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * http://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    length,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols to a Punycode string of ASCII-only
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name to Unicode. Only the
	 * Punycoded parts of the domain name will be converted, i.e. it doesn't
	 * matter if you call it on a string that has already been converted to
	 * Unicode.
	 * @memberOf punycode
	 * @param {String} domain The Punycode domain name to convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(domain) {
		return mapDomain(domain, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name to Punycode. Only the
	 * non-ASCII parts of the domain name will be converted, i.e. it doesn't
	 * matter if you call it with a domain that's already in ASCII.
	 * @memberOf punycode
	 * @param {String} domain The domain name to convert, as a Unicode string.
	 * @returns {String} The Punycode representation of the given domain name.
	 */
	function toASCII(domain) {
		return mapDomain(domain, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.2.3',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <http://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define(function() {
			return punycode;
		});
	}	else if (freeExports && !freeExports.nodeType) {
		if (freeModule) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else { // in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

},{}],45:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],46:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return obj[k].map(function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],47:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":45,"./encode":46}],48:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.

module.exports = Duplex;
var inherits = require('inherits');
var setImmediate = require('process/browser.js').nextTick;
var Readable = require('./readable.js');
var Writable = require('./writable.js');

inherits(Duplex, Readable);

Duplex.prototype.write = Writable.prototype.write;
Duplex.prototype.end = Writable.prototype.end;
Duplex.prototype._write = Writable.prototype._write;

function Duplex(options) {
  if (!(this instanceof Duplex))
    return new Duplex(options);

  Readable.call(this, options);
  Writable.call(this, options);

  if (options && options.readable === false)
    this.readable = false;

  if (options && options.writable === false)
    this.writable = false;

  this.allowHalfOpen = true;
  if (options && options.allowHalfOpen === false)
    this.allowHalfOpen = false;

  this.once('end', onend);
}

// the no-half-open enforcer
function onend() {
  // if we allow half-open state, or if the writable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._writableState.ended)
    return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  var self = this;
  setImmediate(function () {
    self.end();
  });
}

},{"./readable.js":52,"./writable.js":54,"inherits":37,"process/browser.js":50}],49:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = Stream;

var EE = require('events').EventEmitter;
var inherits = require('inherits');

inherits(Stream, EE);
Stream.Readable = require('./readable.js');
Stream.Writable = require('./writable.js');
Stream.Duplex = require('./duplex.js');
Stream.Transform = require('./transform.js');
Stream.PassThrough = require('./passthrough.js');

// Backwards-compat with node 0.4.x
Stream.Stream = Stream;



// old-style streams.  Note that the pipe method (the only relevant
// part of this class) is overridden in the Readable class.

function Stream() {
  EE.call(this);
}

Stream.prototype.pipe = function(dest, options) {
  var source = this;

  function ondata(chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }

  source.on('data', ondata);

  function ondrain() {
    if (source.readable && source.resume) {
      source.resume();
    }
  }

  dest.on('drain', ondrain);

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once.
  if (!dest._isStdio && (!options || options.end !== false)) {
    source.on('end', onend);
    source.on('close', onclose);
  }

  var didOnEnd = false;
  function onend() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest.end();
  }


  function onclose() {
    if (didOnEnd) return;
    didOnEnd = true;

    if (typeof dest.destroy === 'function') dest.destroy();
  }

  // don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (EE.listenerCount(this, 'error') === 0) {
      throw er; // Unhandled stream error in pipe.
    }
  }

  source.on('error', onerror);
  dest.on('error', onerror);

  // remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata);
    dest.removeListener('drain', ondrain);

    source.removeListener('end', onend);
    source.removeListener('close', onclose);

    source.removeListener('error', onerror);
    dest.removeListener('error', onerror);

    source.removeListener('end', cleanup);
    source.removeListener('close', cleanup);

    dest.removeListener('close', cleanup);
  }

  source.on('end', cleanup);
  source.on('close', cleanup);

  dest.on('close', cleanup);

  dest.emit('pipe', source);

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};

},{"./duplex.js":48,"./passthrough.js":51,"./readable.js":52,"./transform.js":53,"./writable.js":54,"events":32,"inherits":37}],50:[function(require,module,exports){
module.exports=require(39)
},{}],51:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.

module.exports = PassThrough;

var Transform = require('./transform.js');
var inherits = require('inherits');
inherits(PassThrough, Transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough))
    return new PassThrough(options);

  Transform.call(this, options);
}

PassThrough.prototype._transform = function(chunk, encoding, cb) {
  cb(null, chunk);
};

},{"./transform.js":53,"inherits":37}],52:[function(require,module,exports){
var process=require("__browserify_process");// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = Readable;
Readable.ReadableState = ReadableState;

var EE = require('events').EventEmitter;
var Stream = require('./index.js');
var Buffer = require('buffer').Buffer;
var setImmediate = require('process/browser.js').nextTick;
var StringDecoder;

var inherits = require('inherits');
inherits(Readable, Stream);

function ReadableState(options, stream) {
  options = options || {};

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  var hwm = options.highWaterMark;
  this.highWaterMark = (hwm || hwm === 0) ? hwm : 16 * 1024;

  // cast to ints.
  this.highWaterMark = ~~this.highWaterMark;

  this.buffer = [];
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = false;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // In streams that never have any data, and do push(null) right away,
  // the consumer can miss the 'end' event if they do some I/O before
  // consuming the stream.  So, we don't emit('end') until some reading
  // happens.
  this.calledRead = false;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, becuase any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;


  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // when piping, we only care about 'readable' events that happen
  // after read()ing all the bytes and not getting any pushback.
  this.ranOut = false;

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;

  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    if (!StringDecoder)
      StringDecoder = require('string_decoder').StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

function Readable(options) {
  if (!(this instanceof Readable))
    return new Readable(options);

  this._readableState = new ReadableState(options, this);

  // legacy
  this.readable = true;

  Stream.call(this);
}

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function(chunk, encoding) {
  var state = this._readableState;

  if (typeof chunk === 'string' && !state.objectMode) {
    encoding = encoding || state.defaultEncoding;
    if (encoding !== state.encoding) {
      chunk = new Buffer(chunk, encoding);
      encoding = '';
    }
  }

  return readableAddChunk(this, state, chunk, encoding, false);
};

// Unshift should *always* be something directly out of read()
Readable.prototype.unshift = function(chunk) {
  var state = this._readableState;
  return readableAddChunk(this, state, chunk, '', true);
};

function readableAddChunk(stream, state, chunk, encoding, addToFront) {
  var er = chunkInvalid(state, chunk);
  if (er) {
    stream.emit('error', er);
  } else if (chunk === null || chunk === undefined) {
    state.reading = false;
    if (!state.ended)
      onEofChunk(stream, state);
  } else if (state.objectMode || chunk && chunk.length > 0) {
    if (state.ended && !addToFront) {
      var e = new Error('stream.push() after EOF');
      stream.emit('error', e);
    } else if (state.endEmitted && addToFront) {
      var e = new Error('stream.unshift() after end event');
      stream.emit('error', e);
    } else {
      if (state.decoder && !addToFront && !encoding)
        chunk = state.decoder.write(chunk);

      // update the buffer info.
      state.length += state.objectMode ? 1 : chunk.length;
      if (addToFront) {
        state.buffer.unshift(chunk);
      } else {
        state.reading = false;
        state.buffer.push(chunk);
      }

      if (state.needReadable)
        emitReadable(stream);

      maybeReadMore(stream, state);
    }
  } else if (!addToFront) {
    state.reading = false;
  }

  return needMoreData(state);
}



// if it's past the high water mark, we can push in some more.
// Also, if we have no data yet, we can stand some
// more bytes.  This is to work around cases where hwm=0,
// such as the repl.  Also, if the push() triggered a
// readable event, and the user called read(largeNumber) such that
// needReadable was set, then we ought to push more, so that another
// 'readable' event will be triggered.
function needMoreData(state) {
  return !state.ended &&
         (state.needReadable ||
          state.length < state.highWaterMark ||
          state.length === 0);
}

// backwards compatibility.
Readable.prototype.setEncoding = function(enc) {
  if (!StringDecoder)
    StringDecoder = require('string_decoder').StringDecoder;
  this._readableState.decoder = new StringDecoder(enc);
  this._readableState.encoding = enc;
};

// Don't raise the hwm > 128MB
var MAX_HWM = 0x800000;
function roundUpToNextPowerOf2(n) {
  if (n >= MAX_HWM) {
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2
    n--;
    for (var p = 1; p < 32; p <<= 1) n |= n >> p;
    n++;
  }
  return n;
}

function howMuchToRead(n, state) {
  if (state.length === 0 && state.ended)
    return 0;

  if (state.objectMode)
    return n === 0 ? 0 : 1;

  if (isNaN(n) || n === null) {
    // only flow one buffer at a time
    if (state.flowing && state.buffer.length)
      return state.buffer[0].length;
    else
      return state.length;
  }

  if (n <= 0)
    return 0;

  // If we're asking for more than the target buffer level,
  // then raise the water mark.  Bump up to the next highest
  // power of 2, to prevent increasing it excessively in tiny
  // amounts.
  if (n > state.highWaterMark)
    state.highWaterMark = roundUpToNextPowerOf2(n);

  // don't have that much.  return null, unless we've ended.
  if (n > state.length) {
    if (!state.ended) {
      state.needReadable = true;
      return 0;
    } else
      return state.length;
  }

  return n;
}

// you can override either this method, or the async _read(n) below.
Readable.prototype.read = function(n) {
  var state = this._readableState;
  state.calledRead = true;
  var nOrig = n;

  if (typeof n !== 'number' || n > 0)
    state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 &&
      state.needReadable &&
      (state.length >= state.highWaterMark || state.ended)) {
    emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0)
      endReadable(this);
    return null;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;

  // if we currently have less than the highWaterMark, then also read some
  if (state.length - n <= state.highWaterMark)
    doRead = true;

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading)
    doRead = false;

  if (doRead) {
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0)
      state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
  }

  // If _read called its callback synchronously, then `reading`
  // will be false, and we need to re-evaluate how much data we
  // can return to the user.
  if (doRead && !state.reading)
    n = howMuchToRead(nOrig, state);

  var ret;
  if (n > 0)
    ret = fromList(n, state);
  else
    ret = null;

  if (ret === null) {
    state.needReadable = true;
    n = 0;
  }

  state.length -= n;

  // If we have nothing in the buffer, then we want to know
  // as soon as we *do* get something into the buffer.
  if (state.length === 0 && !state.ended)
    state.needReadable = true;

  // If we happened to read() exactly the remaining amount in the
  // buffer, and the EOF has been seen at this point, then make sure
  // that we emit 'end' on the very next tick.
  if (state.ended && !state.endEmitted && state.length === 0)
    endReadable(this);

  return ret;
};

function chunkInvalid(state, chunk) {
  var er = null;
  if (!Buffer.isBuffer(chunk) &&
      'string' !== typeof chunk &&
      chunk !== null &&
      chunk !== undefined &&
      !state.objectMode &&
      !er) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  return er;
}


function onEofChunk(stream, state) {
  if (state.decoder && !state.ended) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;

  // if we've ended and we have some data left, then emit
  // 'readable' now to make sure it gets picked up.
  if (state.length > 0)
    emitReadable(stream);
  else
    endReadable(stream);
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  var state = stream._readableState;
  state.needReadable = false;
  if (state.emittedReadable)
    return;

  state.emittedReadable = true;
  if (state.sync)
    setImmediate(function() {
      emitReadable_(stream);
    });
  else
    emitReadable_(stream);
}

function emitReadable_(stream) {
  stream.emit('readable');
}


// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    setImmediate(function() {
      maybeReadMore_(stream, state);
    });
  }
}

function maybeReadMore_(stream, state) {
  var len = state.length;
  while (!state.reading && !state.flowing && !state.ended &&
         state.length < state.highWaterMark) {
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;
    else
      len = state.length;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read = function(n) {
  this.emit('error', new Error('not implemented'));
};

Readable.prototype.pipe = function(dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;

  var doEnd = (!pipeOpts || pipeOpts.end !== false) &&
              dest !== process.stdout &&
              dest !== process.stderr;

  var endFn = doEnd ? onend : cleanup;
  if (state.endEmitted)
    setImmediate(endFn);
  else
    src.once('end', endFn);

  dest.on('unpipe', onunpipe);
  function onunpipe(readable) {
    if (readable !== src) return;
    cleanup();
  }

  function onend() {
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);

  function cleanup() {
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', cleanup);

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (!dest._writableState || dest._writableState.needDrain)
      ondrain();
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  // check for listeners before emit removes one-time listeners.
  var errListeners = EE.listenerCount(dest, 'error');
  function onerror(er) {
    unpipe();
    if (errListeners === 0 && EE.listenerCount(dest, 'error') === 0)
      dest.emit('error', er);
  }
  dest.once('error', onerror);

  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);

  function unpipe() {
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    // the handler that waits for readable events after all
    // the data gets sucked out in flow.
    // This would be easier to follow with a .once() handler
    // in flow(), but that is too slow.
    this.on('readable', pipeOnReadable);

    state.flowing = true;
    setImmediate(function() {
      flow(src);
    });
  }

  return dest;
};

function pipeOnDrain(src) {
  return function() {
    var dest = this;
    var state = src._readableState;
    state.awaitDrain--;
    if (state.awaitDrain === 0)
      flow(src);
  };
}

function flow(src) {
  var state = src._readableState;
  var chunk;
  state.awaitDrain = 0;

  function write(dest, i, list) {
    var written = dest.write(chunk);
    if (false === written) {
      state.awaitDrain++;
    }
  }

  while (state.pipesCount && null !== (chunk = src.read())) {

    if (state.pipesCount === 1)
      write(state.pipes, 0, null);
    else
      forEach(state.pipes, write);

    src.emit('data', chunk);

    // if anyone needs a drain, then we have to wait for that.
    if (state.awaitDrain > 0)
      return;
  }

  // if every destination was unpiped, either before entering this
  // function, or in the while loop, then stop flowing.
  //
  // NB: This is a pretty rare edge case.
  if (state.pipesCount === 0) {
    state.flowing = false;

    // if there were data event listeners added, then switch to old mode.
    if (EE.listenerCount(src, 'data') > 0)
      emitDataEvents(src);
    return;
  }

  // at this point, no one needed a drain, so we just ran out of data
  // on the next readable event, start it over again.
  state.ranOut = true;
}

function pipeOnReadable() {
  if (this._readableState.ranOut) {
    this._readableState.ranOut = false;
    flow(this);
  }
}


Readable.prototype.unpipe = function(dest) {
  var state = this._readableState;

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0)
    return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes)
      return this;

    if (!dest)
      dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    this.removeListener('readable', pipeOnReadable);
    state.flowing = false;
    if (dest)
      dest.emit('unpipe', this);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    this.removeListener('readable', pipeOnReadable);
    state.flowing = false;

    for (var i = 0; i < len; i++)
      dests[i].emit('unpipe', this);
    return this;
  }

  // try to find the right one.
  var i = indexOf(state.pipes, dest);
  if (i === -1)
    return this;

  state.pipes.splice(i, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1)
    state.pipes = state.pipes[0];

  dest.emit('unpipe', this);

  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on = function(ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);

  if (ev === 'data' && !this._readableState.flowing)
    emitDataEvents(this);

  if (ev === 'readable' && this.readable) {
    var state = this._readableState;
    if (!state.readableListening) {
      state.readableListening = true;
      state.emittedReadable = false;
      state.needReadable = true;
      if (!state.reading) {
        this.read(0);
      } else if (state.length) {
        emitReadable(this, state);
      }
    }
  }

  return res;
};
Readable.prototype.addListener = Readable.prototype.on;

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function() {
  emitDataEvents(this);
  this.read(0);
  this.emit('resume');
};

Readable.prototype.pause = function() {
  emitDataEvents(this, true);
  this.emit('pause');
};

function emitDataEvents(stream, startPaused) {
  var state = stream._readableState;

  if (state.flowing) {
    // https://github.com/isaacs/readable-stream/issues/16
    throw new Error('Cannot switch to old mode now.');
  }

  var paused = startPaused || false;
  var readable = false;

  // convert to an old-style stream.
  stream.readable = true;
  stream.pipe = Stream.prototype.pipe;
  stream.on = stream.addListener = Stream.prototype.on;

  stream.on('readable', function() {
    readable = true;

    var c;
    while (!paused && (null !== (c = stream.read())))
      stream.emit('data', c);

    if (c === null) {
      readable = false;
      stream._readableState.needReadable = true;
    }
  });

  stream.pause = function() {
    paused = true;
    this.emit('pause');
  };

  stream.resume = function() {
    paused = false;
    if (readable)
      setImmediate(function() {
        stream.emit('readable');
      });
    else
      this.read(0);
    this.emit('resume');
  };

  // now make it start, just in case it hadn't already.
  stream.emit('readable');
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap = function(stream) {
  var state = this._readableState;
  var paused = false;

  var self = this;
  stream.on('end', function() {
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length)
        self.push(chunk);
    }

    self.push(null);
  });

  stream.on('data', function(chunk) {
    if (state.decoder)
      chunk = state.decoder.write(chunk);
    if (!chunk || !state.objectMode && !chunk.length)
      return;

    var ret = self.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (typeof stream[i] === 'function' &&
        typeof this[i] === 'undefined') {
      this[i] = function(method) { return function() {
        return stream[method].apply(stream, arguments);
      }}(i);
    }
  }

  // proxy certain important events.
  var events = ['error', 'close', 'destroy', 'pause', 'resume'];
  forEach(events, function(ev) {
    stream.on(ev, function (x) {
      return self.emit.apply(self, ev, x);
    });
  });

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  self._read = function(n) {
    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return self;
};



// exposed for testing purposes only.
Readable._fromList = fromList;

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
function fromList(n, state) {
  var list = state.buffer;
  var length = state.length;
  var stringMode = !!state.decoder;
  var objectMode = !!state.objectMode;
  var ret;

  // nothing in the list, definitely empty.
  if (list.length === 0)
    return null;

  if (length === 0)
    ret = null;
  else if (objectMode)
    ret = list.shift();
  else if (!n || n >= length) {
    // read it all, truncate the array.
    if (stringMode)
      ret = list.join('');
    else
      ret = Buffer.concat(list, length);
    list.length = 0;
  } else {
    // read just some of it.
    if (n < list[0].length) {
      // just take a part of the first list item.
      // slice is the same for buffers and strings.
      var buf = list[0];
      ret = buf.slice(0, n);
      list[0] = buf.slice(n);
    } else if (n === list[0].length) {
      // first list is a perfect match
      ret = list.shift();
    } else {
      // complex case.
      // we have enough to cover it, but it spans past the first buffer.
      if (stringMode)
        ret = '';
      else
        ret = new Buffer(n);

      var c = 0;
      for (var i = 0, l = list.length; i < l && c < n; i++) {
        var buf = list[0];
        var cpy = Math.min(n - c, buf.length);

        if (stringMode)
          ret += buf.slice(0, cpy);
        else
          buf.copy(ret, c, 0, cpy);

        if (cpy < buf.length)
          list[0] = buf.slice(cpy);
        else
          list.shift();

        c += cpy;
      }
    }
  }

  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;

  // If we get here before consuming all the bytes, then that is a
  // bug in node.  Should never happen.
  if (state.length > 0)
    throw new Error('endReadable called on non-empty stream');

  if (!state.endEmitted && state.calledRead) {
    state.ended = true;
    setImmediate(function() {
      // Check that we didn't get one last unshift.
      if (!state.endEmitted && state.length === 0) {
        state.endEmitted = true;
        stream.readable = false;
        stream.emit('end');
      }
    });
  }
}

function forEach (xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}

function indexOf (xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}

},{"./index.js":49,"__browserify_process":39,"buffer":40,"events":32,"inherits":37,"process/browser.js":50,"string_decoder":55}],53:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.

module.exports = Transform;

var Duplex = require('./duplex.js');
var inherits = require('inherits');
inherits(Transform, Duplex);


function TransformState(options, stream) {
  this.afterTransform = function(er, data) {
    return afterTransform(stream, er, data);
  };

  this.needTransform = false;
  this.transforming = false;
  this.writecb = null;
  this.writechunk = null;
}

function afterTransform(stream, er, data) {
  var ts = stream._transformState;
  ts.transforming = false;

  var cb = ts.writecb;

  if (!cb)
    return stream.emit('error', new Error('no writecb in Transform class'));

  ts.writechunk = null;
  ts.writecb = null;

  if (data !== null && data !== undefined)
    stream.push(data);

  if (cb)
    cb(er);

  var rs = stream._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    stream._read(rs.highWaterMark);
  }
}


function Transform(options) {
  if (!(this instanceof Transform))
    return new Transform(options);

  Duplex.call(this, options);

  var ts = this._transformState = new TransformState(options, this);

  // when the writable side finishes, then flush out anything remaining.
  var stream = this;

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;

  this.once('finish', function() {
    if ('function' === typeof this._flush)
      this._flush(function(er) {
        done(stream, er);
      });
    else
      done(stream);
  });
}

Transform.prototype.push = function(chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform.prototype._transform = function(chunk, encoding, cb) {
  throw new Error('not implemented');
};

Transform.prototype._write = function(chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform ||
        rs.needReadable ||
        rs.length < rs.highWaterMark)
      this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform.prototype._read = function(n) {
  var ts = this._transformState;

  if (ts.writechunk && ts.writecb && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};


function done(stream, er) {
  if (er)
    return stream.emit('error', er);

  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  var ws = stream._writableState;
  var rs = stream._readableState;
  var ts = stream._transformState;

  if (ws.length)
    throw new Error('calling transform done when ws.length != 0');

  if (ts.transforming)
    throw new Error('calling transform done when still transforming');

  return stream.push(null);
}

},{"./duplex.js":48,"inherits":37}],54:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// A bit simpler than readable streams.
// Implement an async ._write(chunk, cb), and it'll handle all
// the drain event emission and buffering.

module.exports = Writable;
Writable.WritableState = WritableState;

var isUint8Array = typeof Uint8Array !== 'undefined'
  ? function (x) { return x instanceof Uint8Array }
  : function (x) {
    return x && x.constructor && x.constructor.name === 'Uint8Array'
  }
;
var isArrayBuffer = typeof ArrayBuffer !== 'undefined'
  ? function (x) { return x instanceof ArrayBuffer }
  : function (x) {
    return x && x.constructor && x.constructor.name === 'ArrayBuffer'
  }
;

var inherits = require('inherits');
var Stream = require('./index.js');
var setImmediate = require('process/browser.js').nextTick;
var Buffer = require('buffer').Buffer;

inherits(Writable, Stream);

function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
}

function WritableState(options, stream) {
  options = options || {};

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  var hwm = options.highWaterMark;
  this.highWaterMark = (hwm || hwm === 0) ? hwm : 16 * 1024;

  // object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!options.objectMode;

  // cast to ints.
  this.highWaterMark = ~~this.highWaterMark;

  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, becuase any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function(er) {
    onwrite(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;

  this.buffer = [];
}

function Writable(options) {
  // Writable ctor is applied to Duplexes, though they're not
  // instanceof Writable, they're instanceof Readable.
  if (!(this instanceof Writable) && !(this instanceof Stream.Duplex))
    return new Writable(options);

  this._writableState = new WritableState(options, this);

  // legacy.
  this.writable = true;

  Stream.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe = function() {
  this.emit('error', new Error('Cannot pipe. Not readable.'));
};


function writeAfterEnd(stream, state, cb) {
  var er = new Error('write after end');
  // TODO: defer error events consistently everywhere, not just the cb
  stream.emit('error', er);
  setImmediate(function() {
    cb(er);
  });
}

// If we get something that is not a buffer, string, null, or undefined,
// and we're not in objectMode, then that's an error.
// Otherwise stream chunks are all considered to be of length=1, and the
// watermarks determine how many objects to keep in the buffer, rather than
// how many bytes or characters.
function validChunk(stream, state, chunk, cb) {
  var valid = true;
  if (!Buffer.isBuffer(chunk) &&
      'string' !== typeof chunk &&
      chunk !== null &&
      chunk !== undefined &&
      !state.objectMode) {
    var er = new TypeError('Invalid non-string/buffer chunk');
    stream.emit('error', er);
    setImmediate(function() {
      cb(er);
    });
    valid = false;
  }
  return valid;
}

Writable.prototype.write = function(chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;

  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (!Buffer.isBuffer(chunk) && isUint8Array(chunk))
    chunk = new Buffer(chunk);
  if (isArrayBuffer(chunk) && typeof Uint8Array !== 'undefined')
    chunk = new Buffer(new Uint8Array(chunk));
  
  if (Buffer.isBuffer(chunk))
    encoding = 'buffer';
  else if (!encoding)
    encoding = state.defaultEncoding;

  if (typeof cb !== 'function')
    cb = function() {};

  if (state.ended)
    writeAfterEnd(this, state, cb);
  else if (validChunk(this, state, chunk, cb))
    ret = writeOrBuffer(this, state, chunk, encoding, cb);

  return ret;
};

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode &&
      state.decodeStrings !== false &&
      typeof chunk === 'string') {
    chunk = new Buffer(chunk, encoding);
  }
  return chunk;
}

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, chunk, encoding, cb) {
  chunk = decodeChunk(state, chunk, encoding);
  var len = state.objectMode ? 1 : chunk.length;

  state.length += len;

  var ret = state.length < state.highWaterMark;
  state.needDrain = !ret;

  if (state.writing)
    state.buffer.push(new WriteReq(chunk, encoding, cb));
  else
    doWrite(stream, state, len, chunk, encoding, cb);

  return ret;
}

function doWrite(stream, state, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  if (sync)
    setImmediate(function() {
      cb(er);
    });
  else
    cb(er);

  stream.emit('error', er);
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;

  onwriteStateUpdate(state);

  if (er)
    onwriteError(stream, state, sync, er, cb);
  else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(stream, state);

    if (!finished && !state.bufferProcessing && state.buffer.length)
      clearBuffer(stream, state);

    if (sync) {
      setImmediate(function() {
        afterWrite(stream, state, finished, cb);
      });
    } else {
      afterWrite(stream, state, finished, cb);
    }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished)
    onwriteDrain(stream, state);
  cb();
  if (finished)
    finishMaybe(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}


// if there's something in the buffer waiting, then process it
function clearBuffer(stream, state) {
  state.bufferProcessing = true;

  for (var c = 0; c < state.buffer.length; c++) {
    var entry = state.buffer[c];
    var chunk = entry.chunk;
    var encoding = entry.encoding;
    var cb = entry.callback;
    var len = state.objectMode ? 1 : chunk.length;

    doWrite(stream, state, len, chunk, encoding, cb);

    // if we didn't call the onwrite immediately, then
    // it means that we need to wait until it does.
    // also, that means that the chunk and cb are currently
    // being processed, so move the buffer counter past them.
    if (state.writing) {
      c++;
      break;
    }
  }

  state.bufferProcessing = false;
  if (c < state.buffer.length)
    state.buffer = state.buffer.slice(c);
  else
    state.buffer.length = 0;
}

Writable.prototype._write = function(chunk, encoding, cb) {
  cb(new Error('not implemented'));
};

Writable.prototype.end = function(chunk, encoding, cb) {
  var state = this._writableState;

  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (typeof chunk !== 'undefined' && chunk !== null)
    this.write(chunk, encoding);

  // ignore unnecessary end() calls.
  if (!state.ending && !state.finished)
    endWritable(this, state, cb);
};


function needFinish(stream, state) {
  return (state.ending &&
          state.length === 0 &&
          !state.finished &&
          !state.writing);
}

function finishMaybe(stream, state) {
  var need = needFinish(stream, state);
  if (need) {
    state.finished = true;
    stream.emit('finish');
  }
  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);
  if (cb) {
    if (state.finished)
      setImmediate(cb);
    else
      stream.once('finish', cb);
  }
  state.ended = true;
}

},{"./index.js":49,"buffer":40,"inherits":37,"process/browser.js":50}],55:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var Buffer = require('buffer').Buffer;

function assertEncoding(encoding) {
  if (encoding && !Buffer.isEncoding(encoding)) {
    throw new Error('Unknown encoding: ' + encoding);
  }
}

var StringDecoder = exports.StringDecoder = function(encoding) {
  this.encoding = (encoding || 'utf8').toLowerCase().replace(/[-_]/, '');
  assertEncoding(encoding);
  switch (this.encoding) {
    case 'utf8':
      // CESU-8 represents each of Surrogate Pair by 3-bytes
      this.surrogateSize = 3;
      break;
    case 'ucs2':
    case 'utf16le':
      // UTF-16 represents each of Surrogate Pair by 2-bytes
      this.surrogateSize = 2;
      this.detectIncompleteChar = utf16DetectIncompleteChar;
      break;
    case 'base64':
      // Base-64 stores 3 bytes in 4 chars, and pads the remainder.
      this.surrogateSize = 3;
      this.detectIncompleteChar = base64DetectIncompleteChar;
      break;
    default:
      this.write = passThroughWrite;
      return;
  }

  this.charBuffer = new Buffer(6);
  this.charReceived = 0;
  this.charLength = 0;
};


StringDecoder.prototype.write = function(buffer) {
  var charStr = '';
  var offset = 0;

  // if our last write ended with an incomplete multibyte character
  while (this.charLength) {
    // determine how many remaining bytes this buffer has to offer for this char
    var i = (buffer.length >= this.charLength - this.charReceived) ?
                this.charLength - this.charReceived :
                buffer.length;

    // add the new bytes to the char buffer
    buffer.copy(this.charBuffer, this.charReceived, offset, i);
    this.charReceived += (i - offset);
    offset = i;

    if (this.charReceived < this.charLength) {
      // still not enough chars in this buffer? wait for more ...
      return '';
    }

    // get the character that was split
    charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding);

    // lead surrogate (D800-DBFF) is also the incomplete character
    var charCode = charStr.charCodeAt(charStr.length - 1);
    if (charCode >= 0xD800 && charCode <= 0xDBFF) {
      this.charLength += this.surrogateSize;
      charStr = '';
      continue;
    }
    this.charReceived = this.charLength = 0;

    // if there are no more bytes in this buffer, just emit our char
    if (i == buffer.length) return charStr;

    // otherwise cut off the characters end from the beginning of this buffer
    buffer = buffer.slice(i, buffer.length);
    break;
  }

  var lenIncomplete = this.detectIncompleteChar(buffer);

  var end = buffer.length;
  if (this.charLength) {
    // buffer the incomplete character bytes we got
    buffer.copy(this.charBuffer, 0, buffer.length - lenIncomplete, end);
    this.charReceived = lenIncomplete;
    end -= lenIncomplete;
  }

  charStr += buffer.toString(this.encoding, 0, end);

  var end = charStr.length - 1;
  var charCode = charStr.charCodeAt(end);
  // lead surrogate (D800-DBFF) is also the incomplete character
  if (charCode >= 0xD800 && charCode <= 0xDBFF) {
    var size = this.surrogateSize;
    this.charLength += size;
    this.charReceived += size;
    this.charBuffer.copy(this.charBuffer, size, 0, size);
    this.charBuffer.write(charStr.charAt(charStr.length - 1), this.encoding);
    return charStr.substring(0, end);
  }

  // or just emit the charStr
  return charStr;
};

StringDecoder.prototype.detectIncompleteChar = function(buffer) {
  // determine how many bytes we have to check at the end of this buffer
  var i = (buffer.length >= 3) ? 3 : buffer.length;

  // Figure out if one of the last i bytes of our buffer announces an
  // incomplete char.
  for (; i > 0; i--) {
    var c = buffer[buffer.length - i];

    // See http://en.wikipedia.org/wiki/UTF-8#Description

    // 110XXXXX
    if (i == 1 && c >> 5 == 0x06) {
      this.charLength = 2;
      break;
    }

    // 1110XXXX
    if (i <= 2 && c >> 4 == 0x0E) {
      this.charLength = 3;
      break;
    }

    // 11110XXX
    if (i <= 3 && c >> 3 == 0x1E) {
      this.charLength = 4;
      break;
    }
  }

  return i;
};

StringDecoder.prototype.end = function(buffer) {
  var res = '';
  if (buffer && buffer.length)
    res = this.write(buffer);

  if (this.charReceived) {
    var cr = this.charReceived;
    var buf = this.charBuffer;
    var enc = this.encoding;
    res += buf.slice(0, cr).toString(enc);
  }

  return res;
};

function passThroughWrite(buffer) {
  return buffer.toString(this.encoding);
}

function utf16DetectIncompleteChar(buffer) {
  var incomplete = this.charReceived = buffer.length % 2;
  this.charLength = incomplete ? 2 : 0;
  return incomplete;
}

function base64DetectIncompleteChar(buffer) {
  var incomplete = this.charReceived = buffer.length % 3;
  this.charLength = incomplete ? 3 : 0;
  return incomplete;
}

},{"buffer":40}],56:[function(require,module,exports){
/*jshint strict:true node:true es5:true onevar:true laxcomma:true laxbreak:true eqeqeq:true immed:true latedef:true*/
(function () {
  "use strict";

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var punycode = require('punycode');

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '~', '`'].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(delims),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#']
      .concat(unwise).concat(autoEscape),
    nonAuthChars = ['/', '@', '?', '#'].concat(delims),
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[a-zA-Z0-9][a-z0-9A-Z_-]{0,62}$/,
    hostnamePartStart = /^([a-zA-Z0-9][a-z0-9A-Z_-]{0,62})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always have a path component.
    pathedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = require('querystring');

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && typeof(url) === 'object' && url.href) return url;

  if (typeof url !== 'string') {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  var out = {},
      rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    out.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      out.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {
    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    // don't enforce full RFC correctness, just be unstupid about it.

    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the first @ sign, unless some non-auth character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    var atSign = rest.indexOf('@');
    if (atSign !== -1) {
      var auth = rest.slice(0, atSign);

      // there *may be* an auth
      var hasAuth = true;
      for (var i = 0, l = nonAuthChars.length; i < l; i++) {
        if (auth.indexOf(nonAuthChars[i]) !== -1) {
          // not a valid auth.  Something like http://foo.com/bar@baz/
          hasAuth = false;
          break;
        }
      }

      if (hasAuth) {
        // pluck off the auth portion.
        out.auth = decodeURIComponent(auth);
        rest = rest.substr(atSign + 1);
      }
    }

    var firstNonHost = -1;
    for (var i = 0, l = nonHostChars.length; i < l; i++) {
      var index = rest.indexOf(nonHostChars[i]);
      if (index !== -1 &&
          (firstNonHost < 0 || index < firstNonHost)) firstNonHost = index;
    }

    if (firstNonHost !== -1) {
      out.host = rest.substr(0, firstNonHost);
      rest = rest.substr(firstNonHost);
    } else {
      out.host = rest;
      rest = '';
    }

    // pull out port.
    var p = parseHost(out.host);
    var keys = Object.keys(p);
    for (var i = 0, l = keys.length; i < l; i++) {
      var key = keys[i];
      out[key] = p[key];
    }

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    out.hostname = out.hostname || '';

    // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    var ipv6Hostname = out.hostname[0] === '[' &&
        out.hostname[out.hostname.length - 1] === ']';

    // validate a little.
    if (out.hostname.length > hostnameMaxLen) {
      out.hostname = '';
    } else if (!ipv6Hostname) {
      var hostparts = out.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            out.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    // hostnames are always lower case.
    out.hostname = out.hostname.toLowerCase();

    if (!ipv6Hostname) {
      // IDNA Support: Returns a puny coded representation of "domain".
      // It only converts the part of the domain name that
      // has non ASCII characters. I.e. it dosent matter if
      // you call it with a domain that already is in ASCII.
      var domainArray = out.hostname.split('.');
      var newOut = [];
      for (var i = 0; i < domainArray.length; ++i) {
        var s = domainArray[i];
        newOut.push(s.match(/[^A-Za-z0-9_-]/) ?
            'xn--' + punycode.encode(s) : s);
      }
      out.hostname = newOut.join('.');
    }

    out.host = (out.hostname || '') +
        ((out.port) ? ':' + out.port : '');
    out.href += out.host;

    // strip [ and ] from the hostname
    if (ipv6Hostname) {
      out.hostname = out.hostname.substr(1, out.hostname.length - 2);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    out.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    out.search = rest.substr(qm);
    out.query = rest.substr(qm + 1);
    if (parseQueryString) {
      out.query = querystring.parse(out.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    out.search = '';
    out.query = {};
  }
  if (rest) out.pathname = rest;
  if (slashedProtocol[proto] &&
      out.hostname && !out.pathname) {
    out.pathname = '/';
  }

  //to support http.request
  if (out.pathname || out.search) {
    out.path = (out.pathname ? out.pathname : '') +
               (out.search ? out.search : '');
  }

  // finally, reconstruct the href based on what has been validated.
  out.href = urlFormat(out);
  return out;
}

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (typeof(obj) === 'string') obj = urlParse(obj);

  var auth = obj.auth || '';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, ':');
    auth += '@';
  }

  var protocol = obj.protocol || '',
      pathname = obj.pathname || '',
      hash = obj.hash || '',
      host = false,
      query = '';

  if (obj.host !== undefined) {
    host = auth + obj.host;
  } else if (obj.hostname !== undefined) {
    host = auth + (obj.hostname.indexOf(':') === -1 ?
        obj.hostname :
        '[' + obj.hostname + ']');
    if (obj.port) {
      host += ':' + obj.port;
    }
  }

  if (obj.query && typeof obj.query === 'object' &&
      Object.keys(obj.query).length) {
    query = querystring.stringify(obj.query);
  }

  var search = obj.search || (query && ('?' + query)) || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (obj.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  return protocol + host + pathname + search + hash;
}

function urlResolve(source, relative) {
  return urlFormat(urlResolveObject(source, relative));
}

function urlResolveObject(source, relative) {
  if (!source) return relative;

  source = urlParse(urlFormat(source), false, true);
  relative = urlParse(urlFormat(relative), false, true);

  // hash is always overridden, no matter what.
  source.hash = relative.hash;

  if (relative.href === '') {
    source.href = urlFormat(source);
    return source;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    relative.protocol = source.protocol;
    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[relative.protocol] &&
        relative.hostname && !relative.pathname) {
      relative.path = relative.pathname = '/';
    }
    relative.href = urlFormat(relative);
    return relative;
  }

  if (relative.protocol && relative.protocol !== source.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      relative.href = urlFormat(relative);
      return relative;
    }
    source.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      relative.pathname = relPath.join('/');
    }
    source.pathname = relative.pathname;
    source.search = relative.search;
    source.query = relative.query;
    source.host = relative.host || '';
    source.auth = relative.auth;
    source.hostname = relative.hostname || relative.host;
    source.port = relative.port;
    //to support http.request
    if (source.pathname !== undefined || source.search !== undefined) {
      source.path = (source.pathname ? source.pathname : '') +
                    (source.search ? source.search : '');
    }
    source.slashes = source.slashes || relative.slashes;
    source.href = urlFormat(source);
    return source;
  }

  var isSourceAbs = (source.pathname && source.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host !== undefined ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (source.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = source.pathname && source.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = source.protocol &&
          !slashedProtocol[source.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // source.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {

    delete source.hostname;
    delete source.port;
    if (source.host) {
      if (srcPath[0] === '') srcPath[0] = source.host;
      else srcPath.unshift(source.host);
    }
    delete source.host;
    if (relative.protocol) {
      delete relative.hostname;
      delete relative.port;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      delete relative.host;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    source.host = (relative.host || relative.host === '') ?
                      relative.host : source.host;
    source.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : source.hostname;
    source.search = relative.search;
    source.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    source.search = relative.search;
    source.query = relative.query;
  } else if ('search' in relative) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      source.hostname = source.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especialy happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = source.host && source.host.indexOf('@') > 0 ?
                       source.host.split('@') : false;
      if (authInHost) {
        source.auth = authInHost.shift();
        source.host = source.hostname = authInHost.shift();
      }
    }
    source.search = relative.search;
    source.query = relative.query;
    //to support http.request
    if (source.pathname !== undefined || source.search !== undefined) {
      source.path = (source.pathname ? source.pathname : '') +
                    (source.search ? source.search : '');
    }
    source.href = urlFormat(source);
    return source;
  }
  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    delete source.pathname;
    //to support http.request
    if (!source.search) {
      source.path = '/' + source.search;
    } else {
      delete source.path;
    }
    source.href = urlFormat(source);
    return source;
  }
  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (source.host || relative.host) && (last === '.' || last === '..') ||
      last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last == '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    source.hostname = source.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especialy happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = source.host && source.host.indexOf('@') > 0 ?
                     source.host.split('@') : false;
    if (authInHost) {
      source.auth = authInHost.shift();
      source.host = source.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (source.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  source.pathname = srcPath.join('/');
  //to support request.http
  if (source.pathname !== undefined || source.search !== undefined) {
    source.path = (source.pathname ? source.pathname : '') +
                  (source.search ? source.search : '');
  }
  source.auth = relative.auth || source.auth;
  source.slashes = source.slashes || relative.slashes;
  source.href = urlFormat(source);
  return source;
}

function parseHost(host) {
  var out = {};
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      out.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) out.hostname = host;
  return out;
}

}());

},{"punycode":44,"querystring":47}],57:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],58:[function(require,module,exports){
var process=require("__browserify_process"),global=typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

},{"./support/isBuffer":57,"__browserify_process":39,"inherits":37}],59:[function(require,module,exports){

/*
The original version of this code is taken from Douglas Crockford's json2.js:
https://github.com/douglascrockford/JSON-js/blob/master/json2.js

I made some modifications to ensure a canonical output.
*/

function f(n) {
    // Format integers to have at least two digits.
    return n < 10 ? '0' + n : n;
}

var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
    escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
    gap,
    indent,
    meta = {    // table of character substitutions
        '\b': '\\b',
        '\t': '\\t',
        '\n': '\\n',
        '\f': '\\f',
        '\r': '\\r',
        '"' : '\\"',
        '\\': '\\\\'
    },
    rep;


function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

    escapable.lastIndex = 0;
    return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
        var c = meta[a];
        return typeof c === 'string'
            ? c
            : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
    }) + '"' : '"' + string + '"';
}


function str(key, holder) {

// Produce a string from holder[key].

    var i,          // The loop counter.
        k,          // The member key.
        v,          // The member value.
        length,
        mind = gap,
        partial,
        value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

    if (value && typeof value === 'object' &&
            typeof value.toJSON === 'function') {
        value = value.toJSON(key);
    }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

    if (typeof rep === 'function') {
        value = rep.call(holder, key, value);
    }

// What happens next depends on the value's type.

    switch (typeof value) {
    case 'string':
        return quote(value);

    case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

        return isFinite(value) ? String(value) : 'null';

    case 'boolean':
    case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

        return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

    case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

        if (!value) {
            return 'null';
        }

// Make an array to hold the partial results of stringifying this object value.

        gap += indent;
        partial = [];

// Is the value an array?

        if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

            length = value.length;
            for (i = 0; i < length; i += 1) {
                partial[i] = str(i, value) || 'null';
            }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

            v = partial.length === 0
                ? '[]'
                : gap
                ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
                : '[' + partial.join(',') + ']';
            gap = mind;
            return v;
        }

// If the replacer is an array, use it to select the members to be stringified.

        if (rep && typeof rep === 'object') {
            length = rep.length;
            for (i = 0; i < length; i += 1) {
                if (typeof rep[i] === 'string') {
                    k = rep[i];
                    v = str(k, value);
                    if (v) {
                        partial.push(quote(k) + (gap ? ': ' : ':') + v);
                    }
                }
            }
        } else {

// Otherwise, iterate through all of the keys in the object.
            var keysSorted = Object.keys(value).sort()
            for (i in keysSorted) {
                k = keysSorted[i]
                if (Object.prototype.hasOwnProperty.call(value, k)) {
                    v = str(k, value);
                    if (v) {
                        partial.push(quote(k) + (gap ? ': ' : ':') + v);
                    }
                }
            }
        }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

        v = partial.length === 0
            ? '{}'
            : gap
            ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
            : '{' + partial.join(',') + '}';
        gap = mind;
        return v;
    }
}

// If the JSON object does not yet have a stringify method, give it one.
var stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

    var i;
    gap = '';
    indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

    if (typeof space === 'number') {
        for (i = 0; i < space; i += 1) {
            indent += ' ';
        }

// If the space parameter is a string, it will be used as the indent string.

    } else if (typeof space === 'string') {
        indent = space;
    }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

    rep = replacer;
    if (replacer && typeof replacer !== 'function' &&
            (typeof replacer !== 'object' ||
            typeof replacer.length !== 'number')) {
        throw new Error('JSON.stringify');
    }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

    return str('', {'': value});
};

module.exports = stringify


},{}],60:[function(require,module,exports){

/**
 * Expose `debug()` as the module.
 */

module.exports = debug;

/**
 * Create a debugger with the given `name`.
 *
 * @param {String} name
 * @return {Type}
 * @api public
 */

function debug(name) {
  if (!debug.enabled(name)) return function(){};

  return function(fmt){
    fmt = coerce(fmt);

    var curr = new Date;
    var ms = curr - (debug[name] || curr);
    debug[name] = curr;

    fmt = name
      + ' '
      + fmt
      + ' +' + debug.humanize(ms);

    // This hackery is required for IE8
    // where `console.log` doesn't have 'apply'
    window.console
      && console.log
      && Function.prototype.apply.call(console.log, console, arguments);
  }
}

/**
 * The currently active debug mode names.
 */

debug.names = [];
debug.skips = [];

/**
 * Enables a debug mode by name. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} name
 * @api public
 */

debug.enable = function(name) {
  try {
    localStorage.debug = name;
  } catch(e){}

  var split = (name || '').split(/[\s,]+/)
    , len = split.length;

  for (var i = 0; i < len; i++) {
    name = split[i].replace('*', '.*?');
    if (name[0] === '-') {
      debug.skips.push(new RegExp('^' + name.substr(1) + '$'));
    }
    else {
      debug.names.push(new RegExp('^' + name + '$'));
    }
  }
};

/**
 * Disable debug output.
 *
 * @api public
 */

debug.disable = function(){
  debug.enable('');
};

/**
 * Humanize the given `ms`.
 *
 * @param {Number} m
 * @return {String}
 * @api private
 */

debug.humanize = function(ms) {
  var sec = 1000
    , min = 60 * 1000
    , hour = 60 * min;

  if (ms >= hour) return (ms / hour).toFixed(1) + 'h';
  if (ms >= min) return (ms / min).toFixed(1) + 'm';
  if (ms >= sec) return (ms / sec | 0) + 's';
  return ms + 'ms';
};

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

debug.enabled = function(name) {
  for (var i = 0, len = debug.skips.length; i < len; i++) {
    if (debug.skips[i].test(name)) {
      return false;
    }
  }
  for (var i = 0, len = debug.names.length; i < len; i++) {
    if (debug.names[i].test(name)) {
      return true;
    }
  }
  return false;
};

/**
 * Coerce `val`.
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

// persist

try {
  if (window.localStorage) debug.enable(localStorage.debug);
} catch(e){}

},{}],61:[function(require,module,exports){

/*!
 * EJS
 * Copyright(c) 2012 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var utils = require('./utils')
  , path = require('path')
  , dirname = path.dirname
  , extname = path.extname
  , join = path.join
  , fs = require('fs')
  , read = fs.readFileSync;

/**
 * Filters.
 *
 * @type Object
 */

var filters = exports.filters = require('./filters');

/**
 * Intermediate js cache.
 *
 * @type Object
 */

var cache = {};

/**
 * Clear intermediate js cache.
 *
 * @api public
 */

exports.clearCache = function(){
  cache = {};
};

/**
 * Translate filtered code into function calls.
 *
 * @param {String} js
 * @return {String}
 * @api private
 */

function filtered(js) {
  return js.substr(1).split('|').reduce(function(js, filter){
    var parts = filter.split(':')
      , name = parts.shift()
      , args = parts.join(':') || '';
    if (args) args = ', ' + args;
    return 'filters.' + name + '(' + js + args + ')';
  });
};

/**
 * Re-throw the given `err` in context to the
 * `str` of ejs, `filename`, and `lineno`.
 *
 * @param {Error} err
 * @param {String} str
 * @param {String} filename
 * @param {String} lineno
 * @api private
 */

function rethrow(err, str, filename, lineno){
  var lines = str.split('\n')
    , start = Math.max(lineno - 3, 0)
    , end = Math.min(lines.length, lineno + 3);

  // Error context
  var context = lines.slice(start, end).map(function(line, i){
    var curr = i + start + 1;
    return (curr == lineno ? ' >> ' : '    ')
      + curr
      + '| '
      + line;
  }).join('\n');

  // Alter exception message
  err.path = filename;
  err.message = (filename || 'ejs') + ':'
    + lineno + '\n'
    + context + '\n\n'
    + err.message;
  
  throw err;
}

/**
 * Parse the given `str` of ejs, returning the function body.
 *
 * @param {String} str
 * @return {String}
 * @api public
 */

var parse = exports.parse = function(str, options){
  var options = options || {}
    , open = options.open || exports.open || '<%'
    , close = options.close || exports.close || '%>'
    , filename = options.filename
    , compileDebug = options.compileDebug !== false
    , buf = "";

  buf += 'var buf = [];';
  if (false !== options._with) buf += '\nwith (locals || {}) { (function(){ ';
  buf += '\n buf.push(\'';

  var lineno = 1;

  var consumeEOL = false;
  for (var i = 0, len = str.length; i < len; ++i) {
    var stri = str[i];
    if (str.slice(i, open.length + i) == open) {
      i += open.length
  
      var prefix, postfix, line = (compileDebug ? '__stack.lineno=' : '') + lineno;
      switch (str[i]) {
        case '=':
          prefix = "', escape((" + line + ', ';
          postfix = ")), '";
          ++i;
          break;
        case '-':
          prefix = "', (" + line + ', ';
          postfix = "), '";
          ++i;
          break;
        default:
          prefix = "');" + line + ';';
          postfix = "; buf.push('";
      }

      var end = str.indexOf(close, i)
        , js = str.substring(i, end)
        , start = i
        , include = null
        , n = 0;

      if ('-' == js[js.length-1]){
        js = js.substring(0, js.length - 2);
        consumeEOL = true;
      }

      if (0 == js.trim().indexOf('include')) {
        var name = js.trim().slice(7).trim();
        if (!filename) throw new Error('filename option is required for includes');
        var path = resolveInclude(name, filename);
        include = read(path, 'utf8');
        include = exports.parse(include, { filename: path, _with: false, open: open, close: close, compileDebug: compileDebug });
        buf += "' + (function(){" + include + "})() + '";
        js = '';
      }

      while (~(n = js.indexOf("\n", n))) n++, lineno++;
      if (js.substr(0, 1) == ':') js = filtered(js);
      if (js) {
        if (js.lastIndexOf('//') > js.lastIndexOf('\n')) js += '\n';
        buf += prefix;
        buf += js;
        buf += postfix;
      }
      i += end - start + close.length - 1;

    } else if (stri == "\\") {
      buf += "\\\\";
    } else if (stri == "'") {
      buf += "\\'";
    } else if (stri == "\r") {
      // ignore
    } else if (stri == "\n") {
      if (consumeEOL) {
        consumeEOL = false;
      } else {
        buf += "\\n";
        lineno++;
      }
    } else {
      buf += stri;
    }
  }

  if (false !== options._with) buf += "'); })();\n} \nreturn buf.join('');";
  else buf += "');\nreturn buf.join('');";
  return buf;
};

/**
 * Compile the given `str` of ejs into a `Function`.
 *
 * @param {String} str
 * @param {Object} options
 * @return {Function}
 * @api public
 */

var compile = exports.compile = function(str, options){
  options = options || {};
  var escape = options.escape || utils.escape;
  
  var input = JSON.stringify(str)
    , compileDebug = options.compileDebug !== false
    , client = options.client
    , filename = options.filename
        ? JSON.stringify(options.filename)
        : 'undefined';
  
  if (compileDebug) {
    // Adds the fancy stack trace meta info
    str = [
      'var __stack = { lineno: 1, input: ' + input + ', filename: ' + filename + ' };',
      rethrow.toString(),
      'try {',
      exports.parse(str, options),
      '} catch (err) {',
      '  rethrow(err, __stack.input, __stack.filename, __stack.lineno);',
      '}'
    ].join("\n");
  } else {
    str = exports.parse(str, options);
  }
  
  if (options.debug) console.log(str);
  if (client) str = 'escape = escape || ' + escape.toString() + ';\n' + str;

  try {
    var fn = new Function('locals, filters, escape, rethrow', str);
  } catch (err) {
    if ('SyntaxError' == err.name) {
      err.message += options.filename
        ? ' in ' + filename
        : ' while compiling ejs';
    }
    throw err;
  }

  if (client) return fn;

  return function(locals){
    return fn.call(this, locals, filters, escape, rethrow);
  }
};

/**
 * Render the given `str` of ejs.
 *
 * Options:
 *
 *   - `locals`          Local variables object
 *   - `cache`           Compiled functions are cached, requires `filename`
 *   - `filename`        Used by `cache` to key caches
 *   - `scope`           Function execution context
 *   - `debug`           Output generated function body
 *   - `open`            Open tag, defaulting to "<%"
 *   - `close`           Closing tag, defaulting to "%>"
 *
 * @param {String} str
 * @param {Object} options
 * @return {String}
 * @api public
 */

exports.render = function(str, options){
  var fn
    , options = options || {};

  if (options.cache) {
    if (options.filename) {
      fn = cache[options.filename] || (cache[options.filename] = compile(str, options));
    } else {
      throw new Error('"cache" option requires "filename".');
    }
  } else {
    fn = compile(str, options);
  }

  options.__proto__ = options.locals;
  return fn.call(options.scope, options);
};

/**
 * Render an EJS file at the given `path` and callback `fn(err, str)`.
 *
 * @param {String} path
 * @param {Object|Function} options or callback
 * @param {Function} fn
 * @api public
 */

exports.renderFile = function(path, options, fn){
  var key = path + ':string';

  if ('function' == typeof options) {
    fn = options, options = {};
  }

  options.filename = path;

  var str;
  try {
    str = options.cache
      ? cache[key] || (cache[key] = read(path, 'utf8'))
      : read(path, 'utf8');
  } catch (err) {
    fn(err);
    return;
  }
  fn(null, exports.render(str, options));
};

/**
 * Resolve include `name` relative to `filename`.
 *
 * @param {String} name
 * @param {String} filename
 * @return {String}
 * @api private
 */

function resolveInclude(name, filename) {
  var path = join(dirname(filename), name);
  var ext = extname(name);
  if (!ext) path += '.ejs';
  return path;
}

// express support

exports.__express = exports.renderFile;

/**
 * Expose to require().
 */

if (require.extensions) {
  require.extensions['.ejs'] = function (module, filename) {
    filename = filename || module.filename;
    var options = { filename: filename, client: true }
      , template = fs.readFileSync(filename).toString()
      , fn = compile(template, options);
    module._compile('module.exports = ' + fn.toString() + ';', filename);
  };
} else if (require.registerExtension) {
  require.registerExtension('.ejs', function(src) {
    return compile(src, {});
  });
}

},{"./filters":62,"./utils":63,"fs":23,"path":43}],62:[function(require,module,exports){
/*!
 * EJS - Filters
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * First element of the target `obj`.
 */

exports.first = function(obj) {
  return obj[0];
};

/**
 * Last element of the target `obj`.
 */

exports.last = function(obj) {
  return obj[obj.length - 1];
};

/**
 * Capitalize the first letter of the target `str`.
 */

exports.capitalize = function(str){
  str = String(str);
  return str[0].toUpperCase() + str.substr(1, str.length);
};

/**
 * Downcase the target `str`.
 */

exports.downcase = function(str){
  return String(str).toLowerCase();
};

/**
 * Uppercase the target `str`.
 */

exports.upcase = function(str){
  return String(str).toUpperCase();
};

/**
 * Sort the target `obj`.
 */

exports.sort = function(obj){
  return Object.create(obj).sort();
};

/**
 * Sort the target `obj` by the given `prop` ascending.
 */

exports.sort_by = function(obj, prop){
  return Object.create(obj).sort(function(a, b){
    a = a[prop], b = b[prop];
    if (a > b) return 1;
    if (a < b) return -1;
    return 0;
  });
};

/**
 * Size or length of the target `obj`.
 */

exports.size = exports.length = function(obj) {
  return obj.length;
};

/**
 * Add `a` and `b`.
 */

exports.plus = function(a, b){
  return Number(a) + Number(b);
};

/**
 * Subtract `b` from `a`.
 */

exports.minus = function(a, b){
  return Number(a) - Number(b);
};

/**
 * Multiply `a` by `b`.
 */

exports.times = function(a, b){
  return Number(a) * Number(b);
};

/**
 * Divide `a` by `b`.
 */

exports.divided_by = function(a, b){
  return Number(a) / Number(b);
};

/**
 * Join `obj` with the given `str`.
 */

exports.join = function(obj, str){
  return obj.join(str || ', ');
};

/**
 * Truncate `str` to `len`.
 */

exports.truncate = function(str, len, append){
  str = String(str);
  if (str.length > len) {
    str = str.slice(0, len);
    if (append) str += append;
  }
  return str;
};

/**
 * Truncate `str` to `n` words.
 */

exports.truncate_words = function(str, n){
  var str = String(str)
    , words = str.split(/ +/);
  return words.slice(0, n).join(' ');
};

/**
 * Replace `pattern` with `substitution` in `str`.
 */

exports.replace = function(str, pattern, substitution){
  return String(str).replace(pattern, substitution || '');
};

/**
 * Prepend `val` to `obj`.
 */

exports.prepend = function(obj, val){
  return Array.isArray(obj)
    ? [val].concat(obj)
    : val + obj;
};

/**
 * Append `val` to `obj`.
 */

exports.append = function(obj, val){
  return Array.isArray(obj)
    ? obj.concat(val)
    : obj + val;
};

/**
 * Map the given `prop`.
 */

exports.map = function(arr, prop){
  return arr.map(function(obj){
    return obj[prop];
  });
};

/**
 * Reverse the given `obj`.
 */

exports.reverse = function(obj){
  return Array.isArray(obj)
    ? obj.reverse()
    : String(obj).split('').reverse().join('');
};

/**
 * Get `prop` of the given `obj`.
 */

exports.get = function(obj, prop){
  return obj[prop];
};

/**
 * Packs the given `obj` into json string
 */
exports.json = function(obj){
  return JSON.stringify(obj);
};

},{}],63:[function(require,module,exports){

/*!
 * EJS
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Escape the given string of `html`.
 *
 * @param {String} html
 * @return {String}
 * @api private
 */

exports.escape = function(html){
  return String(html)
    .replace(/&(?!#?[a-zA-Z0-9]+;)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&#39;')
    .replace(/"/g, '&quot;');
};
 

},{}],64:[function(require,module,exports){
/*!
 * inflection
 * Copyright(c) 2011 Ben Lin <ben@dreamerslab.com>
 * MIT Licensed
 *
 * @fileoverview
 * A port of inflection-js to node.js module.
 */

( function ( root ){

  /**
   * @description This is a list of nouns that use the same form for both singular and plural.
   *              This list should remain entirely in lower case to correctly match Strings.
   * @private
   */
  var uncountable_words = [
    'equipment', 'information', 'rice', 'money', 'species',
    'series', 'fish', 'sheep', 'moose', 'deer', 'news'
  ];

  /**
   * @description These rules translate from the singular form of a noun to its plural form.
   * @private
   */
  var plural_rules = [

    // do not replace if its already a plural word
    [ new RegExp( '(m)en$',      'gi' )],
    [ new RegExp( '(pe)ople$',   'gi' )],
    [ new RegExp( '(child)ren$', 'gi' )],
    [ new RegExp( '([ti])a$',    'gi' )],
    [ new RegExp( '((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$','gi' )],
    [ new RegExp( '(hive)s$',           'gi' )],
    [ new RegExp( '(tive)s$',           'gi' )],
    [ new RegExp( '(curve)s$',          'gi' )],
    [ new RegExp( '([lr])ves$',         'gi' )],
    [ new RegExp( '([^fo])ves$',        'gi' )],
    [ new RegExp( '([^aeiouy]|qu)ies$', 'gi' )],
    [ new RegExp( '(s)eries$',          'gi' )],
    [ new RegExp( '(m)ovies$',          'gi' )],
    [ new RegExp( '(x|ch|ss|sh)es$',    'gi' )],
    [ new RegExp( '([m|l])ice$',        'gi' )],
    [ new RegExp( '(bus)es$',           'gi' )],
    [ new RegExp( '(o)es$',             'gi' )],
    [ new RegExp( '(shoe)s$',           'gi' )],
    [ new RegExp( '(cris|ax|test)es$',  'gi' )],
    [ new RegExp( '(octop|vir)i$',      'gi' )],
    [ new RegExp( '(alias|status)es$',  'gi' )],
    [ new RegExp( '^(ox)en',            'gi' )],
    [ new RegExp( '(vert|ind)ices$',    'gi' )],
    [ new RegExp( '(matr)ices$',        'gi' )],
    [ new RegExp( '(quiz)zes$',         'gi' )],

    // original rule
    [ new RegExp( '(m)an$', 'gi' ),                 '$1en' ],
    [ new RegExp( '(pe)rson$', 'gi' ),              '$1ople' ],
    [ new RegExp( '(child)$', 'gi' ),               '$1ren' ],
    [ new RegExp( '^(ox)$', 'gi' ),                 '$1en' ],
    [ new RegExp( '(ax|test)is$', 'gi' ),           '$1es' ],
    [ new RegExp( '(octop|vir)us$', 'gi' ),         '$1i' ],
    [ new RegExp( '(alias|status)$', 'gi' ),        '$1es' ],
    [ new RegExp( '(bu)s$', 'gi' ),                 '$1ses' ],
    [ new RegExp( '(buffal|tomat|potat)o$', 'gi' ), '$1oes' ],
    [ new RegExp( '([ti])um$', 'gi' ),              '$1a' ],
    [ new RegExp( 'sis$', 'gi' ),                   'ses' ],
    [ new RegExp( '(?:([^f])fe|([lr])f)$', 'gi' ),  '$1$2ves' ],
    [ new RegExp( '(hive)$', 'gi' ),                '$1s' ],
    [ new RegExp( '([^aeiouy]|qu)y$', 'gi' ),       '$1ies' ],
    [ new RegExp( '(x|ch|ss|sh)$', 'gi' ),          '$1es' ],
    [ new RegExp( '(matr|vert|ind)ix|ex$', 'gi' ),  '$1ices' ],
    [ new RegExp( '([m|l])ouse$', 'gi' ),           '$1ice' ],
    [ new RegExp( '(quiz)$', 'gi' ),                '$1zes' ],

    [ new RegExp( 's$', 'gi' ), 's' ],
    [ new RegExp( '$', 'gi' ),  's' ]
  ];

  /**
   * @description These rules translate from the plural form of a noun to its singular form.
   * @private
   */
  var singular_rules = [

    // do not replace if its already a singular word
    [ new RegExp( '(m)an$',                 'gi' )],
    [ new RegExp( '(pe)rson$',              'gi' )],
    [ new RegExp( '(child)$',               'gi' )],
    [ new RegExp( '^(ox)$',                 'gi' )],
    [ new RegExp( '(ax|test)is$',           'gi' )],
    [ new RegExp( '(octop|vir)us$',         'gi' )],
    [ new RegExp( '(alias|status)$',        'gi' )],
    [ new RegExp( '(bu)s$',                 'gi' )],
    [ new RegExp( '(buffal|tomat|potat)o$', 'gi' )],
    [ new RegExp( '([ti])um$',              'gi' )],
    [ new RegExp( 'sis$',                   'gi' )],
    [ new RegExp( '(?:([^f])fe|([lr])f)$',  'gi' )],
    [ new RegExp( '(hive)$',                'gi' )],
    [ new RegExp( '([^aeiouy]|qu)y$',       'gi' )],
    [ new RegExp( '(x|ch|ss|sh)$',          'gi' )],
    [ new RegExp( '(matr|vert|ind)ix|ex$',  'gi' )],
    [ new RegExp( '([m|l])ouse$',           'gi' )],
    [ new RegExp( '(quiz)$',                'gi' )],

    // original rule
    [ new RegExp( '(m)en$', 'gi' ),                                                       '$1an' ],
    [ new RegExp( '(pe)ople$', 'gi' ),                                                    '$1rson' ],
    [ new RegExp( '(child)ren$', 'gi' ),                                                  '$1' ],
    [ new RegExp( '([ti])a$', 'gi' ),                                                     '$1um' ],
    [ new RegExp( '((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$','gi' ), '$1$2sis' ],
    [ new RegExp( '(hive)s$', 'gi' ),                                                     '$1' ],
    [ new RegExp( '(tive)s$', 'gi' ),                                                     '$1' ],
    [ new RegExp( '(curve)s$', 'gi' ),                                                    '$1' ],
    [ new RegExp( '([lr])ves$', 'gi' ),                                                   '$1f' ],
    [ new RegExp( '([^fo])ves$', 'gi' ),                                                  '$1fe' ],
    [ new RegExp( '([^aeiouy]|qu)ies$', 'gi' ),                                           '$1y' ],
    [ new RegExp( '(s)eries$', 'gi' ),                                                    '$1eries' ],
    [ new RegExp( '(m)ovies$', 'gi' ),                                                    '$1ovie' ],
    [ new RegExp( '(x|ch|ss|sh)es$', 'gi' ),                                              '$1' ],
    [ new RegExp( '([m|l])ice$', 'gi' ),                                                  '$1ouse' ],
    [ new RegExp( '(bus)es$', 'gi' ),                                                     '$1' ],
    [ new RegExp( '(o)es$', 'gi' ),                                                       '$1' ],
    [ new RegExp( '(shoe)s$', 'gi' ),                                                     '$1' ],
    [ new RegExp( '(cris|ax|test)es$', 'gi' ),                                            '$1is' ],
    [ new RegExp( '(octop|vir)i$', 'gi' ),                                                '$1us' ],
    [ new RegExp( '(alias|status)es$', 'gi' ),                                            '$1' ],
    [ new RegExp( '^(ox)en', 'gi' ),                                                      '$1' ],
    [ new RegExp( '(vert|ind)ices$', 'gi' ),                                              '$1ex' ],
    [ new RegExp( '(matr)ices$', 'gi' ),                                                  '$1ix' ],
    [ new RegExp( '(quiz)zes$', 'gi' ),                                                   '$1' ],
    [ new RegExp( 'ss$', 'gi' ),                                                          'ss' ],
    [ new RegExp( 's$', 'gi' ),                                                           '' ]
  ];

  /**
   * @description This is a list of words that should not be capitalized for title case.
   * @private
   */
  var non_titlecased_words = [
    'and', 'or', 'nor', 'a', 'an', 'the', 'so', 'but', 'to', 'of', 'at','by',
    'from', 'into', 'on', 'onto', 'off', 'out', 'in', 'over', 'with', 'for'
  ];

  /**
   * @description These are regular expressions used for converting between String formats.
   * @private
   */
  var id_suffix         = new RegExp( '(_ids|_id)$', 'g' );
  var underbar          = new RegExp( '_', 'g' );
  var space_or_underbar = new RegExp( '[\ _]', 'g' );
  var uppercase         = new RegExp( '([A-Z])', 'g' );
  var underbar_prefix   = new RegExp( '^_' );

  var inflector = {

  /**
   * A helper method that applies rules based replacement to a String.
   * @private
   * @function
   * @param {String} str String to modify and return based on the passed rules.
   * @param {Array: [RegExp, String]} rules Regexp to match paired with String to use for replacement
   * @param {Array: [String]} skip Strings to skip if they match
   * @param {String} override String to return as though this method succeeded (used to conform to APIs)
   * @returns {String} Return passed String modified by passed rules.
   * @example
   *
   *     this._apply_rules( 'cows', singular_rules ); // === 'cow'
   */
    _apply_rules : function( str, rules, skip, override ){
      if( override ){
        str = override;
      }else{
        var ignore = ( inflector.indexOf( skip, str.toLowerCase()) > -1 );

        if( !ignore ){
          var i = 0;
          var j = rules.length;

          for( ; i < j; i++ ){
            if( str.match( rules[ i ][ 0 ])){
              if( rules[ i ][ 1 ] !== undefined ){
                str = str.replace( rules[ i ][ 0 ], rules[ i ][ 1 ]);
              }
              break;
            }
          }
        }
      }

      return str;
    },



  /**
   * This lets us detect if an Array contains a given element.
   * @public
   * @function
   * @param {Array} arr The subject array.
   * @param {Object} item Object to locate in the Array.
   * @param {Number} fromIndex Starts checking from this position in the Array.(optional)
   * @param {Function} compareFunc Function used to compare Array item vs passed item.(optional)
   * @returns {Number} Return index position in the Array of the passed item.
   * @example
   *
   *     var inflection = require( 'inflection' );
   *
   *     inflection.indexOf([ 'hi','there' ], 'guys' ); // === -1
   *     inflection.indexOf([ 'hi','there' ], 'hi' ); // === 0
   */
    indexOf : function( arr, item, fromIndex, compareFunc ){
      if( !fromIndex ){
        fromIndex = -1;
      }

      var index = -1;
      var i     = fromIndex;
      var j     = arr.length;

      for( ; i < j; i++ ){
        if( arr[ i ]  === item || compareFunc && compareFunc( arr[ i ], item )){
          index = i;
          break;
        }
      }

      return index;
    },



  /**
   * This function adds pluralization support to every String object.
   * @public
   * @function
   * @param {String} str The subject string.
   * @param {String} plural Overrides normal output with said String.(optional)
   * @returns {String} Singular English language nouns are returned in plural form.
   * @example
   *
   *     var inflection = require( 'inflection' );
   *
   *     inflection.pluralize( 'person' ); // === 'people'
   *     inflection.pluralize( 'octopus' ); // === 'octopi'
   *     inflection.pluralize( 'Hat' ); // === 'Hats'
   *     inflection.pluralize( 'person', 'guys' ); // === 'guys'
   */
    pluralize : function ( str, plural ){
      return inflector._apply_rules( str, plural_rules, uncountable_words, plural );
    },



  /**
   * This function adds singularization support to every String object.
   * @public
   * @function
   * @param {String} str The subject string.
   * @param {String} singular Overrides normal output with said String.(optional)
   * @returns {String} Plural English language nouns are returned in singular form.
   * @example
   *
   *     var inflection = require( 'inflection' );
   *
   *     inflection.singularize( 'people' ); // === 'person'
   *     inflection.singularize( 'octopi' ); // === 'octopus'
   *     inflection.singularize( 'Hats' ); // === 'Hat'
   *     inflection.singularize( 'guys', 'person' ); // === 'person'
   */
    singularize : function ( str, singular ){
      return inflector._apply_rules( str, singular_rules, uncountable_words, singular );
    },



  /**
   * This function adds camelization support to every String object.
   * @public
   * @function
   * @param {String} str The subject string.
   * @param {Boolean} lowFirstLetter Default is to capitalize the first letter of the results.(optional)
   *                                 Passing true will lowercase it.
   * @returns {String} Lower case underscored words will be returned in camel case.
   *                  additionally '/' is translated to '::'
   * @example
   *
   *     var inflection = require( 'inflection' );
   *
   *     inflection.camelize( 'message_properties' ); // === 'MessageProperties'
   *     inflection.camelize( 'message_properties', true ); // === 'messageProperties'
   */
    camelize : function ( str, lowFirstLetter ){
      var str_path = str.toLowerCase().split( '/' );
      var i        = 0;
      var j        = str_path.length;

      for( ; i < j; i++ ){
        var str_arr = str_path[ i ].split( '_' );
        var initX   = (( lowFirstLetter && i + 1 === j ) ? ( 1 ) : ( 0 ));
        var k       = initX;
        var l       = str_arr.length;

        for( ; k < l; k++ ){
          str_arr[ k ] = str_arr[ k ].charAt( 0 ).toUpperCase() + str_arr[ k ].substring( 1 );
        }

        str_path[ i ] = str_arr.join( '' );
      }

      return str_path.join( '::' );
    },



  /**
   * This function adds underscore support to every String object.
   * @public
   * @function
   * @param {String} str The subject string.
   * @param {Boolean} allUpperCase Default is to lowercase and add underscore prefix.(optional)
   *                  Passing true will return as entered.
   * @returns {String} Camel cased words are returned as lower cased and underscored.
   *                  additionally '::' is translated to '/'.
   * @example
   *
   *     var inflection = require( 'inflection' );
   *
   *     inflection.underscore( 'MessageProperties' ); // === 'message_properties'
   *     inflection.underscore( 'messageProperties' ); // === 'message_properties'
   *     inflection.underscore( 'MP', true ); // === 'MP'
   */
    underscore : function ( str, allUpperCase ){
      if( allUpperCase && str === str.toUpperCase()) return str;

      var str_path = str.split( '::' );
      var i        = 0;
      var j        = str_path.length;

      for( ; i < j; i++ ){
        str_path[ i ] = str_path[ i ].replace( uppercase, '_$1' );
        str_path[ i ] = str_path[ i ].replace( underbar_prefix, '' );
      }

      return str_path.join( '/' ).toLowerCase();
    },



  /**
   * This function adds humanize support to every String object.
   * @public
   * @function
   * @param {String} str The subject string.
   * @param {Boolean} lowFirstLetter Default is to capitalize the first letter of the results.(optional)
   *                                 Passing true will lowercase it.
   * @returns {String} Lower case underscored words will be returned in humanized form.
   * @example
   *
   *     var inflection = require( 'inflection' );
   *
   *     inflection.humanize( 'message_properties' ); // === 'Message properties'
   *     inflection.humanize( 'message_properties', true ); // === 'message properties'
   */
    humanize : function( str, lowFirstLetter ){
      str = str.toLowerCase();
      str = str.replace( id_suffix, '' );
      str = str.replace( underbar, ' ' );

      if( !lowFirstLetter ){
        str = inflector.capitalize( str );
      }

      return str;
    },



  /**
   * This function adds capitalization support to every String object.
   * @public
   * @function
   * @param {String} str The subject string.
   * @returns {String} All characters will be lower case and the first will be upper.
   * @example
   *
   *     var inflection = require( 'inflection' );
   *
   *     inflection.capitalize( 'message_properties' ); // === 'Message_properties'
   *     inflection.capitalize( 'message properties', true ); // === 'Message properties'
   */
    capitalize : function ( str ){
      str = str.toLowerCase();

      return str.substring( 0, 1 ).toUpperCase() + str.substring( 1 );
    },



  /**
   * This function adds dasherization support to every String object.
   * @public
   * @function
   * @param {String} str The subject string.
   * @returns {String} Replaces all spaces or underbars with dashes.
   * @example
   *
   *     var inflection = require( 'inflection' );
   *
   *     inflection.dasherize( 'message_properties' ); // === 'message-properties'
   *     inflection.dasherize( 'Message Properties' ); // === 'Message-Properties'
   */
    dasherize : function ( str ){
      return str.replace( space_or_underbar, '-' );
    },



  /**
   * This function adds titleize support to every String object.
   * @public
   * @function
   * @param {String} str The subject string.
   * @returns {String} Capitalizes words as you would for a book title.
   * @example
   *
   *     var inflection = require( 'inflection' );
   *
   *     inflection.titleize( 'message_properties' ); // === 'Message Properties'
   *     inflection.titleize( 'message properties to keep' ); // === 'Message Properties to Keep'
   */
    titleize : function ( str ){
      str         = str.toLowerCase().replace( underbar, ' ');
      var str_arr = str.split(' ');
      var i       = 0;
      var j       = str_arr.length;

      for( ; i < j; i++ ){
        var d = str_arr[ i ].split( '-' );
        var k = 0;
        var l = d.length;

        for( ; k < l; k++){
          if( inflector.indexOf( non_titlecased_words, d[ k ].toLowerCase()) < 0 ){
            d[ k ] = inflector.capitalize( d[ k ]);
          }
        }

        str_arr[ i ] = d.join( '-' );
      }

      str = str_arr.join( ' ' );
      str = str.substring( 0, 1 ).toUpperCase() + str.substring( 1 );

      return str;
    },



  /**
   * This function adds demodulize support to every String object.
   * @public
   * @function
   * @param {String} str The subject string.
   * @returns {String} Removes module names leaving only class names.(Ruby style)
   * @example
   *
   *     var inflection = require( 'inflection' );
   *
   *     inflection.demodulize( 'Message::Bus::Properties' ); // === 'Properties'
   */
    demodulize : function ( str ){
      var str_arr = str.split( '::' );

      return str_arr[ str_arr.length - 1 ];
    },



  /**
   * This function adds tableize support to every String object.
   * @public
   * @function
   * @param {String} str The subject string.
   * @returns {String} Return camel cased words into their underscored plural form.
   * @example
   *
   *     var inflection = require( 'inflection' );
   *
   *     inflection.tableize( 'MessageBusProperty' ); // === 'message_bus_properties'
   */
    tableize : function ( str ){
      str = inflector.underscore( str );
      str = inflector.pluralize( str );

      return str;
    },



  /**
   * This function adds classification support to every String object.
   * @public
   * @function
   * @param {String} str The subject string.
   * @returns {String} Underscored plural nouns become the camel cased singular form.
   * @example
   *
   *     var inflection = require( 'inflection' );
   *
   *     inflection.classify( 'message_bus_properties' ); // === 'MessageBusProperty'
   */
    classify : function ( str ){
      str = inflector.camelize( str );
      str = inflector.singularize( str );

      return str;
    },



  /**
   * This function adds foreign key support to every String object.
   * @public
   * @function
   * @param {String} str The subject string.
   * @param {Boolean} dropIdUbar Default is to seperate id with an underbar at the end of the class name,
                                 you can pass true to skip it.(optional)
   * @returns {String} Underscored plural nouns become the camel cased singular form.
   * @example
   *
   *     var inflection = require( 'inflection' );
   *
   *     inflection.foreign_key( 'MessageBusProperty' ); // === 'message_bus_property_id'
   *     inflection.foreign_key( 'MessageBusProperty', true ); // === 'message_bus_propertyid'
   */
    foreign_key : function( str, dropIdUbar ){
      str = inflector.demodulize( str );
      str = inflector.underscore( str ) + (( dropIdUbar ) ? ( '' ) : ( '_' )) + 'id';

      return str;
    },



  /**
   * This function adds ordinalize support to every String object.
   * @public
   * @function
   * @param {String} str The subject string.
   * @returns {String} Return all found numbers their sequence like '22nd'.
   * @example
   *
   *     var inflection = require( 'inflection' );
   *
   *     inflection.ordinalize( 'the 1 pitch' ); // === 'the 1st pitch'
   */
    ordinalize : function ( str ){
      var str_arr = str.split(' ');
      var i       = 0;
      var j       = str_arr.length;

      for( ; i < j; i++ ){
        var k = parseInt( str_arr[ i ], 10 );

        if( !isNaN( k )){
          var ltd = str_arr[ i ].substring( str_arr[ i ].length - 2 );
          var ld  = str_arr[ i ].substring( str_arr[ i ].length - 1 );
          var suf = 'th';

          if( ltd != '11' && ltd != '12' && ltd != '13' ){
            if( ld === '1' ){
              suf = 'st';
            }else if( ld === '2' ){
              suf = 'nd';
            }else if( ld === '3' ){
              suf = 'rd';
            }
          }

          str_arr[ i ] += suf;
        }
      }

      return str_arr.join( ' ' );
    },

  /**
   * This function performs multiple inflection methods on a string
   * @public
   * @function
   * @param {String} str The subject string.
   * @param {Array} arr An array of inflection methods.
   * @returns {String}
   * @example
   *
   *     var inflection = require( 'inflection' );
   *
   *     inflection.transform( 'all job', [ 'pluralize', 'capitalize', 'dasherize' ]); // === 'All-jobs'
   */
    transform : function ( str, arr ){
      var i = 0;
      var j = arr.length;

      for( ;i < j; i++ ){
        var method = arr[ i ];

        if( this.hasOwnProperty( method )){
          str = this[ method ]( str );
        }
      }

      return str;
    }
  };

  if( typeof exports === 'undefined' ) return root.inflection = inflector;

/**
 * @public
 */
  inflector.version = '1.2.7';
/**
 * Exports module.
 */
  module.exports = inflector;
})( this );

},{}],65:[function(require,module,exports){
var __dirname="/node_modules/loopback-datasource-juggler";var fs = require('fs');

exports.ModelBuilder = exports.LDL = require('./lib/model-builder.js').ModelBuilder;
exports.DataSource = exports.Schema = require('./lib/datasource.js').DataSource;
exports.ModelBaseClass = require('./lib/model.js');
exports.Connector = require('./lib/connector.js');
exports.ValidationError = require('./lib/validations.js').ValidationError;

var baseSQL = './lib/sql';

exports.__defineGetter__('BaseSQL', function () {
    return require(baseSQL);
});


exports.__defineGetter__('version', function () {
    return JSON.parse(fs.readFileSync(__dirname + '/package.json')).version;
});

var commonTest = './test/common_test';
exports.__defineGetter__('test', function () {
    return require(commonTest);
});

},{"./lib/connector.js":66,"./lib/datasource.js":69,"./lib/model-builder.js":76,"./lib/model.js":78,"./lib/validations.js":83,"fs":23}],66:[function(require,module,exports){
var process=require("__browserify_process");module.exports = Connector;

/**
 * Base class for LooopBack connector. This is more a collection of useful
 * methods for connectors than a super class
 * @constructor
 */
function Connector(name, settings) {
  this._models = {};
  this.name = name;
  this.settings = settings || {};
}

/**
 * Set the relational property to indicate the backend is a relational DB
 * @type {boolean}
 */
Connector.prototype.relational = false;

/**
 * Get types associated with the connector
 * @returns {String[]} The types for the connector
 */
Connector.prototype.getTypes = function() {
  return ['db', 'nosql'];
};

/**
 * Get the default data type for ID
 * @returns {Function} The default type for ID
 */
Connector.prototype.getDefaultIdType = function() {
  return String;
};

/**
 * Get the metadata for the connector
 * @returns {Object} The metadata object
 * @property {String} type The type for the backend
 * @property {Function} defaultIdType The default id type
 * @property {Boolean} [isRelational] If the connector represents a relational database
 * @property {Object} schemaForSettings The schema for settings object
 */
Connector.prototype.getMedadata = function () {
  if (!this._metadata) {
    this._metadata = {
      types: this.getTypes(),
      defaultIdType: this.getDefaultIdType(),
      isRelational: this.isRelational || (this.getTypes().indexOf('rdbms') !== -1),
      schemaForSettings: {}
    };
  }
  return this._metadata;
};

/**
 * Execute a command with given parameters
 * @param {String} command The command such as SQL
 * @param {Object[]} [params] An array of parameters
 * @param {Function} [callback] The callback function
 */
Connector.prototype.execute = function (command, params, callback) {
  throw new Error('query method should be declared in connector');
};

/**
 * Look up the data source by model name
 * @param {String} model The model name
 * @returns {DataSource} The data source
 */
Connector.prototype.getDataSource = function (model) {
  var m = this._models[model];
  if (!m) {
    console.trace('Model not found: ' + model);
  }
  return m && m.model.dataSource;
};

/**
 * Get the id property name
 * @param {String} model The model name
 * @returns {String} The id property name
 */
Connector.prototype.idName = function (model) {
  return this.getDataSource(model).idName(model);
};

/**
 * Get the id property names
 * @param {String} model The model name
 * @returns {[String]} The id property names
 */
Connector.prototype.idNames = function (model) {
  return this.getDataSource(model).idNames(model);
};

/**
 * Get the id index (sequence number, starting from 1)
 * @param {String} model The model name
 * @param {String} prop The property name
 * @returns {Number} The id index, undefined if the property is not part of the primary key
 */
Connector.prototype.id = function (model, prop) {
  var p = this._models[model].properties[prop];
  if (!p) {
    console.trace('Property not found: ' + model + '.' + prop);
  }
  return p.id;
};

/**
 * Hook to be called by DataSource for defining a model
 * @param {Object} modelDefinition The model definition
 */
Connector.prototype.define = function (modelDefinition) {
  if (!modelDefinition.settings) {
    modelDefinition.settings = {};
  }
  this._models[modelDefinition.model.modelName] = modelDefinition;
};

/**
 * Hook to be called by DataSource for defining a model property
 * @param {String} model The model name
 * @param {String} propertyName The property name
 * @param {Object} propertyDefinition The object for property metadata
 */
Connector.prototype.defineProperty = function (model, propertyName, propertyDefinition) {
  this._models[model].properties[propertyName] = propertyDefinition;
};

/**
 * Disconnect from the connector
 */
Connector.prototype.disconnect = function disconnect(cb) {
  // NO-OP
  cb && process.nextTick(cb);
};

/**
 * Get the id value for the given model
 * @param {String} model The model name
 * @param {Object} data The model instance data
 * @returns {*} The id value
 *
 */
Connector.prototype.getIdValue = function (model, data) {
  return data && data[this.idName(model)];
};

/**
 * Set the id value for the given model
 * @param {String} model The model name
 * @param {Object} data The model instance data
 * @param {*} value The id value
 *
 */
Connector.prototype.setIdValue = function (model, data, value) {
  if (data) {
    data[this.idName(model)] = value;
  }
};

Connector.prototype.getType = function () {
  return this.type;
};





},{"__browserify_process":39}],67:[function(require,module,exports){
var process=require("__browserify_process");var util = require('util');
var Connector = require('../connector');
var geo = require('../geo');
var utils = require('../utils');
var fs = require('fs');
var async = require('async');

/**
 * Initialize the Oracle connector against the given data source
 *
 * @param {DataSource} dataSource The loopback-datasource-juggler dataSource
 * @param {Function} [callback] The callback function
 */
exports.initialize = function initializeDataSource(dataSource, callback) {
  dataSource.connector = new Memory(null, dataSource.settings);
  dataSource.connector.connect(callback);
};

exports.Memory = Memory;

function Memory(m, settings) {
  if (m instanceof Memory) {
    this.isTransaction = true;
    this.cache = m.cache;
    this.ids = m.ids;
    this.constructor.super_.call(this, 'memory', settings);
    this._models = m._models;
  } else {
    this.isTransaction = false;
    this.cache = {};
    this.ids = {};
    this.constructor.super_.call(this, 'memory', settings);
  }
}

util.inherits(Memory, Connector);

Memory.prototype.getDefaultIdType = function() {
  return Number;
};

Memory.prototype.getTypes = function() {
  return ['db', 'nosql', 'memory'];
};

Memory.prototype.connect = function (callback) {
  if (this.isTransaction) {
    this.onTransactionExec = callback;
  } else {
    this.loadFromFile(callback);
  }
};

Memory.prototype.loadFromFile = function(callback) {
  var self = this;
  if (self.settings.file) {
    fs.readFile(self.settings.file, {encoding: 'utf8', flag: 'r'}, function (err, data) {
      if (err && err.code !== 'ENOENT') {
        callback && callback(err);
      } else {
        if (data) {
          data = JSON.parse(data.toString());
          self.ids = data.ids || {};
          self.cache = data.models || {};
        } else {
          if(!self.cache) {
            self.ids = {};
            self.cache = {};
          }
        }
        callback && callback();
      }
    });
  } else {
    process.nextTick(callback);
  }
};

/*!
 * Flush the cache into the json file if necessary
 * @param {Function} callback
 */
Memory.prototype.saveToFile = function (result, callback) {
  var self = this;
  if (this.settings.file) {
    if(!self.writeQueue) {
      // Create a queue for writes
      self.writeQueue = async.queue(function (task, cb) {
        // Flush out the models/ids
        var data = JSON.stringify({
          ids: self.ids,
          models: self.cache
        }, null, '  ');

        fs.writeFile(self.settings.file, data, function (err) {
          cb(err);
          task.callback && task.callback(err, task.data);
        });
      }, 1);
    }
    // Enqueue the write
    self.writeQueue.push({
      data: result,
      callback: callback
    });
  } else {
    process.nextTick(function () {
      callback && callback(null, result);
    });
  }
};

Memory.prototype.define = function defineModel(definition) {
  this.constructor.super_.prototype.define.apply(this, [].slice.call(arguments));
  var m = definition.model.modelName;
  if(!this.cache[m]) {
    this.cache[m] = {};
    this.ids[m] = 1;
  }
};

Memory.prototype.create = function create(model, data, callback) {
  // FIXME: [rfeng] We need to generate unique ids based on the id type
  // FIXME: [rfeng] We don't support composite ids yet
  var currentId = this.ids[model];
  if (currentId === undefined) {
    // First time
    this.ids[model] = 1;
    currentId = 1;
  }
  var id = this.getIdValue(model, data) || currentId;
  if (id > currentId) {
    // If the id is passed in and the value is greater than the current id
    currentId = id;
  }
  this.ids[model] = Number(currentId) + 1;

  var props = this._models[model].properties;
  var idName = this.idName(model);
  id = (props[idName] && props[idName].type && props[idName].type(id)) || id;
  this.setIdValue(model, data, id);
  if(!this.cache[model]) {
    this.cache[model] = {};
  }
  this.cache[model][id] = JSON.stringify(data);
  this.saveToFile(id, callback);
};

Memory.prototype.updateOrCreate = function (model, data, callback) {
  var self = this;
  this.exists(model, self.getIdValue(model, data), function (err, exists) {
    if (exists) {
      self.save(model, data, callback);
    } else {
      self.create(model, data, function (err, id) {
        self.setIdValue(model, data, id);
        callback(err, data);
      });
    }
  });
};

Memory.prototype.save = function save(model, data, callback) {
  this.cache[model][this.getIdValue(model, data)] = JSON.stringify(data);
  this.saveToFile(data, callback);
};

Memory.prototype.exists = function exists(model, id, callback) {
  process.nextTick(function () {
    callback(null, this.cache[model] && this.cache[model].hasOwnProperty(id));
  }.bind(this));
};

Memory.prototype.find = function find(model, id, callback) {
  var self = this;
  process.nextTick(function () {
    callback(null, id in this.cache[model] && this.fromDb(model, this.cache[model][id]));
  }.bind(this));
};

Memory.prototype.destroy = function destroy(model, id, callback) {
  delete this.cache[model][id];
  this.saveToFile(null, callback);
};

Memory.prototype.fromDb = function (model, data) {
  if (!data) return null;
  data = JSON.parse(data);
  var props = this._models[model].properties;
  for (var key in data) {
    var val = data[key];
    if (val === undefined || val === null) {
      continue;
    }
    if (props[key]) {
      switch (props[key].type.name) {
        case 'Date':
          val = new Date(val.toString().replace(/GMT.*$/, 'GMT'));
          break;
        case 'Boolean':
          val = Boolean(val);
          break;
        case 'Number':
          val = Number(val);
          break;
      }
    }
    data[key] = val;
  }
  return data;
};

Memory.prototype.all = function all(model, filter, callback) {
  var self = this;
  var nodes = Object.keys(this.cache[model]).map(function (key) {
    return this.fromDb(model, this.cache[model][key]);
  }.bind(this));

  if (filter) {
    // do we need some sorting?
    if (filter.order) {
      var orders = filter.order;
      if (typeof filter.order === "string") {
        orders = [filter.order];
      }
      orders.forEach(function (key, i) {
        var reverse = 1;
        var m = key.match(/\s+(A|DE)SC$/i);
        if (m) {
          key = key.replace(/\s+(A|DE)SC/i, '');
          if (m[1].toLowerCase() === 'de') reverse = -1;
        }
        orders[i] = {"key": key, "reverse": reverse};
      });
      nodes = nodes.sort(sorting.bind(orders));
    }

    var nearFilter = geo.nearFilter(filter.where);

    // geo sorting
    if (nearFilter) {
      nodes = geo.filter(nodes, nearFilter);
    }

    // do we need some filtration?
    if (filter.where) {
      nodes = nodes ? nodes.filter(applyFilter(filter)) : nodes;
    }

    // field selection
    if (filter.fields) {
      nodes = nodes.map(utils.selectFields(filter.fields));
    }

    // limit/skip
    filter.skip = filter.skip || 0;
    filter.limit = filter.limit || nodes.length;
    nodes = nodes.slice(filter.skip, filter.skip + filter.limit);
  }

  process.nextTick(function () {
    if (filter && filter.include) {
      self._models[model].model.include(nodes, filter.include, callback);
    } else {
      callback(null, nodes);
    }
  });

  function sorting(a, b) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (a[this[i].key] > b[this[i].key]) {
        return 1 * this[i].reverse;
      } else if (a[this[i].key] < b[this[i].key]) {
        return -1 * this[i].reverse;
      }
    }
    return 0;
  }
};

function applyFilter(filter) {
  if (typeof filter.where === 'function') {
    return filter.where;
  }
  var keys = Object.keys(filter.where);
  return function (obj) {
    var pass = true;
    keys.forEach(function (key) {
      if (!test(filter.where[key], obj && obj[key])) {
        pass = false;
      }
    });
    return pass;
  }

  function test(example, value) {
    if (typeof value === 'string' && example && example.constructor.name === 'RegExp') {
      return value.match(example);
    }
    if (typeof example === 'undefined') return undefined;
    if (typeof value === 'undefined') return undefined;
    if (typeof example === 'object') {
      // ignore geo near filter
      if (example.near) return true;

      if (example.inq) {
        if (!value) return false;
        for (var i = 0; i < example.inq.length; i += 1) {
          if (example.inq[i] == value) return true;
        }
        return false;
      }

      if (isNum(example.gt) && example.gt < value) return true;
      if (isNum(example.gte) && example.gte <= value) return true;
      if (isNum(example.lt) && example.lt > value) return true;
      if (isNum(example.lte) && example.lte >= value) return true;
    }
    // not strict equality
    return (example !== null ? example.toString() : example) == (value !== null ? value.toString() : value);
  }

  function isNum(n) {
    return typeof n === 'number';
  }
}

Memory.prototype.destroyAll = function destroyAll(model, where, callback) {
  if (!callback && 'function' === typeof where) {
    callback = where;
    where = undefined;
  }
  var cache = this.cache[model];
  var filter = null;
  if (where) {
    filter = applyFilter({where: where});
  }
  Object.keys(cache).forEach(function (id) {
    if (!filter || filter(this.fromDb(model, cache[id]))) {
      delete cache[id];
    }
  }.bind(this));
  if (!where) {
    this.cache[model] = {};
  }
  this.saveToFile(null, callback);
};

Memory.prototype.count = function count(model, callback, where) {
  var cache = this.cache[model];
  var data = Object.keys(cache);
  if (where) {
    var filter = {where: where};
    data = data.map(function (id) {
      return this.fromDb(model, cache[id]);
    }.bind(this));
    data = data.filter(applyFilter(filter));
  }
  process.nextTick(function () {
    callback(null, data.length);
  });
};

Memory.prototype.updateAttributes = function updateAttributes(model, id, data, cb) {
  if (!id) {
    var err = new Error('You must provide an id when updating attributes!');
    if (cb) {
      return cb(err);
    } else {
      throw err;
    }
  }

  this.setIdValue(model, data, id);

  var cachedModels = this.cache[model];
  var modelAsString = cachedModels && this.cache[model][id];
  var modelData = modelAsString && JSON.parse(modelAsString);

  if (modelData) {
    this.save(model, merge(modelData, data), cb);
  } else {
    cb(new Error('Could not update attributes. Object with id ' + id + ' does not exist!'));
  }
};

Memory.prototype.transaction = function () {
  return new Memory(this);
};

Memory.prototype.exec = function (callback) {
  this.onTransactionExec();
  setTimeout(callback, 50);
};

Memory.prototype.buildNearFilter = function (filter) {
  // noop
}

function merge(base, update) {
  if (!base) return update;
  Object.keys(update).forEach(function (key) {
    base[key] = update[key];
  });
  return base;
}
},{"../connector":66,"../geo":70,"../utils":82,"__browserify_process":39,"async":84,"fs":23,"util":58}],68:[function(require,module,exports){
/**
 * Module exports class Model
 */
module.exports = DataAccessObject;

/**
 * Module dependencies
 */
var util = require('util');
var jutil = require('./jutil');
var validations = require('./validations.js');
var ValidationError = validations.ValidationError;
require('./relations.js');
var Inclusion = require('./include.js');
var Relation = require('./relations.js');
var geo = require('./geo');
var Memory = require('./connectors/memory').Memory;
var utils = require('./utils');
var fieldsToArray = utils.fieldsToArray;
var removeUndefined = utils.removeUndefined;

/**
 * DAO class - base class for all persist objects
 * provides **common API** to access any database connector.
 * This class describes only abstract behavior layer, refer to `lib/connectors/*.js`
 * to learn more about specific connector implementations
 *
 * `DataAccessObject` mixes `Inclusion` classes methods
 *
 * @constructor
 * @param {Object} data - initial object data
 */
function DataAccessObject() {
  if (DataAccessObject._mixins) {
    var self = this;
    var args = arguments;
    DataAccessObject._mixins.forEach(function (m) {
      m.call(self, args);
    });
  }
}

function idName(m) {
  return m.getDataSource().idName
    ? m.getDataSource().idName(m.modelName) : 'id';
}

function getIdValue(m, data) {
  return data && data[m.getDataSource().idName(m.modelName)];
}

function setIdValue(m, data, value) {
  if (data) {
    data[idName(m)] = value;
  }
}

DataAccessObject._forDB = function (data) {
  if (!(this.getDataSource().isRelational && this.getDataSource().isRelational())) {
    return data;
  }
  var res = {};
  for (var propName in data) {
    var type = this.getPropertyType(propName);
    if (type === 'JSON' || type === 'Any' || type === 'Object' || data[propName] instanceof Array) {
      res[propName] = JSON.stringify(data[propName]);
    } else {
      res[propName] = data[propName];
    }
  }
  return res;
};

/**
 * Create new instance of Model class, saved in database
 *
 * @param data [optional]
 * @param callback(err, obj)
 * callback called with arguments:
 *
 *   - err (null or Error)
 *   - instance (null or Model)
 */
DataAccessObject.create = function (data, callback) {
  if (stillConnecting(this.getDataSource(), this, arguments)) return;

  var Model = this;
  var modelName = Model.modelName;

  if (typeof data === 'function') {
    callback = data;
    data = {};
  }

  if (typeof callback !== 'function') {
    callback = function () {
    };
  }

  if (!data) {
    data = {};
  }

  if (Array.isArray(data)) {
    var instances = [];
    var errors = Array(data.length);
    var gotError = false;
    var wait = data.length;
    if (wait === 0) callback(null, []);

    var instances = [];
    for (var i = 0; i < data.length; i += 1) {
      (function (d, i) {
        instances.push(Model.create(d, function (err, inst) {
          if (err) {
            errors[i] = err;
            gotError = true;
          }
          modelCreated();
        }));
      })(data[i], i);
    }

    return instances;

    function modelCreated() {
      if (--wait === 0) {
        callback(gotError ? errors : null, instances);
        if(!gotError) instances.forEach(Model.emit.bind('changed'));
      }
    }
  }

  var obj;
  // if we come from save
  if (data instanceof Model && !getIdValue(this, data)) {
    obj = data;
  } else {
    obj = new Model(data);
  }
  data = obj.toObject(true);

  // validation required
  obj.isValid(function (valid) {
    if (valid) {
      create();
    } else {
      callback(new ValidationError(obj), obj);
    }
  }, data);

  function create() {
    obj.trigger('create', function (createDone) {
      obj.trigger('save', function (saveDone) {

        var _idName = idName(Model);
        this._adapter().create(modelName, this.constructor._forDB(obj.toObject(true)), function (err, id, rev) {
          if (id) {
            obj.__data[_idName] = id;
            obj.__dataWas[_idName] = id;
            defineReadonlyProp(obj, _idName, id);
          }
          if (rev) {
            obj._rev = rev;
          }
          if (err) {
            return callback(err, obj);
          }
          saveDone.call(obj, function () {
            createDone.call(obj, function () {
              callback(err, obj);
              if(!err) Model.emit('changed', obj);
            });
          });
        }, obj);
      }, obj);
    }, obj);
  }

  // for chaining
  return obj;
};

/*!
 * Configure the remoting attributes for a given function
 * @param {Function} fn The function
 * @param {Object} options The options
 * @private
 */
function setRemoting(fn, options) {
  options = options || {};
  for (var opt in options) {
    if (options.hasOwnProperty(opt)) {
      fn[opt] = options[opt];
    }
  }
  fn.shared = true;
}

setRemoting(DataAccessObject.create, {
  description: 'Create a new instance of the model and persist it into the data source',
  accepts: {arg: 'data', type: 'object', description: 'Model instance data', http: {source: 'body'}},
  returns: {arg: 'data', type: 'object', root: true},
  http: {verb: 'post', path: '/'}
});

function stillConnecting(dataSource, obj, args) {
  return dataSource.ready(obj, args);
}

/**
 * Update or insert a model instance
 * @param {Object} data The model instance data
 * @param {Function} [callback] The callback function
 */
DataAccessObject.upsert = DataAccessObject.updateOrCreate = function upsert(data, callback) {
  if (stillConnecting(this.getDataSource(), this, arguments)) return;

  var Model = this;
  if (!getIdValue(this, data)) return this.create(data, callback);
  if (this.getDataSource().connector.updateOrCreate) {
    var inst = new Model(data);
    this.getDataSource().connector.updateOrCreate(Model.modelName, inst.toObject(true), function (err, data) {
      var obj;
      if (data) {
        inst._initProperties(data, false);
        obj = inst;
      } else {
        obj = null;
      }
      callback(err, obj);
    });
  } else {
    this.findById(getIdValue(this, data), function (err, inst) {
      if (err) return callback(err);
      if (inst) {
        inst.updateAttributes(data, callback);
      } else {
        var obj = new Model(data);
        obj.save(data, callback);
      }
    });
  }
};

// upsert ~ remoting attributes
setRemoting(DataAccessObject.upsert, {
  description: 'Update an existing model instance or insert a new one into the data source',
  accepts: {arg: 'data', type: 'object', description: 'Model instance data', http: {source: 'body'}},
  returns: {arg: 'data', type: 'object', root: true},
  http: {verb: 'put', path: '/'}
});

/**
 * Find one record, same as `all`, limited by 1 and return object, not collection,
 * if not found, create using data provided as second argument
 *
 * @param {Object} query - search conditions: {where: {test: 'me'}}.
 * @param {Object} data - object to create.
 * @param {Function} cb - callback called with (err, instance)
 */
DataAccessObject.findOrCreate = function findOrCreate(query, data, callback) {
  if (query === undefined) {
    query = {where: {}};
  }
  if (typeof data === 'function' || typeof data === 'undefined') {
    callback = data;
    data = query && query.where;
  }
  if (typeof callback === 'undefined') {
    callback = function () {
    };
  }

  var t = this;
  this.findOne(query, function (err, record) {
    if (err) return callback(err);
    if (record) return callback(null, record);
    t.create(data, callback);
  });
};

/**
 * Check whether a model instance exists in database
 *
 * @param {id} id - identifier of object (primary key value)
 * @param {Function} cb - callbacl called with (err, exists: Bool)
 */
DataAccessObject.exists = function exists(id, cb) {
  if (stillConnecting(this.getDataSource(), this, arguments)) return;

  if (id !== undefined && id !== null && id !== '') {
    this.dataSource.connector.exists(this.modelName, id, cb);
  } else {
    cb(new Error('Model::exists requires the id argument'));
  }
};

// exists ~ remoting attributes
setRemoting(DataAccessObject.exists, {
  description: 'Check whether a model instance exists in the data source',
  accepts: {arg: 'id', type: 'any', description: 'Model id', required: true},
  returns: {arg: 'exists', type: 'any'},
  http: {verb: 'get', path: '/:id/exists'}
});

/**
 * Find object by id
 *
 * @param {*} id - primary key value
 * @param {Function} cb - callback called with (err, instance)
 */
DataAccessObject.findById = function find(id, cb) {
  if (stillConnecting(this.getDataSource(), this, arguments)) return;

  this.getDataSource().connector.find(this.modelName, id, function (err, data) {
    var obj = null;
    if (data) {
      if (!getIdValue(this, data)) {
        setIdValue(this, data, id);
      }
      obj = new this();
      obj._initProperties(data, false);
    }
    cb(err, obj);
  }.bind(this));
};

// find ~ remoting attributes
setRemoting(DataAccessObject.findById, {
  description: 'Find a model instance by id from the data source',
  accepts: {arg: 'id', type: 'any', description: 'Model id', required: true},
  returns: {arg: 'data', type: 'any', root: true},
  http: {verb: 'get', path: '/:id'},
  rest: {after: convertNullToNotFoundError}
});

function convertNullToNotFoundError(ctx, cb) {
  if (ctx.result !== null) return cb();

  var modelName = ctx.method.sharedClass.name;
  var id = ctx.getArgByName('id');
  var msg = 'Unkown "' + modelName + '" id "' + id + '".';
  var error = new Error(msg);
  error.statusCode = error.status = 404;
  cb(error);
}

// alias function for backwards compat.
DataAccessObject.all = function () {
  DataAccessObject.find.apply(this, arguments);
};

var operators = {
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  between: 'BETWEEN',
  inq: 'IN',
  nin: 'NOT IN',
  neq: '!=',
  like: 'LIKE',
  nlike: 'NOT LIKE'
};

DataAccessObject._coerce = function (where) {
  if (!where) {
    return where;
  }

  var props = this.getDataSource().getModelDefinition(this.modelName).properties;
  for (var p in where) {
    var DataType = props[p] && props[p].type;
    if (!DataType) {
      continue;
    }
    if (Array.isArray(DataType) || DataType === Array) {
      DataType = DataType[0];
    }
    if (DataType === Date) {
      var OrigDate = Date;
      DataType = function Date(arg) {
        return new OrigDate(arg);
      };
    } else if (DataType === Boolean) {
      DataType = function (val) {
        if (val === 'true') {
          return true;
        } else if (val === 'false') {
          return false;
        } else {
          return Boolean(val);
        }
      };
    } else if (DataType === Number) {
      // This fixes a regression in mongodb connector
      // For numbers, only convert it produces a valid number
      // LoopBack by default injects a number id. We should fix it based
      // on the connector's input, for example, MongoDB should use string
      // while RDBs typically use number
      DataType = function (val) {
        var num = Number(val);
        return !isNaN(num) ? num : val;
      };
    }

    if (!DataType) {
      continue;
    }

    if (DataType === geo.GeoPoint) {
      // Skip the GeoPoint as the near operator breaks the assumption that
      // an operation has only one property
      // We should probably fix it based on
      // http://docs.mongodb.org/manual/reference/operator/query/near/
      // The other option is to make operators start with $
      continue;
    }

    var val = where[p];
    if (val === null || val === undefined) {
      continue;
    }
    // Check there is an operator
    var operator = null;
    if ('object' === typeof val) {
      if (Object.keys(val).length !== 1) {
        // Skip if there are not only one properties
        // as the assumption for operators is not true here
        continue;
      }
      for (var op in operators) {
        if (op in val) {
          val = val[op];
          operator = op;
          break;
        }
      }
    }
    // Coerce the array items
    if (Array.isArray(val)) {
      for (var i = 0; i < val.length; i++) {
        val[i] = DataType(val[i]);
      }
    } else {
      val = DataType(val);
    }
    // Rebuild {property: {operator: value}}
    if (operator) {
      var value = {};
      value[operator] = val;
      val = value;
    }
    where[p] = val;
  }
  return where;
};

/**
 * Find all instances of Model, matched by query
 * make sure you have marked as `index: true` fields for filter or sort
 *
 * @param {Object} params (optional)
 *
 * - where: Object `{ key: val, key2: {gt: 'val2'}}`
 * - include: String, Object or Array. See DataAccessObject.include documentation.
 * - order: String
 * - limit: Number
 * - skip: Number
 *
 * @param {Function} callback (required) called with arguments:
 *
 * - err (null or Error)
 * - Array of instances
 */

DataAccessObject.find = function find(params, cb) {
  if (stillConnecting(this.getDataSource(), this, arguments)) return;

  if (arguments.length === 1) {
    cb = params;
    params = null;
  }
  var constr = this;

  params = params || {};

  if (params.where) {
    params.where = this._coerce(params.where);
  }

  var fields = params.fields;
  var near = params && geo.nearFilter(params.where);
  var supportsGeo = !!this.getDataSource().connector.buildNearFilter;

  // normalize fields as array of included property names
  if (fields) {
    params.fields = fieldsToArray(fields, Object.keys(this.definition.properties));
  }

  params = removeUndefined(params);
  if (near) {
    if (supportsGeo) {
      // convert it
      this.getDataSource().connector.buildNearFilter(params, near);
    } else if (params.where) {
      // do in memory query
      // using all documents
      this.getDataSource().connector.all(this.modelName, {}, function (err, data) {
        var memory = new Memory();
        var modelName = constr.modelName;

        if (err) {
          cb(err);
        } else if (Array.isArray(data)) {
          memory.define({
            properties: constr.dataSource.definitions[constr.modelName].properties,
            settings: constr.dataSource.definitions[constr.modelName].settings,
            model: constr
          });

          data.forEach(function (obj) {
            memory.create(modelName, obj, function () {
              // noop
            });
          });

          memory.all(modelName, params, cb);
        } else {
          cb(null, []);
        }
      }.bind(this));

      // already handled
      return;
    }
  }

  this.getDataSource().connector.all(this.modelName, params, function (err, data) {
    if (data && data.forEach) {
      data.forEach(function (d, i) {
        var obj = new constr();

        obj._initProperties(d, false, params.fields);

        if (params && params.include) {
          if (params.collect) {
            // The collect property indicates that the query is to return the
            // standlone items for a related model, not as child of the parent object
            // For example, article.tags
            obj = obj.__cachedRelations[params.collect];
          } else {
            // This handles the case to return parent items including the related
            // models. For example, Article.find({include: 'tags'}, ...);
            // Try to normalize the include
            var includes = params.include || [];
            if (typeof includes === 'string') {
              includes = [includes];
            } else if (typeof includes === 'object') {
              includes = Object.keys(includes);
            }
            includes.forEach(function (inc) {
              // Promote the included model as a direct property
              obj.__data[inc] = obj.__cachedRelations[inc];
            });
            delete obj.__data.__cachedRelations;
          }
        }
        data[i] = obj;
      });

      if (data && data.countBeforeLimit) {
        data.countBeforeLimit = data.countBeforeLimit;
      }
      if (!supportsGeo && near) {
        data = geo.filter(data, near);
      }

      cb(err, data);
    }
    else
      cb(err, []);
  });
};

// all ~ remoting attributes
setRemoting(DataAccessObject.find, {
  description: 'Find all instances of the model matched by filter from the data source',
  accepts: {arg: 'filter', type: 'object', description: 'Filter defining fields, where, orderBy, offset, and limit'},
  returns: {arg: 'data', type: 'array', root: true},
  http: {verb: 'get', path: '/'}
});

/**
 * Find one record, same as `all`, limited by 1 and return object, not collection
 *
 * @param {Object} params - search conditions: {where: {test: 'me'}}
 * @param {Function} cb - callback called with (err, instance)
 */
DataAccessObject.findOne = function findOne(params, cb) {
  if (stillConnecting(this.getDataSource(), this, arguments)) return;

  if (typeof params === 'function') {
    cb = params;
    params = {};
  }
  params = params || {};
  params.limit = 1;
  this.find(params, function (err, collection) {
    if (err || !collection || !collection.length > 0) return cb(err, null);
    cb(err, collection[0]);
  });
};

setRemoting(DataAccessObject.findOne, {
  description: 'Find first instance of the model matched by filter from the data source',
  accepts: {arg: 'filter', type: 'object', description: 'Filter defining fields, where, orderBy, offset, and limit'},
  returns: {arg: 'data', type: 'object', root: true},
  http: {verb: 'get', path: '/findOne'}
});

/**
 * Destroy all matching records
 * @param {Object} [where] An object that defines the criteria
 * @param {Function} [cb] - callback called with (err)
 */
DataAccessObject.remove =
  DataAccessObject.deleteAll =
    DataAccessObject.destroyAll = function destroyAll(where, cb) {
      if (stillConnecting(this.getDataSource(), this, arguments)) return;
      var Model = this;

      if (!cb && 'function' === typeof where) {
        cb = where;
        where = undefined;
      }
      if (!where) {
        this.getDataSource().connector.destroyAll(this.modelName, function (err, data) {
          cb && cb(err, data);
          if(!err) Model.emit('deletedAll');
        }.bind(this));
      } else {
        // Support an optional where object
        where = removeUndefined(where);
        where = this._coerce(where);
        this.getDataSource().connector.destroyAll(this.modelName, where, function (err, data) {
          cb && cb(err, data);
          if(!err) Model.emit('deletedAll', where);
        }.bind(this));
      }
    };

/**
 * Destroy a record by id
 * @param {*} id The id value
 * @param {Function} cb - callback called with (err)
 */
DataAccessObject.removeById =
  DataAccessObject.deleteById =
    DataAccessObject.destroyById = function deleteById(id, cb) {
      if (stillConnecting(this.getDataSource(), this, arguments)) return;
      var Model = this;

      this.getDataSource().connector.destroy(this.modelName, id, function (err) {
        if ('function' === typeof cb) {
          cb(err);
        }
        if(!err) Model.emit('deleted', id);
      }.bind(this));
    };

// deleteById ~ remoting attributes
setRemoting(DataAccessObject.deleteById, {
  description: 'Delete a model instance by id from the data source',
  accepts: {arg: 'id', type: 'any', description: 'Model id', required: true},
  http: {verb: 'del', path: '/:id'}
});

/**
 * Return count of matched records
 *
 * @param {Object} where - search conditions (optional)
 * @param {Function} cb - callback, called with (err, count)
 */
DataAccessObject.count = function (where, cb) {
  if (stillConnecting(this.getDataSource(), this, arguments)) return;

  if (typeof where === 'function') {
    cb = where;
    where = null;
  }
  where = removeUndefined(where);
  where = this._coerce(where);
  this.getDataSource().connector.count(this.modelName, cb, where);
};

// count ~ remoting attributes
setRemoting(DataAccessObject.count, {
  description: 'Count instances of the model matched by where from the data source',
  accepts: {arg: 'where', type: 'object', description: 'Criteria to match model instances'},
  returns: {arg: 'count', type: 'number'},
  http: {verb: 'get', path: '/count'}
});

/**
 * Save instance. When instance haven't id, create method called instead.
 * Triggers: validate, save, update | create
 * @param options {validate: true, throws: false} [optional]
 * @param callback(err, obj)
 */
DataAccessObject.prototype.save = function (options, callback) {
  if (stillConnecting(this.getDataSource(), this, arguments)) return;
  var Model = this.constructor;

  if (typeof options == 'function') {
    callback = options;
    options = {};
  }

  callback = callback || function () {
  };
  options = options || {};

  if (!('validate' in options)) {
    options.validate = true;
  }
  if (!('throws' in options)) {
    options.throws = false;
  }

  var inst = this;
  var data = inst.toObject(true);
  var Model = this.constructor;
  var modelName = Model.modelName;

  if (!getIdValue(Model, this)) {
    return Model.create(this, callback);
  }

  // validate first
  if (!options.validate) {
    return save();
  }

  inst.isValid(function (valid) {
    if (valid) {
      save();
    } else {
      var err = new ValidationError(inst);
      // throws option is dangerous for async usage
      if (options.throws) {
        throw err;
      }
      callback(err, inst);
    }
  });

  // then save
  function save() {
    inst.trigger('save', function (saveDone) {
      inst.trigger('update', function (updateDone) {
        inst._adapter().save(modelName, inst.constructor._forDB(data), function (err) {
          if (err) {
            return callback(err, inst);
          }
          inst._initProperties(data, false);
          updateDone.call(inst, function () {
            saveDone.call(inst, function () {
              callback(err, inst);
              if(!err) {
                Model.emit('changed', inst);
              }
            });
          });
        });
      }, data);
    }, data);
  }
};

DataAccessObject.prototype.isNewRecord = function () {
  return !getIdValue(this.constructor, this);
};

/**
 * Return connector of current record
 * @private
 */
DataAccessObject.prototype._adapter = function () {
  return this.getDataSource().connector;
};

/**
 * Delete object from persistence
 *
 * @triggers `destroy` hook (async) before and after destroying object
 */
DataAccessObject.prototype.remove =
  DataAccessObject.prototype.delete =
    DataAccessObject.prototype.destroy = function (cb) {
      if (stillConnecting(this.getDataSource(), this, arguments)) return;
      var Model = this.constructor;
      var id = getIdValue(this.constructor, this);

      this.trigger('destroy', function (destroyed) {
        this._adapter().destroy(this.constructor.modelName, id, function (err) {
          if (err) {
            return cb(err);
          }

          destroyed(function () {
            if (cb) cb();
            Model.emit('deleted', id);
          });
        }.bind(this));
      });
    };

/**
 * Update single attribute
 *
 * equals to `updateAttributes({name: value}, cb)
 *
 * @param {String} name - name of property
 * @param {Mixed} value - value of property
 * @param {Function} callback - callback called with (err, instance)
 */
DataAccessObject.prototype.updateAttribute = function updateAttribute(name, value, callback) {
  var data = {};
  data[name] = value;
  this.updateAttributes(data, callback);
};

/**
 * Update set of attributes
 *
 * this method performs validation before updating
 *
 * @trigger `validation`, `save` and `update` hooks
 * @param {Object} data - data to update
 * @param {Function} callback - callback called with (err, instance)
 */
DataAccessObject.prototype.updateAttributes = function updateAttributes(data, cb) {
  if (stillConnecting(this.getDataSource(), this, arguments)) return;

  var inst = this;
  var Model = this.constructor
  var model = Model.modelName;

  if (typeof data === 'function') {
    cb = data;
    data = null;
  }

  if (!data) {
    data = {};
  }

  // update instance's properties
  for (var key in data) {
    inst[key] = data[key];
  }

  inst.isValid(function (valid) {
    if (!valid) {
      if (cb) {
        cb(new ValidationError(inst), inst);
      }
    } else {
      inst.trigger('save', function (saveDone) {
        inst.trigger('update', function (done) {

          for (var key in data) {
            inst[key] = data[key];
          }

          inst._adapter().updateAttributes(model, getIdValue(inst.constructor, inst), inst.constructor._forDB(data), function (err) {
            if (!err) {
              // update $was attrs
              for (var key in data) {
                inst.__dataWas[key] = inst.__data[key];
              }
              ;
            }
            done.call(inst, function () {
              saveDone.call(inst, function () {
                if(cb) cb(err, inst);
                if(!err) Model.emit('changed', inst);
              });
            });
          });
        }, data);
      }, data);
    }
  }, data);
};

// updateAttributes ~ remoting attributes
setRemoting(DataAccessObject.prototype.updateAttributes, {
  description: 'Update attributes for a model instance and persist it into the data source',
  accepts: {arg: 'data', type: 'object', http: {source: 'body'}, description: 'An object of model property name/value pairs'},
  returns: {arg: 'data', type: 'object', root: true},
  http: {verb: 'put', path: '/'}
});

/**
 * Reload object from persistence
 *
 * @requires `id` member of `object` to be able to call `find`
 * @param {Function} callback - called with (err, instance) arguments
 */
DataAccessObject.prototype.reload = function reload(callback) {
  if (stillConnecting(this.getDataSource(), this, arguments)) return;

  this.constructor.findById(getIdValue(this.constructor, this), callback);
};

/*
 setRemoting(DataAccessObject.prototype.reload, {
 description: 'Reload a model instance from the data source',
 returns: {arg: 'data', type: 'object', root: true}
 });
 */

/**
 * Define readonly property on object
 *
 * @param {Object} obj
 * @param {String} key
 * @param {Mixed} value
 */
function defineReadonlyProp(obj, key, value) {
  Object.defineProperty(obj, key, {
    writable: false,
    enumerable: true,
    configurable: true,
    value: value
  });
}

var defineScope = require('./scope.js').defineScope;

/**
 * Define scope
 */
DataAccessObject.scope = function (name, filter, targetClass) {
  defineScope(this, targetClass || this, name, filter);
};

// jutil.mixin(DataAccessObject, validations.Validatable);
jutil.mixin(DataAccessObject, Inclusion);
jutil.mixin(DataAccessObject, Relation);

},{"./connectors/memory":67,"./geo":70,"./include.js":72,"./jutil":74,"./relations.js":79,"./scope.js":80,"./utils":82,"./validations.js":83,"util":58}],69:[function(require,module,exports){
var process=require("__browserify_process");/*!
 * Module dependencies
 */
var ModelBuilder = require('./model-builder.js').ModelBuilder;
var ModelDefinition = require('./model-definition.js');
var jutil = require('./jutil');
var utils = require('./utils');
var ModelBaseClass = require('./model.js');
var DataAccessObject = require('./dao.js');
var List = require('./list.js');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var path = require('path');
var fs = require('fs');
var assert = require('assert');
var async = require('async');

/**
 * Export public API
 */
exports.DataSource = DataSource;

/*!
 * Helpers
 */
var slice = Array.prototype.slice;

/**
 * DataSource - connector-specific classes factory.
 *
 * All classes in single dataSource shares same connector type and
 * one database connection
 *
 * @param {String} name - type of dataSource connector (mysql, mongoose, oracle, redis)
 * @param {Object} settings - any database-specific settings which we need to
 * establish connection (of course it depends on specific connector)
 *
 * - host
 * - port
 * - username
 * - password
 * - database
 * - debug {Boolean} = false
 *
 * @example DataSource creation, waiting for connection callback
 * ```
 * var dataSource = new DataSource('mysql', { database: 'myapp_test' });
 * dataSource.define(...);
 * dataSource.on('connected', function () {
 *     // work with database
 * });
 * ```
 */
function DataSource(name, settings, modelBuilder) {
  if (!(this instanceof DataSource)) {
    return new DataSource(name, settings);
  }

  // Check if the settings object is passed as the first argument
  if (typeof name === 'object' && settings === undefined) {
    settings = name;
    name = undefined;
  }

  // Check if the first argument is a URL
  if (typeof name === 'string' && name.indexOf('://') !== -1) {
    name = utils.parseSettings(name);
  }

  // Check if the settings is in the form of URL string
  if (typeof settings === 'string' && settings.indexOf('://') !== -1) {
    settings = utils.parseSettings(settings);
  }

  this.modelBuilder = modelBuilder || new ModelBuilder();
  this.models = this.modelBuilder.models;
  this.definitions = this.modelBuilder.definitions;

  // operation metadata
  // Initialize it before calling setup as the connector might register operations
  this._operations = {};

  this.setup(name, settings);

  this._setupConnector();

  // connector
  var connector = this.connector;

  // DataAccessObject - connector defined or supply the default
  var dao = (connector && connector.DataAccessObject) || this.constructor.DataAccessObject;
  this.DataAccessObject = function () {
  };

  // define DataAccessObject methods
  Object.keys(dao).forEach(function (name) {
    var fn = dao[name];
    this.DataAccessObject[name] = fn;

    if (typeof fn === 'function') {
      this.defineOperation(name, {
        accepts: fn.accepts,
        'returns': fn.returns,
        http: fn.http,
        remoteEnabled: fn.shared ? true : false,
        scope: this.DataAccessObject,
        fnName: name
      });
    }
  }.bind(this));

  // define DataAccessObject.prototype methods
  Object.keys(dao.prototype).forEach(function (name) {
    var fn = dao.prototype[name];
    this.DataAccessObject.prototype[name] = fn;
    if (typeof fn === 'function') {
      this.defineOperation(name, {
        prototype: true,
        accepts: fn.accepts,
        'returns': fn.returns,
        http: fn.http,
        remoteEnabled: fn.shared ? true : false,
        scope: this.DataAccessObject.prototype,
        fnName: name
      });
    }
  }.bind(this));

}

util.inherits(DataSource, EventEmitter);

// allow child classes to supply a data access object
DataSource.DataAccessObject = DataAccessObject;

/**
 * Set up the connector instance for backward compatibility with JugglingDB schema/adapter
 * @private
 */
DataSource.prototype._setupConnector = function () {
  this.connector = this.connector || this.adapter; // The legacy JugglingDB adapter will set up `adapter` property
  this.adapter = this.connector; // Keep the adapter as an alias to connector
  if (this.connector) {
    if (!this.connector.dataSource) {
      // Set up the dataSource if the connector doesn't do so
      this.connector.dataSource = this;
    }
    var dataSource = this;
    this.connector.log = function (query, start) {
      dataSource.log(query, start);
    };

    this.connector.logger = function (query) {
      var t1 = Date.now();
      var log = this.log;
      return function (q) {
        log(q || query, t1);
      };
    };
  }
};

// List possible connector module names
function connectorModuleNames(name) {
  var names = [name]; // Check the name as is
  if (!name.match(/^\//)) {
    names.push('./connectors/' + name); // Check built-in connectors
    if (name.indexOf('loopback-connector-') !== 0) {
      names.push('loopback-connector-' + name); // Try loopback-connector-<name>
    }
  }
  return names;
}

// testable with DI
function tryModules(names, loader) {
  var mod;
  loader = loader || require;
  for (var m = 0; m < names.length; m++) {
    try {
      mod = loader(names[m]);
    } catch (e) {
      /* ignore */
    }
    if (mod) {
      break;
    }
  }
  return mod;
}

/*!
 * Resolve a connector by name
 * @param name The connector name
 * @returns {*}
 * @private
 */
DataSource._resolveConnector = function (name, loader) {
  var names = connectorModuleNames(name);
  var connector = tryModules(names, loader);
  var error = null;
  if (!connector) {
    error = '\nWARNING: LoopBack connector "' + name
      + '" is not installed at any of the locations ' + names
      + '. To fix, run:\n\n    npm install '
      + name + '\n';
  }
  return {
    connector: connector,
    error: error
  };
};

/**
 * Set up the data source
 * @param {String} name The name
 * @param {Object} settings The settings
 * @returns {*}
 * @private
 */
DataSource.prototype.setup = function (name, settings) {
  var dataSource = this;
  var connector;

  // support single settings object
  if (name && typeof name === 'object' && !settings) {
    settings = name;
    name = undefined;
  }

  if (typeof settings === 'object') {
    if (settings.initialize) {
      connector = settings;
    } else if (settings.connector) {
      connector = settings.connector;
    } else if (settings.adapter) {
      connector = settings.adapter;
    }
  }

  // just save everything we get
  this.settings = settings || {};

  // Check the debug env settings
  var debugEnv = process.env.DEBUG || process.env.NODE_DEBUG || '';
  var debugModules = debugEnv.split(/[\s,]+/);
  if (debugModules.indexOf('loopback') !== -1) {
    this.settings.debug = true;
  }

  // Disconnected by default
  this.connected = false;
  this.connecting = false;

  if (typeof connector === 'string') {
    name = connector;
    connector = undefined;
  }
  name = name || (connector && connector.name);
  this.name = name;

  if (name && !connector) {
    if (typeof name === 'object') {
      // The first argument might be the connector itself
      connector = name;
      this.name = connector.name;
    } else {
      // The connector has not been resolved
      var result = DataSource._resolveConnector(name);
      connector = result.connector;
      if (!connector) {
        console.error(result.error);
        return;
      }
    }
  }

  if (connector) {
    var postInit = function postInit(err, result) {

      this._setupConnector();
      // we have an connector now?
      if (!this.connector) {
        throw new Error('Connector is not defined correctly: it should create `connector` member of dataSource');
      }
      this.connected = !err; // Connected now
      if (this.connected) {
        this.emit('connected');
      } else {
        // The connection fails, let's report it and hope it will be recovered in the next call
        console.error('Connection fails: ', err, '\nIt will be retried for the next request.');
        this.connecting = false;
      }

    }.bind(this);

    if ('function' === typeof connector.initialize) {
      // Call the async initialize method
      connector.initialize(this, postInit);
    } else if ('function' === typeof connector) {
      // Use the connector constructor directly
      this.connector = new connector(this.settings);
      postInit();
    }
  }

  dataSource.connect = function (cb) {
    var dataSource = this;
    if (dataSource.connected || dataSource.connecting) {
      process.nextTick(function () {
        cb && cb();
      });
      return;
    }
    dataSource.connecting = true;
    if (dataSource.connector.connect) {
      dataSource.connector.connect(function (err, result) {
        if (!err) {
          dataSource.connected = true;
          dataSource.connecting = false;
          dataSource.emit('connected');
        } else {
          dataSource.connected = false;
          dataSource.connecting = false;
          dataSource.emit('error', err);
        }
        cb && cb(err, result);
      });
    } else {
      process.nextTick(function () {
        dataSource.connected = true;
        dataSource.connecting = false;
        dataSource.emit('connected');
        cb && cb();
      });
    }
  };
};

function isModelClass(cls) {
  if (!cls) {
    return false;
  }
  return cls.prototype instanceof ModelBaseClass;
}

DataSource.relationTypes = ['belongsTo', 'hasMany', 'hasAndBelongsToMany'];

function isModelDataSourceAttached(model) {
  return model && (!model.settings.unresolved) && (model.dataSource instanceof DataSource);
}
/*!
 * Define relations for the model class from the relations object
 * @param modelClass
 * @param relations
 */
DataSource.prototype.defineRelations = function (modelClass, relations) {

  // Create a function for the closure in the loop
  var createListener = function (name, relation, targetModel, throughModel) {
    if (!isModelDataSourceAttached(targetModel)) {
      targetModel.once('dataSourceAttached', function (model) {
        // Check if the through model doesn't exist or resolved
        if (!throughModel || isModelDataSourceAttached(throughModel)) {
          // The target model is resolved
          var params = {
            foreignKey: relation.foreignKey,
            as: name,
            model: model
          };
          if (throughModel) {
            params.through = throughModel;
          }
          modelClass[relation.type].call(modelClass, name, params);
        }
      });

    }
    if (throughModel && !isModelDataSourceAttached(throughModel)) {
      // Set up a listener to the through model
      throughModel.once('dataSourceAttached', function (model) {
        if (isModelDataSourceAttached(targetModel)) {
          // The target model is resolved
          var params = {
            foreignKey: relation.foreignKey,
            as: name,
            model: targetModel,
            through: model
          };
          modelClass[relation.type].call(modelClass, name, params);
        }
      });
    }
  };

  // Set up the relations
  if (relations) {
    for (var rn in relations) {
      var r = relations[rn];
      assert(DataSource.relationTypes.indexOf(r.type) !== -1, "Invalid relation type: " + r.type);
      var targetModel = isModelClass(r.model) ? r.model : this.getModel(r.model, true);
      var throughModel = null;
      if (r.through) {
        throughModel = isModelClass(r.through) ? r.through : this.getModel(r.through, true);
      }
      if (!isModelDataSourceAttached(targetModel) || (throughModel && !isModelDataSourceAttached(throughModel))) {
        // Create a listener to defer the relation set up
        createListener(rn, r, targetModel, throughModel);
      } else {
        // The target model is resolved
        var params = {
          foreignKey: r.foreignKey,
          as: rn,
          model: targetModel
        };
        if (throughModel) {
          params.through = throughModel;
        }
        modelClass[r.type].call(modelClass, rn, params);
      }
    }
  }
};

/*!
 * Set up the data access functions from the data source
 * @param {Model} modelClass The model class
 * @param {Object} settings The settings object
 */
DataSource.prototype.setupDataAccess = function (modelClass, settings) {
  if (this.connector) {
    // Check if the id property should be generated
    var idName = modelClass.definition.idName();
    var idProp = modelClass.definition.properties[idName];
    if(idProp && idProp.generated && this.connector.getDefaultIdType) {
      // Set the default id type from connector's ability
      var idType = this.connector.getDefaultIdType() || String;
      idProp.type = idType;
    }
    if (this.connector.define) {
      // pass control to connector
      this.connector.define({
        model: modelClass,
        properties: modelClass.definition.properties,
        settings: settings
      });
    }
  }

  // add data access objects
  this.mixin(modelClass);

  var relations = settings.relationships || settings.relations;
  this.defineRelations(modelClass, relations);

};

/**
 * Define a model class
 *
 * @param {String} className
 * @param {Object} properties - hash of class properties in format
 *   `{property: Type, property2: Type2, ...}`
 *   or
 *   `{property: {type: Type}, property2: {type: Type2}, ...}`
 * @param {Object} settings - other configuration of class
 * @return newly created class
 *
 * @example simple case
 * ```
 * var User = dataSource.define('User', {
 *     email: String,
 *     password: String,
 *     birthDate: Date,
 *     activated: Boolean
 * });
 * ```
 * @example more advanced case
 * ```
 * var User = dataSource.define('User', {
 *     email: { type: String, limit: 150, index: true },
 *     password: { type: String, limit: 50 },
 *     birthDate: Date,
 *     registrationDate: {type: Date, default: function () { return new Date }},
 *     activated: { type: Boolean, default: false }
 * });
 * ```
 */

DataSource.prototype.createModel = DataSource.prototype.define = function defineClass(className, properties, settings) {
  var args = slice.call(arguments);

  if (!className) {
    throw new Error('Class name required');
  }
  if (args.length === 1) {
    properties = {};
    args.push(properties);
  }
  if (args.length === 2) {
    settings = {};
    args.push(settings);
  }

  properties = properties || {};
  settings = settings || {};

  if (this.isRelational()) {
    // Set the strict mode to be true for relational DBs by default
    if (settings.strict === undefined || settings.strict === null) {
      settings.strict = true;
    }
    if (settings.strict === false) {
      settings.strict = 'throw';
    }
  }

  var modelClass = this.modelBuilder.define(className, properties, settings);
  modelClass.dataSource = this;

  if (settings.unresolved) {
    return modelClass;
  }

  this.setupDataAccess(modelClass, settings);
  modelClass.emit('dataSourceAttached', modelClass);

  return modelClass;
};

/**
 * Mixin DataAccessObject methods.
 *
 * @param {Function} ModelCtor The model constructor
 */

DataSource.prototype.mixin = function (ModelCtor) {
  var ops = this.operations();
  var DAO = this.DataAccessObject;

  // mixin DAO
  jutil.mixin(ModelCtor, DAO, {proxyFunctions: true});

  // decorate operations as alias functions
  Object.keys(ops).forEach(function (name) {
    var op = ops[name];
    var scope;

    if (op.enabled) {
      scope = op.prototype ? ModelCtor.prototype : ModelCtor;
      // var sfn = scope[name] = function () {
      //   op.scope[op.fnName].apply(self, arguments);
      // }
      Object.keys(op)
        .filter(function (key) {
          // filter out the following keys
          return ~[
            'scope',
            'fnName',
            'prototype'
          ].indexOf(key);
        })
        .forEach(function (key) {
          if (typeof op[key] !== 'undefined') {
            op.scope[op.fnName][key] = op[key];
          }
        });
    }
  });
};

/**
 * @see ModelBuilder.prototype.getModel
 */
DataSource.prototype.getModel = function (name, forceCreate) {
  return this.modelBuilder.getModel(name, forceCreate);
};

/**
 * @see ModelBuilder.prototype.getModelDefinition
 */
DataSource.prototype.getModelDefinition = function (name) {
  return this.modelBuilder.getModelDefinition(name);
};

/**
 * Get the data source types
 * @returns {String[]} The data source type, such as ['db', 'nosql', 'mongodb'],
 * ['rest'], or ['db', 'rdbms', 'mysql']
 */
DataSource.prototype.getTypes = function () {
  var types = this.connector && this.connector.getTypes() || [];
  if (typeof types === 'string') {
    types = types.split(/[\s,\/]+/);
  }
  return types;
};

/**
 * Check the data source supports the given types
 * @param String|String[]) types A type name or an array of type names
 * @return {Boolean} true if all types are supported by the data source
 */
DataSource.prototype.supportTypes = function (types) {
  var supportedTypes = this.getTypes();
  if (Array.isArray(types)) {
    // Check each of the types
    for (var i = 0; i < types.length; i++) {
      if (supportedTypes.indexOf(types[i]) === -1) {
        // Not supported
        return false;
      }
    }
    return true;
  } else {
    // The types is a string
    return supportedTypes.indexOf(types) !== -1;
  }
};

/**
 * Attach an existing model to a data source.
 *
 * @param {Function} modelClass The model constructor
 */

DataSource.prototype.attach = function (modelClass) {
  if (modelClass.dataSource === this) {
    // Already attached to the data source
    return modelClass;
  }

  if (modelClass.modelBuilder !== this.modelBuilder) {
    this.modelBuilder.definitions[modelClass.modelName] = modelClass.definition;
    this.modelBuilder.models[modelClass.modelName] = modelClass;
    // reset the modelBuilder
    modelClass.modelBuilder = this.modelBuilder;
  }

  // redefine the dataSource
  modelClass.dataSource = this;

  this.setupDataAccess(modelClass, modelClass.settings);
  modelClass.emit('dataSourceAttached', modelClass);
  return modelClass;

};

/**
 * Define single property named `prop` on `model`
 *
 * @param {String} model - name of model
 * @param {String} prop - name of property
 * @param {Object} params - property settings
 */
DataSource.prototype.defineProperty = function (model, prop, params) {
  this.modelBuilder.defineProperty(model, prop, params);

  var resolvedProp = this.getModelDefinition(model).properties[prop];
  if (this.connector.defineProperty) {
    this.connector.defineProperty(model, prop, resolvedProp);
  }
};

/**
 * Drop each model table and re-create.
 * This method make sense only for sql connectors.
 *
 * @param {String} or {[String]} Models to be migrated, if not present, apply to all models
 * @param {Function} [cb] The callback function
 *
 * @warning All data will be lost! Use autoupdate if you need your data.
 */
DataSource.prototype.automigrate = function (models, cb) {
  this.freeze();
  if (this.connector.automigrate) {
    this.connector.automigrate(models, cb);
  } else {
    if ((!cb) && ('function' === typeof models)) {
      cb = models;
      models = undefined;
    }
    cb && process.nextTick(cb);
  }
};

/**
 * Update existing database tables.
 * This method make sense only for sql connectors.
 *
 * @param {String} or {[String]} Models to be migrated, if not present, apply to all models
 * @param {Function} [cb] The callback function
 */
DataSource.prototype.autoupdate = function (models, cb) {
  this.freeze();
  if (this.connector.autoupdate) {
    this.connector.autoupdate(models, cb);
  } else {
    if ((!cb) && ('function' === typeof models)) {
      cb = models;
      models = undefined;
    }
    cb && process.nextTick(cb);
  }
};

/**
 * Discover existing database tables.
 * This method returns an array of model objects, including {type, name, onwer}
 *
 * `options`
 *
 *      all: true - Discovering all models, false - Discovering the models owned by the current user
 *      views: true - Including views, false - only tables
 *      limit: The page size
 *      offset: The starting index
 *
 * @param {Object} options The options
 * @param {Function} [cb] The callback function
 *
 */
DataSource.prototype.discoverModelDefinitions = function (options, cb) {
  this.freeze();
  if (this.connector.discoverModelDefinitions) {
    this.connector.discoverModelDefinitions(options, cb);
  } else if (cb) {
    cb();
  }
};

/**
 * The synchronous version of discoverModelDefinitions
 * @param {Object} options The options
 * @returns {*}
 */
DataSource.prototype.discoverModelDefinitionsSync = function (options) {
  this.freeze();
  if (this.connector.discoverModelDefinitionsSync) {
    return this.connector.discoverModelDefinitionsSync(options);
  }
  return null;
};

/**
 * Discover properties for a given model.
 *
 * `property description`
 *
 *      owner {String} The database owner or schema
 *      tableName {String} The table/view name
 *      columnName {String} The column name
 *      dataType {String} The data type
 *      dataLength {Number} The data length
 *      dataPrecision {Number} The numeric data precision
 *      dataScale {Number} The numeric data scale
 *      nullable {Boolean} If the data can be null
 *
 * `options`
 *
 *      owner/schema The database owner/schema
 *
 * @param {String} modelName The table/view name
 * @param {Object} options The options
 * @param {Function} [cb] The callback function
 *
 */
DataSource.prototype.discoverModelProperties = function (modelName, options, cb) {
  this.freeze();
  if (this.connector.discoverModelProperties) {
    this.connector.discoverModelProperties(modelName, options, cb);
  } else if (cb) {
    cb();
  }
};

/**
 * The synchronous version of discoverModelProperties
 * @param {String} modelName The table/view name
 * @param {Object} options The options
 * @returns {*}
 */
DataSource.prototype.discoverModelPropertiesSync = function (modelName, options) {
  this.freeze();
  if (this.connector.discoverModelPropertiesSync) {
    return this.connector.discoverModelPropertiesSync(modelName, options);
  }
  return null;
};

/**
 * Discover primary keys for a given owner/modelName
 *
 * Each primary key column description has the following columns:
 *
 *      owner {String} => table schema (may be null)
 *      tableName {String} => table name
 *      columnName {String} => column name
 *      keySeq {Number} => sequence number within primary key( a value of 1 represents the first column of the primary key, a value of 2 would represent the second column within the primary key).
 *      pkName {String} => primary key name (may be null)
 *
 *      The owner, default to current user
 *
 * `options`
 *
 *      owner/schema The database owner/schema
 *
 * @param {String} modelName The model name
 * @param {Object} options The options
 * @param {Function} [cb] The callback function
 */
DataSource.prototype.discoverPrimaryKeys = function (modelName, options, cb) {
  this.freeze();
  if (this.connector.discoverPrimaryKeys) {
    this.connector.discoverPrimaryKeys(modelName, options, cb);
  } else if (cb) {
    cb();
  }
};

/**
 * The synchronous version of discoverPrimaryKeys
 * @param {String} modelName The model name
 * @param {Object} options The options
 * @returns {*}
 */
DataSource.prototype.discoverPrimaryKeysSync = function (modelName, options) {
  this.freeze();
  if (this.connector.discoverPrimaryKeysSync) {
    return this.connector.discoverPrimaryKeysSync(modelName, options);
  }
  return null;
};

/**
 * Discover foreign keys for a given owner/modelName
 *
 * `foreign key description`
 *
 *      fkOwner String => foreign key table schema (may be null)
 *      fkName String => foreign key name (may be null)
 *      fkTableName String => foreign key table name
 *      fkColumnName String => foreign key column name
 *      keySeq Number => sequence number within a foreign key( a value of 1 represents the first column of the foreign key, a value of 2 would represent the second column within the foreign key).
 *      pkOwner String => primary key table schema being imported (may be null)
 *      pkName String => primary key name (may be null)
 *      pkTableName String => primary key table name being imported
 *      pkColumnName String => primary key column name being imported
 *
 * `options`
 *
 *      owner/schema The database owner/schema
 *
 * @param {String} modelName The model name
 * @param {Object} options The options
 * @param {Function} [cb] The callback function
 *
 */
DataSource.prototype.discoverForeignKeys = function (modelName, options, cb) {
  this.freeze();
  if (this.connector.discoverForeignKeys) {
    this.connector.discoverForeignKeys(modelName, options, cb);
  } else if (cb) {
    cb();
  }
};

/**
 * The synchronous version of discoverForeignKeys
 *
 * @param {String} modelName The model name
 * @param {Object} options The options
 * @returns {*}
 */
DataSource.prototype.discoverForeignKeysSync = function (modelName, options) {
  this.freeze();
  if (this.connector.discoverForeignKeysSync) {
    return this.connector.discoverForeignKeysSync(modelName, options);
  }
  return null;
}

/**
 * Retrieves a description of the foreign key columns that reference the given table's primary key columns (the foreign keys exported by a table).
 * They are ordered by fkTableOwner, fkTableName, and keySeq.
 *
 * `foreign key description`
 *
 *      fkOwner {String} => foreign key table schema (may be null)
 *      fkName {String} => foreign key name (may be null)
 *      fkTableName {String} => foreign key table name
 *      fkColumnName {String} => foreign key column name
 *      keySeq {Number} => sequence number within a foreign key( a value of 1 represents the first column of the foreign key, a value of 2 would represent the second column within the foreign key).
 *      pkOwner {String} => primary key table schema being imported (may be null)
 *      pkName {String} => primary key name (may be null)
 *      pkTableName {String} => primary key table name being imported
 *      pkColumnName {String} => primary key column name being imported
 *
 * `options`
 *
 *      owner/schema The database owner/schema
 *
 * @param {String} modelName The model name
 * @param {Object} options The options
 * @param {Function} [cb] The callback function
 */
DataSource.prototype.discoverExportedForeignKeys = function (modelName, options, cb) {
  this.freeze();
  if (this.connector.discoverExportedForeignKeys) {
    this.connector.discoverExportedForeignKeys(modelName, options, cb);
  } else if (cb) {
    cb();
  }
};

/**
 * The synchronous version of discoverExportedForeignKeys
 * @param {String} modelName The model name
 * @param {Object} options The options
 * @returns {*}
 */
DataSource.prototype.discoverExportedForeignKeysSync = function (modelName, options) {
  this.freeze();
  if (this.connector.discoverExportedForeignKeysSync) {
    return this.connector.discoverExportedForeignKeysSync(modelName, options);
  }
  return null;
};

function capitalize(str) {
  if (!str) {
    return str;
  }
  return str.charAt(0).toUpperCase() + ((str.length > 1) ? str.slice(1).toLowerCase() : '');
}

function fromDBName(dbName, camelCase) {
  if (!dbName) {
    return dbName;
  }
  var parts = dbName.split(/-|_/);
  parts[0] = camelCase ? parts[0].toLowerCase() : capitalize(parts[0]);

  for (var i = 1; i < parts.length; i++) {
    parts[i] = capitalize(parts[i]);
  }
  return parts.join('');
}

/**
 * Discover one schema from the given model without following the relations
 *
 * @param {String} modelName The model name
 * @param {Object} [options] The options
 * @param {Function} [cb] The callback function
 */
DataSource.prototype.discoverSchema = function (modelName, options, cb) {
  options = options || {};

  if (!cb && 'function' === typeof options) {
    cb = options;
    options = {};
  }
  options.visited = {};
  options.relations = false;

  this.discoverSchemas(modelName, options, function (err, schemas) {
    if (err) {
      cb && cb(err, schemas);
      return;
    }
    for (var s in schemas) {
      cb && cb(null, schemas[s]);
      return;
    }
  });
}

/**
 * Discover schema from a given modelName/view
 *
 * `options`
 *
 *      {String} owner/schema - The database owner/schema name
 *      {Boolean} relations - If relations (primary key/foreign key) are navigated
 *      {Boolean} all - If all owners are included
 *      {Boolean} views - If views are included
 *
 * @param {String} modelName The model name
 * @param {Object} [options] The options
 * @param {Function} [cb] The callback function
 */
DataSource.prototype.discoverSchemas = function (modelName, options, cb) {
  options = options || {};

  if (!cb && 'function' === typeof options) {
    cb = options;
    options = {};
  }

  var self = this;
  var schemaName = this.connector.name || this.name;

  var tasks = [
    this.discoverModelProperties.bind(this, modelName, options),
    this.discoverPrimaryKeys.bind(this, modelName, options) ];

  var followingRelations = options.associations || options.relations;
  if (followingRelations) {
    tasks.push(this.discoverForeignKeys.bind(this, modelName, options));
  }

  async.parallel(tasks, function (err, results) {

    if (err) {
      cb && cb(err);
      return;
    }

    var columns = results[0];
    if (!columns || columns.length === 0) {
      cb && cb();
      return;
    }

    // Handle primary keys
    var primaryKeys = results[1];
    var pks = {};
    primaryKeys.forEach(function (pk) {
      pks[pk.columnName] = pk.keySeq;
    });

    if (self.settings.debug) {
      console.log('Primary keys: ', pks);
    }

    var schema = {
      name: fromDBName(modelName, false),
      options: {
        idInjection: false // DO NOT add id property
      },
      properties: {
      }
    };

    schema.options[schemaName] = {
      schema: columns[0].owner,
      table: modelName
    };

    columns.forEach(function (item) {
      var i = item;

      var propName = fromDBName(item.columnName, true);
      schema.properties[propName] = {
        type: item.type,
        required: (item.nullable === 'N'),
        length: item.dataLength,
        precision: item.dataPrecision,
        scale: item.dataScale
      };

      if (pks[item.columnName]) {
        schema.properties[propName].id = pks[item.columnName];
      }
      schema.properties[propName][schemaName] = {
        columnName: i.columnName,
        dataType: i.dataType,
        dataLength: i.dataLength,
        dataPrecision: item.dataPrecision,
        dataScale: item.dataScale,
        nullable: i.nullable
      };
    });

    // Add current modelName to the visited tables
    options.visited = options.visited || {};
    var schemaKey = columns[0].owner + '.' + modelName;
    if (!options.visited.hasOwnProperty(schemaKey)) {
      if (self.settings.debug) {
        console.log('Adding schema for ' + schemaKey);
      }
      options.visited[schemaKey] = schema;
    }

    var otherTables = {};
    if (followingRelations) {
      // Handle foreign keys
      var fks = {};
      var foreignKeys = results[2];
      foreignKeys.forEach(function (fk) {
        var fkInfo = {
          keySeq: fk.keySeq,
          owner: fk.pkOwner,
          tableName: fk.pkTableName,
          columnName: fk.pkColumnName
        };
        if (fks[fk.fkName]) {
          fks[fk.fkName].push(fkInfo);
        } else {
          fks[fk.fkName] = [fkInfo];
        }
      });

      if (self.settings.debug) {
        console.log('Foreign keys: ', fks);
      }

      schema.options.relations = {};
      foreignKeys.forEach(function (fk) {
        var propName = fromDBName(fk.pkTableName, true);
        schema.options.relations[propName] = {
          model: fromDBName(fk.pkTableName, false),
          type: 'belongsTo',
          foreignKey: fromDBName(fk.fkColumnName, true)
        };

        var key = fk.pkOwner + '.' + fk.pkTableName;
        if (!options.visited.hasOwnProperty(key) && !otherTables.hasOwnProperty(key)) {
          otherTables[key] = {owner: fk.pkOwner, tableName: fk.pkTableName};
        }
      });
    }

    if (Object.keys(otherTables).length === 0) {
      cb && cb(null, options.visited);
    } else {
      var moreTasks = [];
      for (var t in otherTables) {
        if (self.settings.debug) {
          console.log('Discovering related schema for ' + schemaKey);
        }
        var newOptions = {};
        for (var key in options) {
          newOptions[key] = options[key];
        }
        newOptions.owner = otherTables[t].owner;

        moreTasks.push(DataSource.prototype.discoverSchemas.bind(self, otherTables[t].tableName, newOptions));
      }
      async.parallel(moreTasks, function (err, results) {
        var result = results && results[0];
        cb && cb(err, result);
      });
    }
  });
};

/**
 * Discover schema from a given table/view synchronously
 *
 * `options`
 *
 *      {String} owner/schema - The database owner/schema name
 *      {Boolean} relations - If relations (primary key/foreign key) are navigated
 *      {Boolean} all - If all owners are included
 *      {Boolean} views - If views are included
 *
 * @param {String} modelName The model name
 * @param {Object} [options] The options
 */
DataSource.prototype.discoverSchemasSync = function (modelName, options) {
  var self = this;
  var schemaName = this.name || this.connector.name;

  var columns = this.discoverModelPropertiesSync(modelName, options);
  if (!columns || columns.length === 0) {
    return [];
  }

  // Handle primary keys
  var primaryKeys = this.discoverPrimaryKeysSync(modelName, options);
  var pks = {};
  primaryKeys.forEach(function (pk) {
    pks[pk.columnName] = pk.keySeq;
  });

  if (self.settings.debug) {
    console.log('Primary keys: ', pks);
  }

  var schema = {
    name: fromDBName(modelName, false),
    options: {
      idInjection: false // DO NOT add id property
    },
    properties: {
    }
  };

  schema.options[schemaName] = {
    schema: columns.length > 0 && columns[0].owner,
    table: modelName
  };

  columns.forEach(function (item) {
    var i = item;

    var propName = fromDBName(item.columnName, true);
    schema.properties[propName] = {
      type: item.type,
      required: (item.nullable === 'N'),
      length: item.dataLength,
      precision: item.dataPrecision,
      scale: item.dataScale
    };

    if (pks[item.columnName]) {
      schema.properties[propName].id = pks[item.columnName];
    }
    schema.properties[propName][schemaName] = {
      columnName: i.columnName,
      dataType: i.dataType,
      dataLength: i.dataLength,
      dataPrecision: item.dataPrecision,
      dataScale: item.dataScale,
      nullable: i.nullable
    };
  });

  // Add current modelName to the visited tables
  options.visited = options.visited || {};
  var schemaKey = columns[0].owner + '.' + modelName;
  if (!options.visited.hasOwnProperty(schemaKey)) {
    if (self.settings.debug) {
      console.log('Adding schema for ' + schemaKey);
    }
    options.visited[schemaKey] = schema;
  }

  var otherTables = {};
  var followingRelations = options.associations || options.relations;
  if (followingRelations) {
    // Handle foreign keys
    var fks = {};
    var foreignKeys = this.discoverForeignKeysSync(modelName, options);
    foreignKeys.forEach(function (fk) {
      var fkInfo = {
        keySeq: fk.keySeq,
        owner: fk.pkOwner,
        tableName: fk.pkTableName,
        columnName: fk.pkColumnName
      };
      if (fks[fk.fkName]) {
        fks[fk.fkName].push(fkInfo);
      } else {
        fks[fk.fkName] = [fkInfo];
      }
    });

    if (self.settings.debug) {
      console.log('Foreign keys: ', fks);
    }

    schema.options.relations = {};
    foreignKeys.forEach(function (fk) {
      var propName = fromDBName(fk.pkTableName, true);
      schema.options.relations[propName] = {
        model: fromDBName(fk.pkTableName, false),
        type: 'belongsTo',
        foreignKey: fromDBName(fk.fkColumnName, true)
      };

      var key = fk.pkOwner + '.' + fk.pkTableName;
      if (!options.visited.hasOwnProperty(key) && !otherTables.hasOwnProperty(key)) {
        otherTables[key] = {owner: fk.pkOwner, tableName: fk.pkTableName};
      }
    });
  }

  if (Object.keys(otherTables).length === 0) {
    return options.visited;
  } else {
    var moreTasks = [];
    for (var t in otherTables) {
      if (self.settings.debug) {
        console.log('Discovering related schema for ' + schemaKey);
      }
      var newOptions = {};
      for (var key in options) {
        newOptions[key] = options[key];
      }
      newOptions.owner = otherTables[t].owner;
      self.discoverSchemasSync(otherTables[t].tableName, newOptions);
    }
    return options.visited;

  }
};

/**
 * Discover and build models from the given owner/modelName
 *
 *  `options`
 *
 *      {String} owner/schema - The database owner/schema name
 *      {Boolean} relations - If relations (primary key/foreign key) are navigated
 *      {Boolean} all - If all owners are included
 *      {Boolean} views - If views are included
 *
 * @param {String} modelName The model name
 * @param {Object} [options] The options
 * @param {Function} [cb] The callback function
 */
DataSource.prototype.discoverAndBuildModels = function (modelName, options, cb) {
  var self = this;
  this.discoverSchemas(modelName, options, function (err, schemas) {
    if (err) {
      cb && cb(err, schemas);
      return;
    }

    var schemaList = [];
    for (var s in schemas) {
      var schema = schemas[s];
      schemaList.push(schema);
    }

    var models = self.modelBuilder.buildModels(schemaList);
    // Now attach the models to the data source
    for (var m in models) {
      models[m].attachTo(self);
    }
    cb && cb(err, models);
  });
};

/**
 * Discover and build models from the given owner/modelName synchronously
 *
 * `options`
 *
 *      {String} owner/schema - The database owner/schema name
 *      {Boolean} relations - If relations (primary key/foreign key) are navigated
 *      {Boolean} all - If all owners are included
 *      {Boolean} views - If views are included
 *
 * @param {String} modelName The model name
 * @param {Object} [options] The options
 */
DataSource.prototype.discoverAndBuildModelsSync = function (modelName, options) {
  var schemas = this.discoverSchemasSync(modelName, options);

  var schemaList = [];
  for (var s in schemas) {
    var schema = schemas[s];
    schemaList.push(schema);
  }

  var models = this.modelBuilder.buildModels(schemaList);
  return models;
};

/**
 * Check whether migrations needed
 * This method make sense only for sql connectors.
 * @param {String[]} [models] A model name or an array of model names. If not present, apply to all models
 */
DataSource.prototype.isActual = function (models, cb) {
  this.freeze();
  if (this.connector.isActual) {
    this.connector.isActual(models, cb);
  } else {
    if ((!cb) && ('function' === typeof models)) {
      cb = models;
      models = undefined;
    }
    if (cb) {
      process.nextTick(function () {
        cb(null, true);
      });
    }
  }
};

/**
 * Log benchmarked message. Do not redefine this method, if you need to grab
 * chema logs, use `dataSource.on('log', ...)` emitter event
 *
 * @private used by connectors
 */
DataSource.prototype.log = function (sql, t) {
  this.emit('log', sql, t);
};

/**
 * Freeze dataSource. Behavior depends on connector
 */
DataSource.prototype.freeze = function freeze() {
  if (this.connector.freezeDataSource) {
    this.connector.freezeDataSource();
  }
  if (this.connector.freezeSchema) {
    this.connector.freezeSchema();
  }
}

/**
 * Return table name for specified `modelName`
 * @param {String} modelName The model name
 */
DataSource.prototype.tableName = function (modelName) {
  return this.getModelDefinition(modelName).tableName(this.connector.name);
};

/**
 * Return column name for specified modelName and propertyName
 * @param {String} modelName The model name
 * @param propertyName The property name
 * @returns {String} columnName
 */
DataSource.prototype.columnName = function (modelName, propertyName) {
  return this.getModelDefinition(modelName).columnName(this.connector.name, propertyName);
};

/**
 * Return column metadata for specified modelName and propertyName
 * @param {String} modelName The model name
 * @param propertyName The property name
 * @returns {Object} column metadata
 */
DataSource.prototype.columnMetadata = function (modelName, propertyName) {
  return this.getModelDefinition(modelName).columnMetadata(this.connector.name, propertyName);
};

/**
 * Return column names for specified modelName
 * @param {String} modelName The model name
 * @returns {String[]} column names
 */
DataSource.prototype.columnNames = function (modelName) {
  return this.getModelDefinition(modelName).columnNames(this.connector.name);
};

/**
 * Find the ID column name
 * @param {String} modelName The model name
 * @returns {String} columnName for ID
 */
DataSource.prototype.idColumnName = function (modelName) {
  return this.getModelDefinition(modelName).idColumnName(this.connector.name);
};

/**
 * Find the ID property name
 * @param {String} modelName The model name
 * @returns {String} property name for ID
 */
DataSource.prototype.idName = function (modelName) {
  if (!this.getModelDefinition(modelName).idName) {
    console.error('No id name', this.getModelDefinition(modelName));
  }
  return this.getModelDefinition(modelName).idName();
};

/**
 * Find the ID property names sorted by the index
 * @param {String} modelName The model name
 * @returns {String[]} property names for IDs
 */
DataSource.prototype.idNames = function (modelName) {
  return this.getModelDefinition(modelName).idNames();
};

/**
 * Define foreign key to another model
 * @param {String} className The model name that owns the key
 * @param {String} key - name of key field
 * @param {String} foreignClassName The foreign model name
 */
DataSource.prototype.defineForeignKey = function defineForeignKey(className, key, foreignClassName) {
  // quit if key already defined
  if (this.getModelDefinition(className).rawProperties[key]) return;

  var defaultType = Number;
  if (foreignClassName) {
    var foreignModel = this.getModelDefinition(foreignClassName);
    var pkName = foreignModel && foreignModel.idName();
    if (pkName) {
      defaultType = foreignModel.properties[pkName].type;
    }
  }
  if (this.connector.defineForeignKey) {
    var cb = function (err, keyType) {
      if (err) throw err;
      // Add the foreign key property to the data source _models
      this.defineProperty(className, key, {type: keyType || defaultType});
    }.bind(this);
    switch (this.connector.defineForeignKey.length) {
      case 4:
        this.connector.defineForeignKey(className, key, foreignClassName, cb);
        break;
      default:
      case 3:
        this.connector.defineForeignKey(className, key, cb);
        break;
    }
  } else {
    // Add the foreign key property to the data source _models
    this.defineProperty(className, key, {type: defaultType});
  }

};

/**
 * Close database connection
 * @param {Fucntion} [cb] The callback function
 */
DataSource.prototype.disconnect = function disconnect(cb) {
  var self = this;
  if (this.connected && (typeof this.connector.disconnect === 'function')) {
    this.connector.disconnect(function (err, result) {
      self.connected = false;
      cb && cb(err, result);
    });
  } else {
    process.nextTick(function () {
      cb && cb();
    });
  }
};

/**
 * Copy the model from Master
 * @param {Function} Master The model constructor
 * @returns {Function} The copy of the model constructor
 *
 * @private
 */
DataSource.prototype.copyModel = function copyModel(Master) {
  var dataSource = this;
  var className = Master.modelName;
  var md = Master.modelBuilder.getModelDefinition(className);
  var Slave = function SlaveModel() {
    Master.apply(this, [].slice.call(arguments));
  };

  util.inherits(Slave, Master);

  // Delegating static properties
  Slave.__proto__ = Master;

  hiddenProperty(Slave, 'dataSource', dataSource);
  hiddenProperty(Slave, 'modelName', className);
  hiddenProperty(Slave, 'relations', Master.relations);

  if (!(className in dataSource.modelBuilder.models)) {

    // store class in model pool
    dataSource.modelBuilder.models[className] = Slave;
    dataSource.modelBuilder.definitions[className] = new ModelDefinition(dataSource.modelBuilder, md.name, md.properties, md.settings);

    if ((!dataSource.isTransaction) && dataSource.connector && dataSource.connector.define) {
      dataSource.connector.define({
        model: Slave,
        properties: md.properties,
        settings: md.settings
      });
    }

  }

  return Slave;
};

/**
 *
 * @returns {EventEmitter}
 * @private
 */
DataSource.prototype.transaction = function () {
  var dataSource = this;
  var transaction = new EventEmitter();

  for (var p in dataSource) {
    transaction[p] = dataSource[p];
  }

  transaction.isTransaction = true;
  transaction.origin = dataSource;
  transaction.name = dataSource.name;
  transaction.settings = dataSource.settings;
  transaction.connected = false;
  transaction.connecting = false;
  transaction.connector = dataSource.connector.transaction();

  // create blank models pool
  transaction.modelBuilder = new ModelBuilder();
  transaction.models = transaction.modelBuilder.models;
  transaction.definitions = transaction.modelBuilder.definitions;

  for (var i in dataSource.modelBuilder.models) {
    dataSource.copyModel.call(transaction, dataSource.modelBuilder.models[i]);
  }

  transaction.exec = function (cb) {
    transaction.connector.exec(cb);
  };

  return transaction;
};

/**
 * Enable a data source operation to be remote.
 * @param {String} operation The operation name
 */

DataSource.prototype.enableRemote = function (operation) {
  var op = this.getOperation(operation);
  if (op) {
    op.remoteEnabled = true;
  } else {
    throw new Error(operation + ' is not provided by the attached connector');
  }
}

/**
 * Disable a data source operation to be remote.
 * @param {String} operation The operation name
 */

DataSource.prototype.disableRemote = function (operation) {
  var op = this.getOperation(operation);
  if (op) {
    op.remoteEnabled = false;
  } else {
    throw new Error(operation + ' is not provided by the attached connector');
  }
}

/**
 * Get an operation's metadata.
 * @param {String} operation The operation name
 */

DataSource.prototype.getOperation = function (operation) {
  var ops = this.operations();
  var opKeys = Object.keys(ops);

  for (var i = 0; i < opKeys.length; i++) {
    var op = ops[opKeys[i]];

    if (op.name === operation) {
      return op;
    }
  }
}

/**
 * Get all operations.
 */
DataSource.prototype.operations = function () {
  return this._operations;
}

/**
 * Define an operation to the data source
 * @param {String} name The operation name
 * @param {Object} options The options
 * @param [Function} fn The function
 */
DataSource.prototype.defineOperation = function (name, options, fn) {
  options.fn = fn;
  options.name = name;
  this._operations[name] = options;
};

/**
 * Check if the backend is a relational DB
 * @returns {Boolean}
 */
DataSource.prototype.isRelational = function () {
  return this.connector && this.connector.relational;
};

/**
 * Check if the data source is ready
 * @param obj
 * @param args
 * @returns {boolean}
 */
DataSource.prototype.ready = function (obj, args) {
  var self = this;
  if (this.connected) {
    // Connected
    return false;
  }

  var method = args.callee;
  // Set up a callback after the connection is established to continue the method call

  var onConnected = null, onError = null;
  onConnected = function () {
    // Remove the error handler
    self.removeListener('error', onError);
    method.apply(obj, [].slice.call(args));
  };
  onError = function (err) {
    // Remove the connected listener
    self.removeListener('connected', onConnected);
    var params = [].slice.call(args);
    var cb = params.pop();
    if (typeof cb === 'function') {
      cb(err);
    }
  };
  this.once('connected', onConnected);
  this.once('error', onError);
  if (!this.connecting) {
    this.connect();
  }
  return true;
};

/**
 * Define a hidden property
 * @param {Object} obj The property owner
 * @param {String} key The property name
 * @param {Mixed} value The default value
 */
function hiddenProperty(obj, key, value) {
  Object.defineProperty(obj, key, {
    writable: false,
    enumerable: false,
    configurable: false,
    value: value
  });
}

/**
 * Define readonly property on object
 *
 * @param {Object} obj The property owner
 * @param {String} key The property name
 * @param {Mixed} value The default value
 */
function defineReadonlyProp(obj, key, value) {
  Object.defineProperty(obj, key, {
    writable: false,
    enumerable: true,
    configurable: true,
    value: value
  });
}

// Carry over a few properties/methods from the ModelBuilder as some tests use them
DataSource.Text = ModelBuilder.Text;
DataSource.JSON = ModelBuilder.JSON;
DataSource.Any = ModelBuilder.Any;

/*!
 * @deprecated Use ModelBuilder.registerType instead
 * @param type
 */
DataSource.registerType = function (type) {
  ModelBuilder.registerType(type);
};


},{"./dao.js":68,"./jutil":74,"./list.js":75,"./model-builder.js":76,"./model-definition.js":77,"./model.js":78,"./utils":82,"__browserify_process":39,"assert":24,"async":84,"events":32,"fs":23,"path":43,"util":58}],70:[function(require,module,exports){
/**
 * Dependencies.
 */

var assert = require('assert');

/*!
 * Get a near filter from a given where object. For connector use only.
 */

exports.nearFilter = function nearFilter(where) {
  var result = false;

  if (where && typeof where === 'object') {
    Object.keys(where).forEach(function (key) {
      var ex = where[key];

      if (ex && ex.near) {
        result = {
          near: ex.near,
          maxDistance: ex.maxDistance,
          key: key
        };
      }
    });
  }

  return result;
}

/*!
 * Filter a set of objects using the given `nearFilter`.
 */

exports.filter = function (arr, filter) {
  var origin = filter.near;
  var max = filter.maxDistance > 0 ? filter.maxDistance : false;
  var key = filter.key;

  // create distance index
  var distances = {};
  var result = [];

  arr.forEach(function (obj) {
    var loc = obj[key];

    // filter out objects without locations
    if (!loc) return;

    if (!(loc instanceof GeoPoint)) {
      loc = GeoPoint(loc);
    }

    if (typeof loc.lat !== 'number') return;
    if (typeof loc.lng !== 'number') return;

    var d = GeoPoint.distanceBetween(origin, loc);

    if (max && d > max) {
      // dont add
    } else {
      distances[obj.id] = d;
      result.push(obj);
    }
  });

  return result.sort(function (objA, objB) {
    var a = objB[key];
    var b = objB[key];

    if (a && b) {
      var da = distances[objA.id];
      var db = distances[objB.id];

      if (db === da) return 0;
      return da > db ? 1 : -1;
    } else {
      return 0;
    }
  });
}

/**
 * Export the `GeoPoint` class.
 */

exports.GeoPoint = GeoPoint;

function GeoPoint(data) {
  if (!(this instanceof GeoPoint)) {
    return new GeoPoint(data);
  }

  if (typeof data === 'string') {
    data = data.split(/,\s*/);
    assert(data.length === 2, 'must provide a string "lng,lat" creating a GeoPoint with a string');
  }
  if (Array.isArray(data)) {
    data = {
      lng: Number(data[0]),
      lat: Number(data[1])
    };
  } else {
    data.lng = Number(data.lng);
    data.lat = Number(data.lat);
  }

  assert(typeof data === 'object', 'must provide a lat and lng object when creating a GeoPoint');
  assert(typeof data.lat === 'number' && !isNaN(data.lat), 'lat must be a number when creating a GeoPoint');
  assert(typeof data.lng === 'number' && !isNaN(data.lng), 'lng must be a number when creating a GeoPoint');
  assert(data.lng <= 180, 'lng must be <= 180');
  assert(data.lng >= -180, 'lng must be >= -180');
  assert(data.lat <= 90, 'lat must be <= 90');
  assert(data.lat >= -90, 'lat must be >= -90');

  this.lat = data.lat;
  this.lng = data.lng;
}

/**
 * Determine the spherical distance between two geo points.
 */

GeoPoint.distanceBetween = function distanceBetween(a, b, options) {
  if (!(a instanceof GeoPoint)) {
    a = GeoPoint(a);
  }
  if (!(b instanceof GeoPoint)) {
    b = GeoPoint(b);
  }

  var x1 = a.lat;
  var y1 = a.lng;

  var x2 = b.lat;
  var y2 = b.lng;

  return geoDistance(x1, y1, x2, y2, options);
}

/**
 * Determine the spherical distance to the given point.
 */

GeoPoint.prototype.distanceTo = function (point, options) {
  return GeoPoint.distanceBetween(this, point, options);
}

/**
 * Simple serialization.
 */

GeoPoint.prototype.toString = function () {
  return this.lng + ',' + this.lat;
}

/**
 * Si
 */

// ratio of a circle's circumference to its diameter
var PI = 3.1415926535897932384626433832795;

// factor to convert decimal degrees to radians
var DEG2RAD = 0.01745329252;

// factor to convert decimal degrees to radians
var RAD2DEG = 57.29577951308;

// radius of the earth
var EARTH_RADIUS = {
  kilometers: 6370.99056,
  meters: 6370990.56,
  miles: 3958.75,
  feet: 20902200,
  radians: 1,
  degrees: RAD2DEG
};

function geoDistance(x1, y1, x2, y2, options) {
  // Convert to radians
  x1 = x1 * DEG2RAD;
  y1 = y1 * DEG2RAD;
  x2 = x2 * DEG2RAD;
  y2 = y2 * DEG2RAD;

  var a = Math.pow(Math.sin(( y2 - y1 ) / 2.0), 2);
  var b = Math.pow(Math.sin(( x2 - x1 ) / 2.0), 2);
  var c = Math.sqrt(a + Math.cos(y2) * Math.cos(y1) * b);

  var type = (options && options.type) || 'miles';

  return 2 * Math.asin(c) * EARTH_RADIUS[type];
}


},{"assert":24}],71:[function(require,module,exports){
/**
 * Module exports
 */
module.exports = Hookable;

/**
 * Hooks mixins
 */

function Hookable() {
}

/**
 * List of hooks available
 */
Hookable.afterInitialize = null;
Hookable.beforeValidate = null;
Hookable.afterValidate = null;
Hookable.beforeSave = null;
Hookable.afterSave = null;
Hookable.beforeCreate = null;
Hookable.afterCreate = null;
Hookable.beforeUpdate = null;
Hookable.afterUpdate = null;
Hookable.beforeDestroy = null;
Hookable.afterDestroy = null;

// TODO: Evaluate https://github.com/bnoguchi/hooks-js/
Hookable.prototype.trigger = function trigger(actionName, work, data) {
  var capitalizedName = capitalize(actionName);
  var beforeHook = this.constructor["before" + capitalizedName]
    || this.constructor["pre" + capitalizedName];
  var afterHook = this.constructor["after" + capitalizedName]
    || this.constructor["post" + capitalizedName];
  if (actionName === 'validate') {
    beforeHook = beforeHook || this.constructor.beforeValidation;
    afterHook = afterHook || this.constructor.afterValidation;
  }
  var inst = this;

  // we only call "before" hook when we have actual action (work) to perform
  if (work) {
    if (beforeHook) {
      // before hook should be called on instance with one param: callback
      beforeHook.call(inst, function () {
        // actual action also have one param: callback
        work.call(inst, next);
      }, data);
    } else {
      work.call(inst, next);
    }
  } else {
    next();
  }

  function next(done) {
    if (afterHook) {
      afterHook.call(inst, done);
    } else if (done) {
      done.call(this);
    }
  }
};

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

},{}],72:[function(require,module,exports){
var utils = require('./utils');
var isPlainObject = utils.isPlainObject;
var defineCachedRelations = utils.defineCachedRelations;

/**
 * Include mixin for ./model.js
 */
module.exports = Inclusion;

function Inclusion() {
}

/**
 * Allows you to load relations of several objects and optimize numbers of requests.
 *
 * @param {Array} objects - array of instances
 * @param {String}, {Object} or {Array} include - which relations you want to load.
 * @param {Function} cb - Callback called when relations are loaded
 *
 * Examples:
 *
 * - User.include(users, 'posts', function() {}); will load all users posts with only one additional request.
 * - User.include(users, ['posts'], function() {}); // same
 * - User.include(users, ['posts', 'passports'], function() {}); // will load all users posts and passports with two
 *     additional requests.
 * - Passport.include(passports, {owner: 'posts'}, function() {}); // will load all passports owner (users), and all
 *     posts of each owner loaded
 * - Passport.include(passports, {owner: ['posts', 'passports']}); // ...
 * - Passport.include(passports, {owner: [{posts: 'images'}, 'passports']}); // ...
 *
 */
Inclusion.include = function (objects, include, cb) {
  var self = this;

  if (
    !include || (Array.isArray(include) && include.length === 0) ||
      (isPlainObject(include) && Object.keys(include).length === 0)
    ) {
    cb(null, objects);
    return;
  }

  include = processIncludeJoin(include);

  var keyVals = {};
  var objsByKeys = {};

  var nbCallbacks = 0;
  for (var i = 0; i < include.length; i++) {
    var callback = processIncludeItem(objects, include[i], keyVals, objsByKeys);
    if (callback !== null) {
      nbCallbacks++;
      callback(function () {
        nbCallbacks--;
        if (nbCallbacks === 0) {
          cb(null, objects);
        }
      });
    } else {
      cb(null, objects);
    }
  }

  function processIncludeJoin(ij) {
    if (typeof ij === 'string') {
      ij = [ij];
    }
    if (isPlainObject(ij)) {
      var newIj = [];
      for (var key in ij) {
        var obj = {};
        obj[key] = ij[key];
        newIj.push(obj);
      }
      return newIj;
    }
    return ij;
  }

  function processIncludeItem(objs, include, keyVals, objsByKeys) {
    var relations = self.relations;

    var relationName, subInclude;
    if (isPlainObject(include)) {
      relationName = Object.keys(include)[0];
      subInclude = include[relationName];
    } else {
      relationName = include;
      subInclude = [];
    }
    var relation = relations[relationName];

    if (!relation) {
      return function () {
        cb(new Error('Relation "' + relationName + '" is not defined for '
          + self.modelName + ' model'));
      };
    }

    var req = {'where': {}};

    if (!keyVals[relation.keyFrom]) {
      objsByKeys[relation.keyFrom] = {};
      objs.filter(Boolean).forEach(function (obj) {
        if (!objsByKeys[relation.keyFrom][obj[relation.keyFrom]]) {
          objsByKeys[relation.keyFrom][obj[relation.keyFrom]] = [];
        }
        objsByKeys[relation.keyFrom][obj[relation.keyFrom]].push(obj);
      });
      keyVals[relation.keyFrom] = Object.keys(objsByKeys[relation.keyFrom]);
    }

    if (keyVals[relation.keyFrom].length > 0) {
      // deep clone is necessary since inq seems to change the processed array
      var keysToBeProcessed = {};
      var inValues = [];
      for (var j = 0; j < keyVals[relation.keyFrom].length; j++) {
        keysToBeProcessed[keyVals[relation.keyFrom][j]] = true;
        if (keyVals[relation.keyFrom][j] !== 'null'
          && keyVals[relation.keyFrom][j] !== 'undefined') {
          inValues.push(keyVals[relation.keyFrom][j]);
        }
      }

      req.where[relation.keyTo] = {inq: inValues};
      req.include = subInclude;

      return function (cb) {
        relation.modelTo.find(req, function (err, objsIncluded) {
          var objectsFrom, j;
          for (var i = 0; i < objsIncluded.length; i++) {
            delete keysToBeProcessed[objsIncluded[i][relation.keyTo]];
            objectsFrom = objsByKeys[relation.keyFrom][objsIncluded[i][relation.keyTo]];
            for (j = 0; j < objectsFrom.length; j++) {
              defineCachedRelations(objectsFrom[j]);
              if (relation.multiple) {
                if (!objectsFrom[j].__cachedRelations[relationName]) {
                  objectsFrom[j].__cachedRelations[relationName] = [];
                }
                objectsFrom[j].__cachedRelations[relationName].push(objsIncluded[i]);
              } else {
                objectsFrom[j].__cachedRelations[relationName] = objsIncluded[i];
              }
            }
          }

          // No relation have been found for these keys
          for (var key in keysToBeProcessed) {
            objectsFrom = objsByKeys[relation.keyFrom][key];
            for (j = 0; j < objectsFrom.length; j++) {
              defineCachedRelations(objectsFrom[j]);
              objectsFrom[j].__cachedRelations[relationName] =
                relation.multiple ? [] : null;
            }
          }
          cb(err, objsIncluded);
        });
      };
    }

    return null;
  }
};


},{"./utils":82}],73:[function(require,module,exports){
module.exports = function getIntrospector(ModelBuilder) {

  function introspectType(value) {

    // Unknown type, using Any
    if (value === null || value === undefined) {
      return ModelBuilder.Any;
    }

    // Check registered schemaTypes
    for (var t in ModelBuilder.schemaTypes) {
      var st = ModelBuilder.schemaTypes[t];
      if (st !== Object && st !== Array && (value instanceof st)) {
        return t;
      }
    }

    var type = typeof value;
    if (type === 'string' || type === 'number' || type === 'boolean') {
      return type;
    }

    if (value instanceof Date) {
      return 'date';
    }

    if (Array.isArray(value)) {
      for (var i = 0; i < value.length; i++) {
        if (value[i] === null || value[i] === undefined) {
          continue;
        }
        var itemType = introspectType(value[i]);
        if (itemType) {
          return [itemType];
        }
      }
      return 'array';
    }

    if (type === 'function') {
      return value.constructor.name;
    }

    var properties = {};
    for (var p in value) {
      var itemType = introspectType(value[p]);
      if (itemType) {
        properties[p] = itemType;
      }
    }
    if (Object.keys(properties).length === 0) {
      return 'object';
    }
    return properties;
  }

  return introspectType;
}



},{}],74:[function(require,module,exports){
var util = require('util');
/**
 *
 * @param newClass
 * @param baseClass
 */
exports.inherits = function (newClass, baseClass, options) {
  util.inherits(newClass, baseClass);

  options = options || {
    staticProperties: true,
    override: false
  };

  if (options.staticProperties) {
    Object.keys(baseClass).forEach(function (classProp) {
      if (classProp !== 'super_' && (!newClass.hasOwnProperty(classProp)
        || options.override)) {
        var pd = Object.getOwnPropertyDescriptor(baseClass, classProp);
        Object.defineProperty(newClass, classProp, pd);
      }
    });
  }
};

/**
 * Mix in the a class into the new class
 * @param newClass The target class to receive the mixin
 * @param mixinClass The class to be mixed in
 * @param options
 */
exports.mixin = function (newClass, mixinClass, options) {
  if (Array.isArray(newClass._mixins)) {
    if (newClass._mixins.indexOf(mixinClass) !== -1) {
      return;
    }
    newClass._mixins.push(mixinClass);
  } else {
    newClass._mixins = [mixinClass];
  }

  options = options || {
    staticProperties: true,
    instanceProperties: true,
    override: false,
    proxyFunctions: false
  };

  if (options.staticProperties === undefined) {
    options.staticProperties = true;
  }

  if (options.instanceProperties === undefined) {
    options.instanceProperties = true;
  }

  if (options.staticProperties) {
    var staticProxies = [];
    Object.keys(mixinClass).forEach(function (classProp) {
      if (classProp !== 'super_' && classProp !== '_mixins'
        && (!newClass.hasOwnProperty(classProp) || options.override)) {
        var pd = Object.getOwnPropertyDescriptor(mixinClass, classProp);
        if (options.proxyFunctions && pd.writable
          && typeof pd.value === 'function') {
          pd.value = exports.proxy(pd.value, staticProxies);
        }
        Object.defineProperty(newClass, classProp, pd);
      }
    });
  }

  if (options.instanceProperties) {
    if (mixinClass.prototype) {
      var instanceProxies = [];
      Object.keys(mixinClass.prototype).forEach(function (instanceProp) {
        if (!newClass.prototype.hasOwnProperty(instanceProp) || options.override) {
          var pd = Object.getOwnPropertyDescriptor(mixinClass.prototype, instanceProp);
          if (options.proxyFunctions && pd.writable && typeof pd.value === 'function') {
            pd.value = exports.proxy(pd.value, instanceProxies);
          }
          Object.defineProperty(newClass.prototype, instanceProp, pd);
        }
      });
    }
  }

  return newClass;
};

exports.proxy = function (fn, proxies) {
  // Make sure same methods referenced by different properties have the same proxy
  // For example, deleteById is an alias of removeById
  proxies = proxies || [];
  for (var i = 0; i < proxies.length; i++) {
    if (proxies[i]._delegate === fn) {
      return proxies[i];
    }
  }
  var f = function () {
    return fn.apply(this, arguments);
  };
  f._delegate = fn;
  proxies.push(f);
  Object.keys(fn).forEach(function (x) {
    f[x] = fn[x];
  });
  return f;
};


},{"util":58}],75:[function(require,module,exports){
module.exports = List;

/**
 * List class provides functionality of nested collection
 *
 * @param {Array} data - array of items.
 * @param {Crap} type - array with some type information? TODO: rework this API.
 * @param {AbstractClass} parent - owner of list.
 * @constructor
 */
function List(data, type, parent) {
  var list = this;
  if (!(list instanceof List)) {
    return new List(data, type, parent);
  }

  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (e) {
      throw new Error('could not create List from JSON string: ', data);
    }
  }

  if (data && data instanceof List) data = data.items;

  Object.defineProperty(list, 'parent', {
    writable: false,
    enumerable: false,
    configurable: false,
    value: parent
  });

  Object.defineProperty(list, 'nextid', {
    writable: true,
    enumerable: false,
    value: 1
  });

  data = list.items = data || [];
  var Item = list.ItemType = ListItem;

  if (typeof type === 'object' && type.constructor.name === 'Array') {
    Item = list.ItemType = type[0] || ListItem;
  }

  data.forEach(function (item, i) {
    data[i] = Item(item, list);
    Object.defineProperty(list, data[i].id, {
      writable: true,
      enumerable: false,
      configurable: true,
      value: data[i]
    });
    if (list.nextid <= data[i].id) {
      list.nextid = data[i].id + 1;
    }
  });

  Object.defineProperty(list, 'length', {
    enumerable: false,
    configurable: true,
    get: function () {
      return list.items.length;
    }
  });

  return list;

}

var _;
try {
  var underscore = 'underscore';
  _ = require(underscore);
} catch (e) {
  _ = false;
}

if (_) {
  var _import = [
    // collection methods
    'each',
    'map',
    'reduce',
    'reduceRight',
    'find',
    'filter',
    'reject',
    'all',
    'any',
    'include',
    'invoke',
    'pluck',
    'max',
    'min',
    'sortBy',
    'groupBy',
    'sortedIndex',
    'shuffle',
    'toArray',
    'size',
    // array methods
    'first',
    'initial',
    'last',
    'rest',
    'compact',
    'flatten',
    'without',
    'union',
    'intersection',
    'difference',
    'uniq',
    'zip',
    'indexOf',
    'lastIndexOf',
    'range'
  ];

  _import.forEach(function (name) {
    List.prototype[name] = function () {
      var args = [].slice.call(arguments);
      args.unshift(this.items);
      return _[name].apply(_, args);
    };
  });
}

['slice', 'forEach', 'filter', 'reduce', 'map'].forEach(function (method) {
  var slice = [].slice;
  List.prototype[method] = function () {
    return Array.prototype[method].apply(this.items, slice.call(arguments));
  };
});

List.prototype.find = function (pattern, field) {
  if (field) {
    var res;
    this.items.forEach(function (o) {
      if (o[field] == pattern) res = o;
    });
    return res;
  } else {
    return this.items[this.items.indexOf(pattern)];
  }
};

List.prototype.toObject = function (onlySchema) {
  var items = [];
  this.items.forEach(function (item) {
    if (item.toObject) {
      items.push(item.toObject(onlySchema));
    } else {
      items.push(item);
    }
  });
  return items;
};

List.prototype.toJSON = function () {
  return this.toObject(true);
};

List.prototype.toString = function () {
  return JSON.stringify(this.items);
};

List.prototype.autoincrement = function () {
  return this.nextid++;
};

List.prototype.push = function (obj) {
  var item = new ListItem(obj, this);
  this.items.push(item);
  return item;
};

List.prototype.remove = function (obj) {
  var id = obj.id ? obj.id : obj;
  var found = false;
  this.items.forEach(function (o, i) {
    if (id && o.id == id) {
      found = i;
      if (o.id !== id) {
        console.log('WARNING! Type of id not matched');
      }
    }
  });
  if (found !== false) {
    delete this[id];
    this.items.splice(found, 1);
  }
};

List.prototype.sort = function (cb) {
  return this.items.sort(cb);
};

List.prototype.map = function (cb) {
  if (typeof cb === 'function') return this.items.map(cb);
  if (typeof cb === 'string') return this.items.map(function (el) {
    if (typeof el[cb] === 'function') return el[cb]();
    if (el.hasOwnProperty(cb)) return el[cb];
  });
};

function ListItem(data, parent) {
  if (!(this instanceof  ListItem)) {
    return new ListItem(data, parent);
  }
  if (typeof data === 'object') {
    for (var i in data) this[i] = data[i];
  } else {
    this.id = data;
  }
  Object.defineProperty(this, 'parent', {
    writable: false,
    enumerable: false,
    configurable: true,
    value: parent
  });
  if (!this.id) {
    this.id = parent.autoincrement();
  }
  if (parent.ItemType) {
    this.__proto__ = parent.ItemType.prototype;
    if (parent.ItemType !== ListItem) {
      parent.ItemType.apply(this);
    }
  }

  this.save = function (c) {
    parent.parent.save(c);
  };
}


},{}],76:[function(require,module,exports){
/*!
 * Module dependencies
 */

var inflection = require('inflection');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var assert = require('assert');
var DefaultModelBaseClass = require('./model.js');
var List = require('./list.js');
var ModelDefinition = require('./model-definition.js');
var mergeSettings = require('./utils').mergeSettings;

// Set up types
require('./types')(ModelBuilder);

var introspect = require('./introspection')(ModelBuilder);

/**
 * Export public API
 */
exports.ModelBuilder = exports.Schema = ModelBuilder;

/*!
 * Helpers
 */
var slice = Array.prototype.slice;

/**
 * ModelBuilder - A builder to define data models
 *
 * @constructor
 */
function ModelBuilder() {
  // create blank models pool
  /**
   * @property {Object} models Model constructors
   */
  this.models = {};
  /**
   * @property {Object} definitions Definitions of the models
   */
  this.definitions = {};
}

// Inherit from EventEmitter
util.inherits(ModelBuilder, EventEmitter);

// Create a default instance
ModelBuilder.defaultInstance = new ModelBuilder();

function isModelClass(cls) {
  if (!cls) {
    return false;
  }
  return cls.prototype instanceof DefaultModelBaseClass;
}

/**
 * Get a model by name
 * @param {String} name The model name
 * @param {Boolean} forceCreate Indicate if a stub should be created for the
 * given name if a model doesn't exist
 * @returns {*} The model class
 */
ModelBuilder.prototype.getModel = function (name, forceCreate) {
  var model = this.models[name];
  if (!model && forceCreate) {
    model = this.define(name, {}, {unresolved: true});
  }
  return model;
};

/**
 * Get the model definition by name
 * @param {String} name The model name
 * @returns {ModelDefinition} The model definition
 */
ModelBuilder.prototype.getModelDefinition = function (name) {
  return this.definitions[name];
};

/**
 * Define a model class
 *
 * @param {String} className
 * @param {Object} properties - hash of class properties in format
 *   `{property: Type, property2: Type2, ...}`
 *   or
 *   `{property: {type: Type}, property2: {type: Type2}, ...}`
 * @param {Object} settings - other configuration of class
 * @return newly created class
 *
 * @example simple case
 * ```
 * var User = modelBuilder.define('User', {
 *     email: String,
 *     password: String,
 *     birthDate: Date,
 *     activated: Boolean
 * });
 * ```
 * @example more advanced case
 * ```
 * var User = modelBuilder.define('User', {
 *     email: { type: String, limit: 150, index: true },
 *     password: { type: String, limit: 50 },
 *     birthDate: Date,
 *     registrationDate: {type: Date, default: function () { return new Date }},
 *     activated: { type: Boolean, default: false }
 * });
 * ```
 */
ModelBuilder.prototype.define = function defineClass(className, properties, settings, parent) {
  var modelBuilder = this;
  var args = slice.call(arguments);
  var pluralName = (settings && settings.plural) ||
    inflection.pluralize(className);

  if (!className) {
    throw new Error('Class name required');
  }
  if (args.length === 1) {
    properties = {};
    args.push(properties);
  }
  if (args.length === 2) {
    settings = {};
    args.push(settings);
  }

  properties = properties || {};
  settings = settings || {};

  // Set the strict mode to be false by default
  if (settings.strict === undefined || settings.strict === null) {
    settings.strict = false;
  }

  // Set up the base model class
  var ModelBaseClass = parent || DefaultModelBaseClass;
  var baseClass = settings.base || settings['super'];
  if (baseClass) {
    if (isModelClass(baseClass)) {
      ModelBaseClass = baseClass;
    } else {
      ModelBaseClass = this.models[baseClass];
      assert(ModelBaseClass, 'Base model is not found: ' + baseClass);
    }
  }

  // Check if there is a unresolved model with the same name
  var ModelClass = this.models[className];

  // Create the ModelClass if it doesn't exist or it's resolved (override)
  // TODO: [rfeng] We need to decide what names to use for built-in models such as User.
  if (!ModelClass || !ModelClass.settings.unresolved) {
    // every class can receive hash of data as optional param
    ModelClass = function ModelConstructor(data, dataSource) {
      if (!(this instanceof ModelConstructor)) {
        return new ModelConstructor(data, dataSource);
      }
      if (ModelClass.settings.unresolved) {
        throw new Error('Model ' + ModelClass.modelName + ' is not defined.');
      }
      ModelBaseClass.apply(this, arguments);
      if (dataSource) {
        hiddenProperty(this, '__dataSource', dataSource);
      }
    };
    // mix in EventEmitter (don't inherit from)
    var events = new EventEmitter();
    for (var f in EventEmitter.prototype) {
      if (typeof EventEmitter.prototype[f] === 'function') {
        ModelClass[f] = EventEmitter.prototype[f].bind(events);
      }
    }
    hiddenProperty(ModelClass, 'modelName', className);
  }

  util.inherits(ModelClass, ModelBaseClass);

  // store class in model pool
  this.models[className] = ModelClass;

  // Return the unresolved model
  if (settings.unresolved) {
    ModelClass.settings = {unresolved: true};
    return ModelClass;
  }

  // Add metadata to the ModelClass
  hiddenProperty(ModelClass, 'modelBuilder', modelBuilder);
  hiddenProperty(ModelClass, 'dataSource', modelBuilder); // Keep for back-compatibility
  hiddenProperty(ModelClass, 'pluralModelName', pluralName);
  hiddenProperty(ModelClass, 'relations', {});
  hiddenProperty(ModelClass, 'http', { path: '/' + pluralName });

  // inherit ModelBaseClass static methods
  for (var i in ModelBaseClass) {
    // We need to skip properties that are already in the subclass, for example, the event emitter methods
    if (i !== '_mixins' && !(i in ModelClass)) {
      ModelClass[i] = ModelBaseClass[i];
    }
  }

  // Load and inject the model classes
  if (settings.models) {
    Object.keys(settings.models).forEach(function (m) {
      var model = settings.models[m];
      ModelClass[m] = typeof model === 'string' ? modelBuilder.getModel(model, true) : model;
    });
  }

  ModelClass.getter = {};
  ModelClass.setter = {};

  var modelDefinition = new ModelDefinition(this, className, properties, settings);

  this.definitions[className] = modelDefinition;

  // expose properties on the ModelClass
  ModelClass.definition = modelDefinition;
  // keep a pointer to settings as models can use it for configuration
  ModelClass.settings = modelDefinition.settings;

  var idInjection = settings.idInjection;
  if (idInjection !== false) {
    // Default to true if undefined
    idInjection = true;
  }

  var idNames = modelDefinition.idNames();
  if (idNames.length > 0) {
    // id already exists
    idInjection = false;
  }

  // Add the id property
  if (idInjection) {
    // Set up the id property
    ModelClass.definition.defineProperty('id', { type: Number, id: 1, generated: true });
  }

  idNames = modelDefinition.idNames(); // Reload it after rebuild
  // Create a virtual property 'id'
  if (idNames.length === 1) {
    var idProp = idNames[0];
    if (idProp !== 'id') {
      Object.defineProperty(ModelClass.prototype, 'id', {
        get: function () {
          var idProp = ModelClass.definition.idNames[0];
          return this.__data[idProp];
        },
        configurable: true,
        enumerable: false
      });
    }
  } else {
    // Now the id property is an object that consists of multiple keys
    Object.defineProperty(ModelClass.prototype, 'id', {
      get: function () {
        var compositeId = {};
        var idNames = ModelClass.definition.idNames();
        for (var p in idNames) {
          compositeId[p] = this.__data[p];
        }
        return compositeId;
      },
      configurable: true,
      enumerable: false
    });
  }

  // A function to loop through the properties
  ModelClass.forEachProperty = function (cb) {
    Object.keys(ModelClass.definition.properties).forEach(cb);
  };

  // A function to attach the model class to a data source
  ModelClass.attachTo = function (dataSource) {
    dataSource.attach(this);
  };

  // A function to extend the model
  ModelClass.extend = function (className, subclassProperties, subclassSettings) {
    var properties = ModelClass.definition.properties;
    var settings = ModelClass.definition.settings;

    subclassProperties = subclassProperties || {};
    subclassSettings = subclassSettings || {};

    // Check if subclass redefines the ids
    var idFound = false;
    for (var k in subclassProperties) {
      if (subclassProperties[k].id) {
        idFound = true;
        break;
      }
    }

    // Merging the properties
    Object.keys(properties).forEach(function (key) {
      if (idFound && properties[key].id) {
        // don't inherit id properties
        return;
      }
      if (subclassProperties[key] === undefined) {
        subclassProperties[key] = properties[key];
      }
    });

    // Merge the settings
    subclassSettings = mergeSettings(settings, subclassSettings);

    /*
     Object.keys(settings).forEach(function (key) {
     if(subclassSettings[key] === undefined) {
     subclassSettings[key] = settings[key];
     }
     });
     */

    // Define the subclass
    var subClass = modelBuilder.define(className, subclassProperties, subclassSettings, ModelClass);

    // Calling the setup function
    if (typeof subClass.setup === 'function') {
      subClass.setup.call(subClass);
    }

    return subClass;
  };

  /**
   * Register a property for the model class
   * @param propertyName
   */
  ModelClass.registerProperty = function (propertyName) {
    var properties = modelDefinition.build();
    var prop = properties[propertyName];
    var DataType = prop.type;
    if (!DataType) {
      throw new Error('Invalid type for property ' + propertyName);
    }
    if (Array.isArray(DataType) || DataType === Array) {
      DataType = List;
    } else if (DataType.name === 'Date') {
      var OrigDate = Date;
      DataType = function Date(arg) {
        return new OrigDate(arg);
      };
    } else if (typeof DataType === 'string') {
      DataType = modelBuilder.resolveType(DataType);
    }

    if (prop.required) {
      var requiredOptions = typeof prop.required === 'object' ? prop.required : undefined;
      ModelClass.validatesPresenceOf(propertyName, requiredOptions);
    }

    Object.defineProperty(ModelClass.prototype, propertyName, {
      get: function () {
        if (ModelClass.getter[propertyName]) {
          return ModelClass.getter[propertyName].call(this); // Try getter first
        } else {
          return this.__data && this.__data[propertyName]; // Try __data
        }
      },
      set: function (value) {
        if (ModelClass.setter[propertyName]) {
          ModelClass.setter[propertyName].call(this, value); // Try setter first
        } else {
          if (!this.__data) {
            this.__data = {};
          }
          if (value === null || value === undefined) {
            this.__data[propertyName] = value;
          } else {
            if (DataType === List) {
              this.__data[propertyName] = DataType(value, properties[propertyName].type, this.__data);
            } else {
              // Assume the type constructor handles Constructor() call
              // If not, we should call new DataType(value).valueOf();
              this.__data[propertyName] = DataType(value);
            }
          }
        }
      },
      configurable: true,
      enumerable: true
    });

    // <propertyName>$was --> __dataWas.<propertyName>
    Object.defineProperty(ModelClass.prototype, propertyName + '$was', {
      get: function () {
        return this.__dataWas && this.__dataWas[propertyName];
      },
      configurable: true,
      enumerable: false
    });

    // FIXME: [rfeng] Do we need to keep the raw data?
    // Use $ as the prefix to avoid conflicts with properties such as _id
    Object.defineProperty(ModelClass.prototype, '$' + propertyName, {
      get: function () {
        return this.__data && this.__data[propertyName];
      },
      set: function (value) {
        if (!this.__data) {
          this.__data = {};
        }
        this.__data[propertyName] = value;
      },
      configurable: true,
      enumerable: false
    });
  };

  ModelClass.forEachProperty(ModelClass.registerProperty);

  ModelClass.emit('defined', ModelClass);

  return ModelClass;

};

/**
 * Define single property named `propertyName` on `model`
 *
 * @param {String} model - name of model
 * @param {String} propertyName - name of property
 * @param {Object} propertyDefinition - property settings
 */
ModelBuilder.prototype.defineProperty = function (model, propertyName, propertyDefinition) {
  this.definitions[model].defineProperty(propertyName, propertyDefinition);
  this.models[model].registerProperty(propertyName);
};

/**
 * Extend existing model with bunch of properties
 *
 * @param {String} model - name of model
 * @param {Object} props - hash of properties
 *
 * Example:
 *
 *     // Instead of doing this:
 *
 *     // amend the content model with competition attributes
 *     db.defineProperty('Content', 'competitionType', { type: String });
 *     db.defineProperty('Content', 'expiryDate', { type: Date, index: true });
 *     db.defineProperty('Content', 'isExpired', { type: Boolean, index: true });
 *
 *     // modelBuilder.extend allows to
 *     // extend the content model with competition attributes
 *     db.extendModel('Content', {
 *       competitionType: String,
 *       expiryDate: { type: Date, index: true },
 *       isExpired: { type: Boolean, index: true }
 *     });
 */
ModelBuilder.prototype.extendModel = function (model, props) {
  var t = this;
  Object.keys(props).forEach(function (propName) {
    var definition = props[propName];
    t.defineProperty(model, propName, definition);
  });
};

ModelBuilder.prototype.copyModel = function copyModel(Master) {
  var modelBuilder = this;
  var className = Master.modelName;
  var md = Master.modelBuilder.definitions[className];
  var Slave = function SlaveModel() {
    Master.apply(this, [].slice.call(arguments));
  };

  util.inherits(Slave, Master);

  Slave.__proto__ = Master;

  hiddenProperty(Slave, 'modelBuilder', modelBuilder);
  hiddenProperty(Slave, 'modelName', className);
  hiddenProperty(Slave, 'relations', Master.relations);

  if (!(className in modelBuilder.models)) {

    // store class in model pool
    modelBuilder.models[className] = Slave;
    modelBuilder.definitions[className] = {
      properties: md.properties,
      settings: md.settings
    };
  }

  return Slave;
};

/*!
 * Define hidden property
 */
function hiddenProperty(where, property, value) {
  Object.defineProperty(where, property, {
    writable: true,
    enumerable: false,
    configurable: true,
    value: value
  });
}

/**
 * Get the schema name
 */
ModelBuilder.prototype.getSchemaName = function (name) {
  if (name) {
    return name;
  }
  if (typeof this._nameCount !== 'number') {
    this._nameCount = 0;
  } else {
    this._nameCount++;
  }
  return 'AnonymousModel_' + this._nameCount;
};

/**
 * Resolve the type string to be a function, for example, 'String' to String
 * @param {String} type The type string, such as 'number', 'Number', 'boolean', or 'String'. It's case insensitive
 * @returns {Function} if the type is resolved
 */
ModelBuilder.prototype.resolveType = function (type) {
  if (!type) {
    return type;
  }
  if (Array.isArray(type) && type.length > 0) {
    // For array types, the first item should be the type string
    var itemType = this.resolveType(type[0]);
    if (typeof itemType === 'function') {
      return [itemType];
    }
    else {
      return itemType; // Not resolved, return the type string
    }
  }
  if (typeof type === 'string') {
    var schemaType = ModelBuilder.schemaTypes[type.toLowerCase()] || this.models[type];
    if (schemaType) {
      return schemaType;
    } else {
      // The type cannot be resolved, let's create a place holder
      type = this.define(type, {}, {unresolved: true});
      return type;
    }
  } else if (type.constructor.name === 'Object') {
    // We also support the syntax {type: 'string', ...}
    if (type.type) {
      return this.resolveType(type.type);
    } else {
      return this.define(this.getSchemaName(null),
        type, {anonymous: true, idInjection: false});
    }
  } else if ('function' === typeof type) {
    return type;
  }
  return type;
};

/**
 * Build models from schema definitions
 *
 * `schemas` can be one of the following:
 *
 * 1. An array of named schema definition JSON objects
 * 2. A schema definition JSON object
 * 3. A list of property definitions (anonymous)
 *
 * @param {*} schemas The schemas
 * @returns {Object} A map of model constructors keyed by model name
 */
ModelBuilder.prototype.buildModels = function (schemas) {
  var models = {};

  // Normalize the schemas to be an array of the schema objects {name: <name>, properties: {}, options: {}}
  if (!Array.isArray(schemas)) {
    if (schemas.properties && schemas.name) {
      // Only one item
      schemas = [schemas];
    } else {
      // Anonymous schema
      schemas = [
        {
          name: this.getSchemaName(),
          properties: schemas,
          options: {anonymous: true}
        }
      ];
    }
  }

  var relations = [];
  for (var s in schemas) {
    var name = this.getSchemaName(schemas[s].name);
    schemas[s].name = name;
    var model = this.define(schemas[s].name, schemas[s].properties, schemas[s].options);
    models[name] = model;
    relations = relations.concat(model.definition.relations);
  }

  // Connect the models based on the relations
  for (var i = 0; i < relations.length; i++) {
    var relation = relations[i];
    var sourceModel = models[relation.source];
    var targetModel = models[relation.target];
    if (sourceModel && targetModel) {
      if (typeof sourceModel[relation.type] === 'function') {
        sourceModel[relation.type](targetModel, {as: relation.as});
      }
    }
  }
  return models;
};

/**
 * Introspect the json document to build a corresponding model
 * @param {String} name The model name
 * @param {Object} json The json object
 * @param [Object} options The options
 * @returns {}
 */
ModelBuilder.prototype.buildModelFromInstance = function (name, json, options) {

  // Introspect the JSON document to generate a schema
  var schema = introspect(json);

  // Create a model for the generated schema
  return this.define(name, schema, options);
};




},{"./introspection":73,"./list.js":75,"./model-definition.js":77,"./model.js":78,"./types":81,"./utils":82,"assert":24,"events":32,"inflection":85,"util":58}],77:[function(require,module,exports){
var assert = require('assert');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var traverse = require('traverse');
var ModelBaseClass = require('./model');
var ModelBuilder = require('./model-builder');

/**
 * Model definition
 */
module.exports = ModelDefinition;

/**
 * Constructor for ModelDefinition
 * @param {ModelBuilder} modelBuilder A model builder instance
 * @param {String|Object} name The model name or the schema object
 * @param {Object} properties The model properties, optional
 * @param {Object} settings The model settings, optional
 * @returns {ModelDefinition}
 * @constructor
 *
 */
function ModelDefinition(modelBuilder, name, properties, settings) {
  if (!(this instanceof ModelDefinition)) {
    // Allow to call ModelDefinition without new
    return new ModelDefinition(modelBuilder, name, properties, settings);
  }
  this.modelBuilder = modelBuilder || ModelBuilder.defaultInstance;
  assert(name, 'name is missing');

  if (arguments.length === 2 && typeof name === 'object') {
    var schema = name;
    this.name = schema.name;
    this.rawProperties = schema.properties || {}; // Keep the raw property definitions
    this.settings = schema.settings || {};
  } else {
    assert(typeof name === 'string', 'name must be a string');
    this.name = name;
    this.rawProperties = properties || {}; // Keep the raw property definitions
    this.settings = settings || {};
  }
  this.relations = [];
  this.properties = null;
  this.build();
}

util.inherits(ModelDefinition, EventEmitter);

// Set up types
require('./types')(ModelDefinition);

/**
 * Return table name for specified `modelName`
 * @param {String} connectorType The connector type, such as 'oracle' or 'mongodb'
 */
ModelDefinition.prototype.tableName = function (connectorType) {
  var settings = this.settings;
  if (settings[connectorType]) {
    return settings[connectorType].table || settings[connectorType].tableName || this.name;
  } else {
    return this.name;
  }
};

/**
 * Return column name for specified modelName and propertyName
 * @param {String} connectorType The connector type, such as 'oracle' or 'mongodb'
 * @param propertyName The property name
 * @returns {String} columnName
 */
ModelDefinition.prototype.columnName = function (connectorType, propertyName) {
  if (!propertyName) {
    return propertyName;
  }
  this.build();
  var property = this.properties[propertyName];
  if (property && property[connectorType]) {
    return property[connectorType].column || property[connectorType].columnName || propertyName;
  } else {
    return propertyName;
  }
};

/**
 * Return column metadata for specified modelName and propertyName
 * @param {String} connectorType The connector type, such as 'oracle' or 'mongodb'
 * @param propertyName The property name
 * @returns {Object} column metadata
 */
ModelDefinition.prototype.columnMetadata = function (connectorType, propertyName) {
  if (!propertyName) {
    return propertyName;
  }
  this.build();
  var property = this.properties[propertyName];
  if (property && property[connectorType]) {
    return property[connectorType];
  } else {
    return null;
  }
};

/**
 * Return column names for specified modelName
 * @param {String} connectorType The connector type, such as 'oracle' or 'mongodb'
 * @returns {String[]} column names
 */
ModelDefinition.prototype.columnNames = function (connectorType) {
  this.build();
  var props = this.properties;
  var cols = [];
  for (var p in props) {
    if (props[p][connectorType]) {
      cols.push(property[connectorType].column || props[p][connectorType].columnName || p);
    } else {
      cols.push(p);
    }
  }
  return cols;
};

/**
 * Find the ID properties sorted by the index
 * @returns {Object[]} property name/index for IDs
 */
ModelDefinition.prototype.ids = function () {
  if (this._ids) {
    return this._ids;
  }
  var ids = [];
  this.build();
  var props = this.properties;
  for (var key in props) {
    var id = props[key].id;
    if (!id) {
      continue;
    }
    if (typeof id !== 'number') {
      id = 1;
    }
    ids.push({name: key, id: id});
  }
  ids.sort(function (a, b) {
    return a.key - b.key;
  });
  this._ids = ids;
  return ids;
};

/**
 * Find the ID column name
 * @param {String} modelName The model name
 * @returns {String} columnName for ID
 */
ModelDefinition.prototype.idColumnName = function (connectorType) {
  return this.columnName(connectorType, this.idName());
};

/**
 * Find the ID property name
 * @returns {String} property name for ID
 */
ModelDefinition.prototype.idName = function () {
  var id = this.ids()[0];
  if (this.properties.id && this.properties.id.id) {
    return 'id';
  } else {
  }
  return id && id.name;
};

/**
 * Find the ID property names sorted by the index
 * @returns {String[]} property names for IDs
 */
ModelDefinition.prototype.idNames = function () {
  var ids = this.ids();
  var names = ids.map(function (id) {
    return id.name;
  });
  return names;
};

/**
 *
 * @returns {{}}
 */
ModelDefinition.prototype.indexes = function () {
  this.build();
  var indexes = {};
  if (this.settings.indexes) {
    for (var i in this.settings.indexes) {
      indexes[i] = this.settings.indexes[i];
    }
  }
  for (var p in this.properties) {
    if (this.properties[p].index) {
      indexes[p + '_index'] = this.properties[p].index;
    }
  }
  return indexes;
};

/**
 * Build a model definition
 * @param {Boolean} force Forcing rebuild
 */
ModelDefinition.prototype.build = function (forceRebuild) {
  if (forceRebuild) {
    this.properties = null;
    this.relations = [];
    this._ids = null;
  }
  if (this.properties) {
    return this.properties;
  }
  this.properties = {};
  for (var p in this.rawProperties) {
    var prop = this.rawProperties[p];
    var type = this.modelBuilder.resolveType(prop);
    if (typeof type === 'string') {
      this.relations.push({
        source: this.name,
        target: type,
        type: Array.isArray(prop) ? 'hasMany' : 'belongsTo',
        as: p
      });
    } else {
      var typeDef = {
        type: type
      };
      if (typeof prop === 'object' && prop !== null) {
        for (var a in prop) {
          // Skip the type property but don't delete it Model.extend() shares same instances of the properties from the base class
          if (a !== 'type') {
            typeDef[a] = prop[a];
          }
        }
      }
      this.properties[p] = typeDef;
    }
  }
  return this.properties;
};

/**
 * Define a property
 * @param {String} propertyName The property name
 * @param {Object} propertyDefinition The property definition
 */
ModelDefinition.prototype.defineProperty = function (propertyName, propertyDefinition) {
  this.rawProperties[propertyName] = propertyDefinition;
  this.build(true);
};

function isModelClass(cls) {
  if (!cls) {
    return false;
  }
  return cls.prototype instanceof ModelBaseClass;
}

ModelDefinition.prototype.toJSON = function (forceRebuild) {
  if (forceRebuild) {
    this.json = null;
  }
  if (this.json) {
    return json;
  }
  var json = {
    name: this.name,
    properties: {},
    settings: this.settings
  };
  this.build(forceRebuild);

  var mapper = function (val) {
    if (val === undefined || val === null) {
      return val;
    }
    if ('function' === typeof val.toJSON) {
      // The value has its own toJSON() object
      return val.toJSON();
    }
    if ('function' === typeof val) {
      if (isModelClass(val)) {
        if (val.settings && val.settings.anonymous) {
          return val.definition && val.definition.toJSON().properties;
        } else {
          return val.modelName;
        }
      }
      return val.name;
    } else {
      return val;
    }
  };
  for (var p in this.properties) {
    json.properties[p] = traverse(this.properties[p]).map(mapper);
  }
  this.json = json;
  return json;
};

},{"./model":78,"./model-builder":76,"./types":81,"assert":24,"events":32,"traverse":87,"util":58}],78:[function(require,module,exports){
/**
 * Module exports class Model
 */
module.exports = ModelBaseClass;

/**
 * Module dependencies
 */

var util = require('util');
var traverse = require('traverse');
var jutil = require('./jutil');
var List = require('./list');
var Hookable = require('./hooks');
var validations = require('./validations.js');

var BASE_TYPES = ['String', 'Boolean', 'Number', 'Date', 'Text'];

/**
 * Model class - base class for all persist objects
 * provides **common API** to access any database connector.
 * This class describes only abstract behavior layer, refer to `lib/connectors/*.js`
 * to learn more about specific connector implementations
 *
 * `ModelBaseClass` mixes `Validatable` and `Hookable` classes methods
 *
 * @constructor
 * @param {Object} data - initial object data
 */
function ModelBaseClass(data) {
  this._initProperties(data, true);
}

// FIXME: [rfeng] We need to make sure the input data should not be mutated. Disabled cloning for now to get tests passing
function clone(data) {
  /*
   if(!(data instanceof ModelBaseClass)) {
   if(data && (Array.isArray(data) || 'object' === typeof data)) {
   return traverse(data).clone();
   }
   }
   */
  return data;
}
/**
 * Initialize properties
 * @param data
 * @param applySetters
 * @private
 */
ModelBaseClass.prototype._initProperties = function (data, applySetters) {
  var self = this;
  var ctor = this.constructor;

  var properties = ctor.definition.build();
  data = data || {};

  Object.defineProperty(this, '__cachedRelations', {
    writable: true,
    enumerable: false,
    configurable: true,
    value: {}
  });

  Object.defineProperty(this, '__data', {
    writable: true,
    enumerable: false,
    configurable: true,
    value: {}
  });

  Object.defineProperty(this, '__dataWas', {
    writable: true,
    enumerable: false,
    configurable: true,
    value: {}
  });

  if (data.__cachedRelations) {
    this.__cachedRelations = data.__cachedRelations;
  }

  // Check if the strict option is set to false for the model
  var strict = ctor.definition.settings.strict;

  for (var i in data) {
    if (i in properties) {
      this.__data[i] = this.__dataWas[i] = clone(data[i]);
    } else if (i in ctor.relations) {
      this.__data[ctor.relations[i].keyFrom] = this.__dataWas[i] = data[i][ctor.relations[i].keyTo];
      this.__cachedRelations[i] = data[i];
    } else {
      if (strict === false) {
        this.__data[i] = this.__dataWas[i] = clone(data[i]);
      } else if (strict === 'throw') {
        throw new Error('Unknown property: ' + i);
      }
    }
  }

  if (applySetters === true) {
    for (var propertyName in data) {
      if ((propertyName in properties) || (propertyName in ctor.relations)) {
        self[propertyName] = self.__data[propertyName] || data[propertyName];
      }
    }
  }

  // Set the unknown properties as properties to the object
  if (strict === false) {
    for (var propertyName in data) {
      if (!(propertyName in properties)) {
        self[propertyName] = self.__data[propertyName] || data[propertyName];
      }
    }
  }

  ctor.forEachProperty(function (propertyName) {

    if ('undefined' === typeof self.__data[propertyName]) {
      self.__data[propertyName] = self.__dataWas[propertyName] = getDefault(propertyName);
    } else {
      self.__dataWas[propertyName] = self.__data[propertyName];
    }

  });

  ctor.forEachProperty(function (propertyName) {

    var type = properties[propertyName].type;

    if (BASE_TYPES.indexOf(type.name) === -1) {
      if (typeof self.__data[propertyName] !== 'object' && self.__data[propertyName]) {
        try {
          self.__data[propertyName] = JSON.parse(self.__data[propertyName] + '');
        } catch (e) {
          self.__data[propertyName] = String(self.__data[propertyName]);
        }
      }
      if (type.name === 'Array' || Array.isArray(type)) {
        if (!(self.__data[propertyName] instanceof List)) {
          self.__data[propertyName] = new List(self.__data[propertyName], type, self);
        }
      }
    }

  });

  function getDefault(propertyName) {
    var def = properties[propertyName]['default'];
    if (def !== undefined) {
      if (typeof def === 'function') {
        return def();
      } else {
        return def;
      }
    } else {
      return undefined;
    }
  }

  this.trigger('initialize');
}

/**
 * @param {String} prop - property name
 * @param {Object} params - various property configuration
 */
ModelBaseClass.defineProperty = function (prop, params) {
  this.dataSource.defineProperty(this.modelName, prop, params);
};

ModelBaseClass.getPropertyType = function (propName) {
  var prop = this.definition.properties[propName];
  if (!prop) {
    // The property is not part of the definition
    return null;
  }
  if (!prop.type) {
    throw new Error('Type not defined for property ' + this.modelName + '.' + propName);
    // return null;
  }
  return prop.type.name;
};

ModelBaseClass.prototype.getPropertyType = function (propName) {
  return this.constructor.getPropertyType(propName);
};

/**
 * Return string representation of class
 *
 * @override default toString method
 */
ModelBaseClass.toString = function () {
  return '[Model ' + this.modelName + ']';
};

/**
 * Convert instance to Object
 *
 * @param {Boolean} onlySchema - restrict properties to dataSource only, default false
 * when onlySchema == true, only properties defined in dataSource returned,
 * otherwise all enumerable properties returned
 * @returns {Object} - canonical object representation (no getters and setters)
 */
ModelBaseClass.prototype.toObject = function (onlySchema) {
  var data = {};
  var self = this;

  var schemaLess = this.constructor.definition.settings.strict === false || !onlySchema;
  this.constructor.forEachProperty(function (propertyName) {
    if (self[propertyName] instanceof List) {
      data[propertyName] = self[propertyName].toObject(!schemaLess);
    } else if (self.__data.hasOwnProperty(propertyName)) {
      if (self[propertyName] !== undefined && self[propertyName] !== null && self[propertyName].toObject) {
        data[propertyName] = self[propertyName].toObject(!schemaLess);
      } else {
        data[propertyName] = self[propertyName];
      }
    } else {
      data[propertyName] = null;
    }
  });

  if (schemaLess) {
    for (var propertyName in self.__data) {
      if (!data.hasOwnProperty(propertyName)) {
        var val = self.hasOwnProperty(propertyName) ? self[propertyName] : self.__data[propertyName];
        if (val !== undefined && val !== null && val.toObject) {
          data[propertyName] = val.toObject(!schemaLess);
        } else {
          data[propertyName] = val;
        }
      }
    }
  }
  return data;
};

// ModelBaseClass.prototype.hasOwnProperty = function (prop) {
//     return this.__data && this.__data.hasOwnProperty(prop) ||
//         Object.getOwnPropertyNames(this).indexOf(prop) !== -1;
// };

ModelBaseClass.prototype.toJSON = function () {
  return this.toObject();
};

ModelBaseClass.prototype.fromObject = function (obj) {
  for (var key in obj) {
    this[key] = obj[key];
  }
};

/**
 * Checks is property changed based on current property and initial value
 *
 * @param {String} propertyName - property name
 * @return Boolean
 */
ModelBaseClass.prototype.propertyChanged = function propertyChanged(propertyName) {
  return this.__data[propertyName] !== this.__dataWas[propertyName];
};

/**
 * Reset dirty attributes
 *
 * this method does not perform any database operation it just reset object to it's
 * initial state
 */
ModelBaseClass.prototype.reset = function () {
  var obj = this;
  for (var k in obj) {
    if (k !== 'id' && !obj.constructor.dataSource.definitions[obj.constructor.modelName].properties[k]) {
      delete obj[k];
    }
    if (obj.propertyChanged(k)) {
      obj[k] = obj[k + '$was'];
    }
  }
};

ModelBaseClass.prototype.inspect = function () {
  return util.inspect(this.__data, false, 4, true);
};

ModelBaseClass.mixin = function (anotherClass, options) {
  return jutil.mixin(this, anotherClass, options);
};

ModelBaseClass.prototype.getDataSource = function () {
  return this.__dataSource || this.constructor.dataSource;
}
ModelBaseClass.getDataSource = function () {
  return this.dataSource;
}

jutil.mixin(ModelBaseClass, Hookable);
jutil.mixin(ModelBaseClass, validations.Validatable);

},{"./hooks":71,"./jutil":74,"./list":75,"./validations.js":83,"traverse":87,"util":58}],79:[function(require,module,exports){
/**
 * Dependencies
 */
var i8n = require('inflection');
var defineScope = require('./scope.js').defineScope;
var ModelBaseClass = require('./model.js');

module.exports = Relation;

function Relation() {
}

Relation.relationNameFor = function relationNameFor(foreignKey) {
  for (var rel in this.relations) {
    if (this.relations[rel].type === 'belongsTo' && this.relations[rel].keyFrom === foreignKey) {
      return rel;
    }
  }
};

function lookupModel(models, modelName) {
  if(models[modelName]) {
    return models[modelName];
  }
  var lookupClassName = modelName.toLowerCase();
  for (var name in models) {
    if (name.toLowerCase() === lookupClassName) {
      return models[name];
    }
  }
}

/**
 * Declare hasMany relation
 *
 * @param {Relation} anotherClass - class to has many
 * @param {Object} params - configuration {as:, foreignKey:}
 * @example `User.hasMany(Post, {as: 'posts', foreignKey: 'authorId'});`
 */
Relation.hasMany = function hasMany(anotherClass, params) {
  var thisClassName = this.modelName;
  params = params || {};
  if (typeof anotherClass === 'string') {
    params.as = anotherClass;
    if (params.model) {
      anotherClass = params.model;
    } else {
      var anotherClassName = i8n.singularize(anotherClass).toLowerCase();
      anotherClass = lookupModel(this.dataSource.modelBuilder.models, anotherClassName);
    }
  }
  var methodName = params.as || i8n.camelize(anotherClass.pluralModelName, true);
  var fk = params.foreignKey || i8n.camelize(thisClassName + '_id', true);

  var idName = this.dataSource.idName(this.modelName) || 'id';

  this.relations[methodName] = {
    type: 'hasMany',
    keyFrom: idName,
    keyTo: fk,
    modelTo: anotherClass,
    multiple: true
  };
  // each instance of this class should have method named
  // pluralize(anotherClass.modelName)
  // which is actually just anotherClass.find({where: {thisModelNameId: this[idName]}}, cb);
  var scopeMethods = {
    findById: find,
    destroy: destroy
  };
  if (params.through) {
    var fk2 = i8n.camelize(anotherClass.modelName + '_id', true);
    scopeMethods.create = function create(data, done) {
      if (typeof data !== 'object') {
        done = data;
        data = {};
      }
      if ('function' !== typeof done) {
        done = function () {
        };
      }
      var self = this;
      anotherClass.create(data, function (err, ac) {
        if (err) return done(err, ac);
        var d = {};
        d[params.through.relationNameFor(fk)] = self;
        d[params.through.relationNameFor(fk2)] = ac;
        params.through.create(d, function (e) {
          if (e) {
            ac.destroy(function () {
              done(e);
            });
          } else {
            done(err, ac);
          }
        });
      });
    };
    scopeMethods.add = function (acInst, done) {
      var data = {};
      var query = {};
      query[fk] = this[idName];
      data[params.through.relationNameFor(fk)] = this;
      query[fk2] = acInst[idName] || acInst;
      data[params.through.relationNameFor(fk2)] = acInst;
      params.through.findOrCreate({where: query}, data, done);
    };
    scopeMethods.remove = function (acInst, done) {
      var q = {};
      q[fk2] = acInst[idName] || acInst;
      params.through.findOne({where: q}, function (err, d) {
        if (err) {
          return done(err);
        }
        if (!d) {
          return done();
        }
        d.destroy(done);
      });
    };
    delete scopeMethods.destroy;
  }
  defineScope(this.prototype, params.through || anotherClass, methodName, function () {
    var filter = {};
    filter.where = {};
    filter.where[fk] = this[idName];
    if (params.through) {
      filter.collect = i8n.camelize(anotherClass.modelName, true);
      filter.include = filter.collect;
    }
    return filter;
  }, scopeMethods);

  if (!params.through) {
    // obviously, anotherClass should have attribute called `fk`
    anotherClass.dataSource.defineForeignKey(anotherClass.modelName, fk, this.modelName);
  }

  function find(id, cb) {
    anotherClass.findById(id, function (err, inst) {
      if (err) {
        return cb(err);
      }
      if (!inst) {
        return cb(new Error('Not found'));
      }
      if (inst[fk] && inst[fk].toString() === this[idName].toString()) {
        cb(null, inst);
      } else {
        cb(new Error('Permission denied'));
      }
    }.bind(this));
  }

  function destroy(id, cb) {
    var self = this;
    anotherClass.findById(id, function (err, inst) {
      if (err) {
        return cb(err);
      }
      if (!inst) {
        return cb(new Error('Not found'));
      }
      if (inst[fk] && inst[fk].toString() === self[idName].toString()) {
        inst.destroy(cb);
      } else {
        cb(new Error('Permission denied'));
      }
    });
  }

};

/**
 * Declare belongsTo relation
 *
 * @param {Class} anotherClass - class to belong
 * @param {Object} params - configuration {as: 'propertyName', foreignKey: 'keyName'}
 *
 * **Usage examples**
 * Suppose model Post have a *belongsTo* relationship with User (the author of the post). You could declare it this way:
 * Post.belongsTo(User, {as: 'author', foreignKey: 'userId'});
 *
 * When a post is loaded, you can load the related author with:
 * post.author(function(err, user) {
 *     // the user variable is your user object
 * });
 *
 * The related object is cached, so if later you try to get again the author, no additional request will be made.
 * But there is an optional boolean parameter in first position that set whether or not you want to reload the cache:
 * post.author(true, function(err, user) {
 *     // The user is reloaded, even if it was already cached.
 * });
 *
 * This optional parameter default value is false, so the related object will be loaded from cache if available.
 */
Relation.belongsTo = function (anotherClass, params) {
  params = params || {};
  if ('string' === typeof anotherClass) {
    params.as = anotherClass;
    if (params.model) {
      anotherClass = params.model;
    } else {
      var anotherClassName = anotherClass.toLowerCase();
      anotherClass = lookupModel(this.dataSource.modelBuilder.models, anotherClassName);
    }
  }

  var idName = this.dataSource.idName(anotherClass.modelName) || 'id';
  var methodName = params.as || i8n.camelize(anotherClass.modelName, true);
  var fk = params.foreignKey || methodName + 'Id';

  this.relations[methodName] = {
    type: 'belongsTo',
    keyFrom: fk,
    keyTo: idName,
    modelTo: anotherClass,
    multiple: false
  };

  this.dataSource.defineForeignKey(this.modelName, fk, anotherClass.modelName);
  this.prototype.__finders__ = this.prototype.__finders__ || {};

  this.prototype.__finders__[methodName] = function (id, cb) {
    if (id === null) {
      cb(null, null);
      return;
    }
    anotherClass.findById(id, function (err, inst) {
      if (err) {
        return cb(err);
      }
      if (!inst) {
        return cb(null, null);
      }
      if (inst[idName] === this[fk]) {
        cb(null, inst);
      } else {
        cb(new Error('Permission denied'));
      }
    }.bind(this));
  };

  this.prototype[methodName] = function (refresh, p) {
    if (arguments.length === 1) {
      p = refresh;
      refresh = false;
    } else if (arguments.length > 2) {
      throw new Error('Method can\'t be called with more than two arguments');
    }
    var self = this;
    var cachedValue;
    if (!refresh && this.__cachedRelations && (this.__cachedRelations[methodName] !== undefined)) {
      cachedValue = this.__cachedRelations[methodName];
    }
    if (p instanceof ModelBaseClass) { // acts as setter
      this[fk] = p[idName];
      this.__cachedRelations[methodName] = p;
    } else if (typeof p === 'function') { // acts as async getter
      if (typeof cachedValue === 'undefined') {
        this.__finders__[methodName].apply(self, [this[fk], function (err, inst) {
          if (!err) {
            self.__cachedRelations[methodName] = inst;
          }
          p(err, inst);
        }]);
        return this[fk];
      } else {
        p(null, cachedValue);
        return cachedValue;
      }
    } else if (typeof p === 'undefined') { // acts as sync getter
      return this[fk];
    } else { // setter
      this[fk] = p;
      delete this.__cachedRelations[methodName];
    }
  };

};

/**
 * Many-to-many relation
 *
 * Post.hasAndBelongsToMany('tags'); creates connection model 'PostTag'
 */
Relation.hasAndBelongsToMany = function hasAndBelongsToMany(anotherClass, params) {
  params = params || {};
  var models = this.dataSource.modelBuilder.models;

  if ('string' === typeof anotherClass) {
    params.as = anotherClass;
    if (params.model) {
      anotherClass = params.model;
    } else {
      anotherClass = lookupModel(models, i8n.singularize(anotherClass).toLowerCase()) ||
        anotherClass;
    }
    if (typeof anotherClass === 'string') {
      throw new Error('Could not find "' + anotherClass + '" relation for ' + this.modelName);
    }
  }

  if (!params.through) {
    var name1 = this.modelName + anotherClass.modelName;
    var name2 = anotherClass.modelName + this.modelName;
    params.through = lookupModel(models, name1) || lookupModel(models, name2) ||
      this.dataSource.define(name1);
  }
  params.through.belongsTo(this);
  params.through.belongsTo(anotherClass);

  this.hasMany(anotherClass, {as: params.as, through: params.through});

};

},{"./model.js":78,"./scope.js":80,"inflection":85}],80:[function(require,module,exports){
var utils = require('./utils');
var defineCachedRelations = utils.defineCachedRelations;
/**
 * Module exports
 */
exports.defineScope = defineScope;

function defineScope(cls, targetClass, name, params, methods) {

  // collect meta info about scope
  if (!cls._scopeMeta) {
    cls._scopeMeta = {};
  }

  // only makes sence to add scope in meta if base and target classes
  // are same
  if (cls === targetClass) {
    cls._scopeMeta[name] = params;
  } else {
    if (!targetClass._scopeMeta) {
      targetClass._scopeMeta = {};
    }
  }

  // Define a property for the scope
  Object.defineProperty(cls, name, {
    enumerable: false,
    configurable: true,
    /**
     * This defines a property for the scope. For example, user.accounts or
     * User.vips. Please note the cls can be the model class or prototype of
     * the model class.
     *
     * The property value is function. It can be used to query the scope,
     * such as user.accounts(condOrRefresh, cb) or User.vips(cb). The value
     * can also have child properties for create/build/delete. For example,
     * user.accounts.create(act, cb).
     *
     */
    get: function () {
      var f = function caller(condOrRefresh, cb) {
        var actualCond = {};
        var actualRefresh = false;
        var saveOnCache = true;
        if (arguments.length === 1) {
          cb = condOrRefresh;
        } else if (arguments.length === 2) {
          if (typeof condOrRefresh === 'boolean') {
            actualRefresh = condOrRefresh;
          } else {
            actualCond = condOrRefresh;
            actualRefresh = true;
            saveOnCache = false;
          }
        } else {
          throw new Error('Method can be only called with one or two arguments');
        }

        if (!this.__cachedRelations || (this.__cachedRelations[name] === undefined) || actualRefresh) {
          var self = this;
          var params = mergeParams(actualCond, caller._scope);
          return targetClass.find(params, function (err, data) {
            if (!err && saveOnCache) {
              defineCachedRelations(self);
              self.__cachedRelations[name] = data;
            }
            cb(err, data);
          });
        } else {
          cb(null, this.__cachedRelations[name]);
        }
      };
      f._scope = typeof params === 'function' ? params.call(this) : params;

      f.build = build;
      f.create = create;
      f.destroyAll = destroyAll;
      for (var i in methods) {
        f[i] = methods[i].bind(this);
      }

      // define sub-scopes
      Object.keys(targetClass._scopeMeta).forEach(function (name) {
        Object.defineProperty(f, name, {
          enumerable: false,
          get: function () {
            mergeParams(f._scope, targetClass._scopeMeta[name]);
            return f;
          }
        });
      }.bind(this));
      return f;
    }
  });

  // Wrap the property into a function for remoting
  var fn = function () {
    // primaryObject.scopeName, such as user.accounts
    var f = this[name];
    // set receiver to be the scope property whose value is a function
    f.apply(this[name], arguments);
  };

  fn.shared = true;
  fn.http = {verb: 'get', path: '/' + name};
  fn.accepts = {arg: 'where', type: 'object'};
  fn.description = 'Fetches ' + name;
  fn.returns = {arg: name, type: 'array', root: true};

  cls['__get__' + name] = fn;

  var fn_create = function () {
    var f = this[name].create;
    f.apply(this[name], arguments);
  };

  fn_create.shared = true;
  fn_create.http = {verb: 'post', path: '/' + name};
  fn_create.accepts = {arg: 'data', type: 'object', http: {source: 'body'}};
  fn_create.description = 'Creates ' + name;
  fn_create.returns = {arg: 'data', type: 'object', root: true};

  cls['__create__' + name] = fn_create;

  var fn_delete = function () {
    var f = this[name].destroyAll;
    f.apply(this[name], arguments);
  };
  fn_delete.shared = true;
  fn_delete.http = {verb: 'delete', path: '/' + name};
  fn_delete.description = 'Deletes ' + name;
  fn_delete.returns = {arg: 'data', type: 'object', root: true};

  cls['__delete__' + name] = fn_delete;

  // and it should have create/build methods with binded thisModelNameId param
  function build(data) {
    return new targetClass(mergeParams(this._scope, {where: data || {}}).where);
  }

  function create(data, cb) {
    if (typeof data === 'function') {
      cb = data;
      data = {};
    }
    this.build(data).save(cb);
  }

  /*
   Callback
   - The callback will be called after all elements are destroyed
   - For every destroy call which results in an error
   - If fetching the Elements on which destroyAll is called results in an error
   */
  function destroyAll(cb) {
    targetClass.find(this._scope, function (err, data) {
      if (err) {
        cb(err);
      } else {
        (function loopOfDestruction(data) {
          if (data.length > 0) {
            data.shift().destroy(function (err) {
              if (err && cb) cb(err);
              loopOfDestruction(data);
            });
          } else {
            if (cb) cb();
          }
        }(data));
      }
    });
  }

  function mergeParams(base, update) {
    base = base || {};
    if (update.where) {
      base.where = merge(base.where, update.where);
    }
    if (update.include) {
      base.include = update.include;
    }
    if (update.collect) {
      base.collect = update.collect;
    }

    // overwrite order
    if (update.order) {
      base.order = update.order;
    }

    return base;

  }
}

/**
 * Merge `base` and `update` params
 * @param {Object} base - base object (updating this object)
 * @param {Object} update - object with new data to update base
 * @returns {Object} `base`
 */
function merge(base, update) {
  base = base || {};
  if (update) {
    Object.keys(update).forEach(function (key) {
      base[key] = update[key];
    });
  }
  return base;
}


},{"./utils":82}],81:[function(require,module,exports){
var Buffer=require("__browserify_Buffer");module.exports = function (Types) {

  var List = require('./list.js');
  var GeoPoint = require('./geo').GeoPoint;

  /**
   * Schema types
   */
  Types.Text = function Text(value) {
    if (!(this instanceof Text)) {
      return value;
    }
    this.value = value;
  }; // Text type

  Types.Text.prototype.toObject = Types.Text.prototype.toJSON = function () {
    return this.value;
  };

  Types.JSON = function JSON(value) {
    if (!(this instanceof JSON)) {
      return value;
    }
    this.value = value;
  }; // JSON Object
  Types.JSON.prototype.toObject = Types.JSON.prototype.toJSON = function () {
    return this.value;
  };

  Types.Any = function Any(value) {
    if (!(this instanceof Any)) {
      return value;
    }
    this.value = value;
  }; // Any Type
  Types.Any.prototype.toObject = Types.Any.prototype.toJSON = function () {
    return this.value;
  };

  Types.schemaTypes = {};
  Types.registerType = function (type, names) {
    names = names || [];
    names = names.concat([type.name]);
    for (var n = 0; n < names.length; n++) {
      this.schemaTypes[names[n].toLowerCase()] = type;
    }
  };

  Types.registerType(Types.Text);
  Types.registerType(Types.JSON);
  Types.registerType(Types.Any);

  Types.registerType(String);
  Types.registerType(Number);
  Types.registerType(Boolean);
  Types.registerType(Date);
  Types.registerType(Buffer, ['Binary']);
  Types.registerType(Array);
  Types.registerType(GeoPoint);
  Types.registerType(Object);
};
},{"./geo":70,"./list.js":75,"__browserify_Buffer":38}],82:[function(require,module,exports){
var process=require("__browserify_process");exports.safeRequire = safeRequire;
exports.fieldsToArray = fieldsToArray;
exports.selectFields = selectFields;
exports.removeUndefined = removeUndefined;
exports.parseSettings = parseSettings;
exports.mergeSettings = mergeSettings;
exports.isPlainObject = isPlainObject;
exports.defineCachedRelations = defineCachedRelations;

var traverse = require('traverse');

function safeRequire(module) {
  try {
    return require(module);
  } catch (e) {
    console.log('Run "npm install loopback-datasource-juggler ' + module
      + '" command to use loopback-datasource-juggler using ' + module
      + ' database engine');
    process.exit(1);
  }
}

function fieldsToArray(fields, properties) {
  if (!fields) return;

  // include all properties by default
  var result = properties;

  if (typeof fields === 'string') {
    return [fields];
  }

  if (Array.isArray(fields) && fields.length > 0) {
    // No empty array, including all the fields
    return fields;
  }

  if ('object' === typeof fields) {
    // { field1: boolean, field2: boolean ... }
    var included = [];
    var excluded = [];
    var keys = Object.keys(fields);
    if (!keys.length) return;

    keys.forEach(function (k) {
      if (fields[k]) {
        included.push(k);
      } else if ((k in fields) && !fields[k]) {
        excluded.push(k);
      }
    });
    if (included.length > 0) {
      result = included;
    } else if (excluded.length > 0) {
      excluded.forEach(function (e) {
        var index = result.indexOf(e);
        result.splice(index, 1);
      });
    }
  }

  return result;
}

function selectFields(fields) {
  // map function
  return function (obj) {
    var result = {};
    var key;

    for (var i = 0; i < fields.length; i++) {
      key = fields[i];

      result[key] = obj[key];
    }
    return result;
  };
}

/**
 * Remove undefined values from the queury object
 * @param query
 * @returns {exports.map|*}
 */
function removeUndefined(query) {
  if (typeof query !== 'object' || query === null) {
    return query;
  }
  // WARNING: [rfeng] Use map() will cause mongodb to produce invalid BSON
  // as traverse doesn't transform the ObjectId correctly
  return traverse(query).forEach(function (x) {
    if (x === undefined) {
      this.remove();
    }

    if (!Array.isArray(x) && (typeof x === 'object' && x !== null
      && x.constructor !== Object)) {
      // This object is not a plain object
      this.update(x, true); // Stop navigating into this object
      return x;
    }

    return x;
  });
}

var url = require('url');
var qs = require('qs');

/**
 * Parse a URL into a settings object
 * @param {String} urlStr The URL for connector settings
 * @returns {Object} The settings object
 */
function parseSettings(urlStr) {
  if (!urlStr) {
    return {};
  }
  var uri = url.parse(urlStr, false);
  var settings = {};
  settings.connector = uri.protocol && uri.protocol.split(':')[0]; // Remove the trailing :
  settings.host = settings.hostname = uri.hostname;
  settings.port = uri.port && Number(uri.port); // port is a string
  settings.user = settings.username = uri.auth && uri.auth.split(':')[0]; // <username>:<password>
  settings.password = uri.auth && uri.auth.split(':')[1];
  settings.database = uri.pathname && uri.pathname.split('/')[1];  // remove the leading /
  settings.url = urlStr;
  if (uri.query) {
    var params = qs.parse(uri.query);
    for (var p in params) {
      settings[p] = params[p];
    }
  }
  return settings;
}

/**
 * Merge model settings
 *
 * Folked from https://github.com/nrf110/deepmerge/blob/master/index.js
 *
 * The original function tries to merge array items if they are objects
 *
 * @param {Object} target The target settings object
 * @param {Object} src The source settings object
 * @returns {Object} The merged settings object
 */
function mergeSettings(target, src) {
  var array = Array.isArray(src);
  var dst = array && [] || {};

  if (array) {
    target = target || [];
    dst = dst.concat(target);
    src.forEach(function (e) {
      if (dst.indexOf(e) === -1) {
        dst.push(e);
      }
    });
  } else {
    if (target && typeof target === 'object') {
      Object.keys(target).forEach(function (key) {
        dst[key] = target[key];
      });
    }
    Object.keys(src).forEach(function (key) {
      if (typeof src[key] !== 'object' || !src[key]) {
        dst[key] = src[key];
      }
      else {
        if (!target[key]) {
          dst[key] = src[key]
        } else {
          dst[key] = mergeSettings(target[key], src[key]);
        }
      }
    });
  }

  return dst;
}

/**
 * Define an non-enumerable __cachedRelations property
 * @param {Object} obj The obj to receive the __cachedRelations
 */
function defineCachedRelations(obj) {
  if (!obj.__cachedRelations) {
    Object.defineProperty(obj, '__cachedRelations', {
      writable: true,
      enumerable: false,
      configurable: true,
      value: {}
    });
  }
}

/**
 * Check if the argument is plain object
 * @param {*) obj The obj value
 * @returns {boolean}
 */
function isPlainObject(obj) {
  return (typeof obj === 'object') && (obj !== null)
    && (obj.constructor === Object);
}
},{"__browserify_process":39,"qs":86,"traverse":87,"url":56}],83:[function(require,module,exports){
var process=require("__browserify_process");var util = require('util');
/**
 * Module exports
 */
exports.ValidationError = ValidationError;

/**
 * Validation mixins for model.js
 *
 * Basically validation configurators is just class methods, which adds validations
 * configs to AbstractClass._validations. Each of this validations run when
 * `obj.isValid()` method called.
 *
 * Each configurator can accept n params (n-1 field names and one config). Config
 * is {Object} depends on specific validation, but all of them has one common part:
 * `message` member. It can be just string, when only one situation possible,
 * e.g. `Post.validatesPresenceOf('title', { message: 'can not be blank' });`
 *
 * In more complicated cases it can be {Hash} of messages (for each case):
 * `User.validatesLengthOf('password', { min: 6, max: 20, message: {min: 'too short', max: 'too long'}});`
 */
exports.Validatable = Validatable;

function Validatable() {
}

/**
 * Validate presence. This validation fails when validated field is blank.
 *
 * Default error message "can't be blank"
 *
 * @example presence of title
 * ```
 * Post.validatesPresenceOf('title');
 * ```
 * @example with custom message
 * ```
 * Post.validatesPresenceOf('title', {message: 'Can not be blank'});
 * ```
 *
 * @sync
 *
 * @nocode
 * @see helper/validatePresence
 */
Validatable.validatesPresenceOf = getConfigurator('presence');

/**
 * Validate length. Three kinds of validations: min, max, is.
 *
 * Default error messages:
 *
 * - min: too short
 * - max: too long
 * - is:  length is wrong
 *
 * @example length validations
 * ```
 * User.validatesLengthOf('password', {min: 7});
 * User.validatesLengthOf('email', {max: 100});
 * User.validatesLengthOf('state', {is: 2});
 * User.validatesLengthOf('nick', {min: 3, max: 15});
 * ```
 * @example length validations with custom error messages
 * ```
 * User.validatesLengthOf('password', {min: 7, message: {min: 'too weak'}});
 * User.validatesLengthOf('state', {is: 2, message: {is: 'is not valid state name'}});
 * ```
 *
 * @sync
 * @nocode
 * @see helper/validateLength
 */
Validatable.validatesLengthOf = getConfigurator('length');

/**
 * Validate numericality.
 *
 * @example
 * ```
 * User.validatesNumericalityOf('age', { message: { number: '...' }});
 * User.validatesNumericalityOf('age', {int: true, message: { int: '...' }});
 * ```
 *
 * Default error messages:
 *
 * - number: is not a number
 * - int: is not an integer
 *
 * @sync
 * @nocode
 * @see helper/validateNumericality
 */
Validatable.validatesNumericalityOf = getConfigurator('numericality');

/**
 * Validate inclusion in set
 *
 * @example
 * ```
 * User.validatesInclusionOf('gender', {in: ['male', 'female']});
 * User.validatesInclusionOf('role', {
 *     in: ['admin', 'moderator', 'user'], message: 'is not allowed'
 * });
 * ```
 *
 * Default error message: is not included in the list
 *
 * @sync
 * @nocode
 * @see helper/validateInclusion
 */
Validatable.validatesInclusionOf = getConfigurator('inclusion');

/**
 * Validate exclusion
 *
 * @example `Company.validatesExclusionOf('domain', {in: ['www', 'admin']});`
 *
 * Default error message: is reserved
 *
 * @nocode
 * @see helper/validateExclusion
 */
Validatable.validatesExclusionOf = getConfigurator('exclusion');

/**
 * Validate format
 *
 * Default error message: is invalid
 *
 * @nocode
 * @see helper/validateFormat
 */
Validatable.validatesFormatOf = getConfigurator('format');

/**
 * Validate using custom validator
 *
 * Default error message: is invalid
 *
 * Example:
 *
 *     User.validate('name', customValidator, {message: 'Bad name'});
 *     function customValidator(err) {
 *         if (this.name === 'bad') err();
 *     });
 *     var user = new User({name: 'Peter'});
 *     user.isValid(); // true
 *     user.name = 'bad';
 *     user.isValid(); // false
 *
 * @nocode
 * @see helper/validateCustom
 */
Validatable.validate = getConfigurator('custom');

/**
 * Validate using custom async validator
 *
 * Default error message: is invalid
 *
 * Example:
 *
 *     User.validateAsync('name', customValidator, {message: 'Bad name'});
 *     function customValidator(err, done) {
 *         process.nextTick(function () {
 *             if (this.name === 'bad') err();
 *             done();
 *         });
 *     });
 *     var user = new User({name: 'Peter'});
 *     user.isValid(); // false (because async validation setup)
 *     user.isValid(function (isValid) {
 *         isValid; // true
 *     })
 *     user.name = 'bad';
 *     user.isValid(); // false
 *     user.isValid(function (isValid) {
 *         isValid; // false
 *     })
 *
 * @async
 * @nocode
 * @see helper/validateCustom
 */
Validatable.validateAsync = getConfigurator('custom', {async: true});

/**
 * Validate uniqueness
 *
 * Default error message: is not unique
 *
 * @async
 * @nocode
 * @see helper/validateUniqueness
 */
Validatable.validatesUniquenessOf = getConfigurator('uniqueness', {async: true});

// implementation of validators

/**
 * Presence validator
 */
function validatePresence(attr, conf, err) {
  if (blank(this[attr])) {
    err();
  }
}

/**
 * Length validator
 */
function validateLength(attr, conf, err) {
  if (nullCheck.call(this, attr, conf, err)) return;

  var len = this[attr].length;
  if (conf.min && len < conf.min) {
    err('min');
  }
  if (conf.max && len > conf.max) {
    err('max');
  }
  if (conf.is && len !== conf.is) {
    err('is');
  }
}

/**
 * Numericality validator
 */
function validateNumericality(attr, conf, err) {
  if (nullCheck.call(this, attr, conf, err)) return;

  if (typeof this[attr] !== 'number') {
    return err('number');
  }
  if (conf.int && this[attr] !== Math.round(this[attr])) {
    return err('int');
  }
}

/**
 * Inclusion validator
 */
function validateInclusion(attr, conf, err) {
  if (nullCheck.call(this, attr, conf, err)) return;

  if (!~conf.in.indexOf(this[attr])) {
    err()
  }
}

/**
 * Exclusion validator
 */
function validateExclusion(attr, conf, err) {
  if (nullCheck.call(this, attr, conf, err)) return;

  if (~conf.in.indexOf(this[attr])) {
    err()
  }
}

/**
 * Format validator
 */
function validateFormat(attr, conf, err) {
  if (nullCheck.call(this, attr, conf, err)) return;

  if (typeof this[attr] === 'string') {
    if (!this[attr].match(conf['with'])) {
      err();
    }
  } else {
    err();
  }
}

/**
 * Custom validator
 */
function validateCustom(attr, conf, err, done) {
  conf.customValidator.call(this, err, done);
}

/**
 * Uniqueness validator
 */
function validateUniqueness(attr, conf, err, done) {
  var cond = {where: {}};
  cond.where[attr] = this[attr];
  this.constructor.find(cond, function (error, found) {
    if (error) {
      return err();
    }
    if (found.length > 1) {
      err();
    } else if (found.length === 1 && (!this.id || !found[0].id || found[0].id.toString() != this.id.toString())) {
      err();
    }
    done();
  }.bind(this));
}

var validators = {
  presence: validatePresence,
  length: validateLength,
  numericality: validateNumericality,
  inclusion: validateInclusion,
  exclusion: validateExclusion,
  format: validateFormat,
  custom: validateCustom,
  uniqueness: validateUniqueness
};

function getConfigurator(name, opts) {
  return function () {
    configure(this, name, arguments, opts);
  };
}

/**
 * This method performs validation, triggers validation hooks.
 * Before validation `obj.errors` collection cleaned.
 * Each validation can add errors to `obj.errors` collection.
 * If collection is not blank, validation failed.
 *
 * @warning This method can be called as sync only when no async validation
 * configured. It's strongly recommended to run all validations as asyncronous.
 *
 * @param {Function} callback called with (valid)
 * @return {Boolean} true if no async validation configured and all passed
 *
 * @example ExpressJS controller: render user if valid, show flash otherwise
 * ```
 * user.isValid(function (valid) {
 *     if (valid) res.render({user: user});
 *     else res.flash('error', 'User is not valid'), console.log(user.errors), res.redirect('/users');
 * });
 * ```
 */
Validatable.prototype.isValid = function (callback, data) {
  var valid = true, inst = this, wait = 0, async = false;

  // exit with success when no errors
  if (!this.constructor._validations) {
    cleanErrors(this);
    if (callback) {
      this.trigger('validate', function (validationsDone) {
        validationsDone.call(inst, function () {
          callback(valid);
        });
      });
    }
    return valid;
  }

  Object.defineProperty(this, 'errors', {
    enumerable: false,
    configurable: true,
    value: new Errors
  });

  this.trigger('validate', function (validationsDone) {
    var inst = this,
      asyncFail = false;

    this.constructor._validations.forEach(function (v) {
      if (v[2] && v[2].async) {
        async = true;
        wait += 1;
        process.nextTick(function () {
          validationFailed(inst, v, done);
        });
      } else {
        if (validationFailed(inst, v)) {
          valid = false;
        }
      }

    });

    if (!async) {
      validationsDone.call(inst, function () {
        if (valid) cleanErrors(inst);
        if (callback) {
          callback(valid);
        }
      });
    }

    function done(fail) {
      asyncFail = asyncFail || fail;
      if (--wait === 0) {
        validationsDone.call(inst, function () {
          if (valid && !asyncFail) cleanErrors(inst);
          if (callback) {
            callback(valid && !asyncFail);
          }
        });
      }
    }

  }, data);

  if (async) {
    // in case of async validation we should return undefined here,
    // because not all validations are finished yet
    return;
  } else {
    return valid;
  }

};

function cleanErrors(inst) {
  Object.defineProperty(inst, 'errors', {
    enumerable: false,
    configurable: true,
    value: false
  });
}

function validationFailed(inst, v, cb) {
  var attr = v[0];
  var conf = v[1];
  var opts = v[2] || {};

  if (typeof attr !== 'string') return false;

  // here we should check skip validation conditions (if, unless)
  // that can be specified in conf
  if (skipValidation(inst, conf, 'if')) return false;
  if (skipValidation(inst, conf, 'unless')) return false;

  var fail = false;
  var validator = validators[conf.validation];
  var validatorArguments = [];
  validatorArguments.push(attr);
  validatorArguments.push(conf);
  validatorArguments.push(function onerror(kind) {
    var message, code = conf.validation;
    if (conf.message) {
      message = conf.message;
    }
    if (!message && defaultMessages[conf.validation]) {
      message = defaultMessages[conf.validation];
    }
    if (!message) {
      message = 'is invalid';
    }
    if (kind) {
      code += '.' + kind;
      if (message[kind]) {
        // get deeper
        message = message[kind];
      } else if (defaultMessages.common[kind]) {
        message = defaultMessages.common[kind];
      } else {
        message = 'is invalid';
      }
    }
    inst.errors.add(attr, message, code);
    fail = true;
  });
  if (cb) {
    validatorArguments.push(function () {
      cb(fail);
    });
  }
  validator.apply(inst, validatorArguments);
  return fail;
}

function skipValidation(inst, conf, kind) {
  var doValidate = true;
  if (typeof conf[kind] === 'function') {
    doValidate = conf[kind].call(inst);
    if (kind === 'unless') doValidate = !doValidate;
  } else if (typeof conf[kind] === 'string') {
    if (typeof inst[conf[kind]] === 'function') {
      doValidate = inst[conf[kind]].call(inst);
      if (kind === 'unless') doValidate = !doValidate;
    } else if (inst.__data.hasOwnProperty(conf[kind])) {
      doValidate = inst[conf[kind]];
      if (kind === 'unless') doValidate = !doValidate;
    } else {
      doValidate = kind === 'if';
    }
  }
  return !doValidate;
}

var defaultMessages = {
  presence: 'can\'t be blank',
  length: {
    min: 'too short',
    max: 'too long',
    is: 'length is wrong'
  },
  common: {
    blank: 'is blank',
    'null': 'is null'
  },
  numericality: {
    'int': 'is not an integer',
    'number': 'is not a number'
  },
  inclusion: 'is not included in the list',
  exclusion: 'is reserved',
  uniqueness: 'is not unique'
};

function nullCheck(attr, conf, err) {
  var isNull = this[attr] === null || !(attr in this);
  if (isNull) {
    if (!conf.allowNull) {
      err('null');
    }
    return true;
  } else {
    if (blank(this[attr])) {
      if (!conf.allowBlank) {
        err('blank');
      }
      return true;
    }
  }
  return false;
}

/**
 * Return true when v is undefined, blank array, null or empty string
 * otherwise returns false
 *
 * @param {Mix} v
 * @returns {Boolean} whether `v` blank or not
 */
function blank(v) {
  if (typeof v === 'undefined') return true;
  if (v instanceof Array && v.length === 0) return true;
  if (v === null) return true;
  if (typeof v == 'string' && v === '') return true;
  return false;
}

function configure(cls, validation, args, opts) {
  if (!cls._validations) {
    Object.defineProperty(cls, '_validations', {
      writable: true,
      configurable: true,
      enumerable: false,
      value: []
    });
  }
  args = [].slice.call(args);
  var conf;
  if (typeof args[args.length - 1] === 'object') {
    conf = args.pop();
  } else {
    conf = {};
  }
  if (validation === 'custom' && typeof args[args.length - 1] === 'function') {
    conf.customValidator = args.pop();
  }
  conf.validation = validation;
  args.forEach(function (attr) {
    cls._validations.push([attr, conf, opts]);
  });
}

function Errors() {
  Object.defineProperty(this, 'codes', {
    enumerable: false,
    configurable: true,
    value: {}
  });
}

Errors.prototype.add = function (field, message, code) {
  code = code || 'invalid';
  if (!this[field]) {
    this[field] = [];
    this.codes[field] = [];
  }
  this[field].push(message);
  this.codes[field].push(code);
};

function ErrorCodes(messages) {
  var c = this;
  Object.keys(messages).forEach(function (field) {
    c[field] = messages[field].codes;
  });
}

function ValidationError(obj) {
  if (!(this instanceof ValidationError)) return new ValidationError(obj);

  this.name = 'ValidationError';
  this.message = 'The Model instance is not valid. ' +
    'See `details` property of the error object for more info.';
  this.statusCode = 422;

  this.details = {
    context: obj && obj.constructor && obj.constructor.modelName,
    codes: obj.errors && obj.errors.codes,
    messages: obj.errors
  };

  Error.captureStackTrace(this, this.constructor);
}

util.inherits(ValidationError, Error);

},{"__browserify_process":39,"util":58}],84:[function(require,module,exports){
module.exports=require(20)
},{"__browserify_process":39}],85:[function(require,module,exports){
module.exports=require(64)
},{}],86:[function(require,module,exports){
/**
 * Object#toString() ref for stringify().
 */

var toString = Object.prototype.toString;

/**
 * Object#hasOwnProperty ref
 */

var hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * Array#indexOf shim.
 */

var indexOf = typeof Array.prototype.indexOf === 'function'
  ? function(arr, el) { return arr.indexOf(el); }
  : function(arr, el) {
      for (var i = 0; i < arr.length; i++) {
        if (arr[i] === el) return i;
      }
      return -1;
    };

/**
 * Array.isArray shim.
 */

var isArray = Array.isArray || function(arr) {
  return toString.call(arr) == '[object Array]';
};

/**
 * Object.keys shim.
 */

var objectKeys = Object.keys || function(obj) {
  var ret = [];
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      ret.push(key);
    }
  }
  return ret;
};

/**
 * Array#forEach shim.
 */

var forEach = typeof Array.prototype.forEach === 'function'
  ? function(arr, fn) { return arr.forEach(fn); }
  : function(arr, fn) {
      for (var i = 0; i < arr.length; i++) fn(arr[i]);
    };

/**
 * Array#reduce shim.
 */

var reduce = function(arr, fn, initial) {
  if (typeof arr.reduce === 'function') return arr.reduce(fn, initial);
  var res = initial;
  for (var i = 0; i < arr.length; i++) res = fn(res, arr[i]);
  return res;
};

/**
 * Cache non-integer test regexp.
 */

var isint = /^[0-9]+$/;

function promote(parent, key) {
  if (parent[key].length == 0) return parent[key] = {}
  var t = {};
  for (var i in parent[key]) {
    if (hasOwnProperty.call(parent[key], i)) {
      t[i] = parent[key][i];
    }
  }
  parent[key] = t;
  return t;
}

function parse(parts, parent, key, val) {
  var part = parts.shift();
  
  // illegal
  if (Object.getOwnPropertyDescriptor(Object.prototype, key)) return;
  
  // end
  if (!part) {
    if (isArray(parent[key])) {
      parent[key].push(val);
    } else if ('object' == typeof parent[key]) {
      parent[key] = val;
    } else if ('undefined' == typeof parent[key]) {
      parent[key] = val;
    } else {
      parent[key] = [parent[key], val];
    }
    // array
  } else {
    var obj = parent[key] = parent[key] || [];
    if (']' == part) {
      if (isArray(obj)) {
        if ('' != val) obj.push(val);
      } else if ('object' == typeof obj) {
        obj[objectKeys(obj).length] = val;
      } else {
        obj = parent[key] = [parent[key], val];
      }
      // prop
    } else if (~indexOf(part, ']')) {
      part = part.substr(0, part.length - 1);
      if (!isint.test(part) && isArray(obj)) obj = promote(parent, key);
      parse(parts, obj, part, val);
      // key
    } else {
      if (!isint.test(part) && isArray(obj)) obj = promote(parent, key);
      parse(parts, obj, part, val);
    }
  }
}

/**
 * Merge parent key/val pair.
 */

function merge(parent, key, val){
  if (~indexOf(key, ']')) {
    var parts = key.split('[')
      , len = parts.length
      , last = len - 1;
    parse(parts, parent, 'base', val);
    // optimize
  } else {
    if (!isint.test(key) && isArray(parent.base)) {
      var t = {};
      for (var k in parent.base) t[k] = parent.base[k];
      parent.base = t;
    }
    set(parent.base, key, val);
  }

  return parent;
}

/**
 * Compact sparse arrays.
 */

function compact(obj) {
  if ('object' != typeof obj) return obj;

  if (isArray(obj)) {
    var ret = [];

    for (var i in obj) {
      if (hasOwnProperty.call(obj, i)) {
        ret.push(obj[i]);
      }
    }

    return ret;
  }

  for (var key in obj) {
    obj[key] = compact(obj[key]);
  }

  return obj;
}

/**
 * Parse the given obj.
 */

function parseObject(obj){
  var ret = { base: {} };

  forEach(objectKeys(obj), function(name){
    merge(ret, name, obj[name]);
  });

  return compact(ret.base);
}

/**
 * Parse the given str.
 */

function parseString(str){
  var ret = reduce(String(str).split('&'), function(ret, pair){
    var eql = indexOf(pair, '=')
      , brace = lastBraceInKey(pair)
      , key = pair.substr(0, brace || eql)
      , val = pair.substr(brace || eql, pair.length)
      , val = val.substr(indexOf(val, '=') + 1, val.length);

    // ?foo
    if ('' == key) key = pair, val = '';
    if ('' == key) return ret;

    return merge(ret, decode(key), decode(val));
  }, { base: {} }).base;

  return compact(ret);
}

/**
 * Parse the given query `str` or `obj`, returning an object.
 *
 * @param {String} str | {Object} obj
 * @return {Object}
 * @api public
 */

exports.parse = function(str){
  if (null == str || '' == str) return {};
  return 'object' == typeof str
    ? parseObject(str)
    : parseString(str);
};

/**
 * Turn the given `obj` into a query string
 *
 * @param {Object} obj
 * @return {String}
 * @api public
 */

var stringify = exports.stringify = function(obj, prefix) {
  if (isArray(obj)) {
    return stringifyArray(obj, prefix);
  } else if ('[object Object]' == toString.call(obj)) {
    return stringifyObject(obj, prefix);
  } else if ('string' == typeof obj) {
    return stringifyString(obj, prefix);
  } else {
    return prefix + '=' + encodeURIComponent(String(obj));
  }
};

/**
 * Stringify the given `str`.
 *
 * @param {String} str
 * @param {String} prefix
 * @return {String}
 * @api private
 */

function stringifyString(str, prefix) {
  if (!prefix) throw new TypeError('stringify expects an object');
  return prefix + '=' + encodeURIComponent(str);
}

/**
 * Stringify the given `arr`.
 *
 * @param {Array} arr
 * @param {String} prefix
 * @return {String}
 * @api private
 */

function stringifyArray(arr, prefix) {
  var ret = [];
  if (!prefix) throw new TypeError('stringify expects an object');
  for (var i = 0; i < arr.length; i++) {
    ret.push(stringify(arr[i], prefix + '[' + i + ']'));
  }
  return ret.join('&');
}

/**
 * Stringify the given `obj`.
 *
 * @param {Object} obj
 * @param {String} prefix
 * @return {String}
 * @api private
 */

function stringifyObject(obj, prefix) {
  var ret = []
    , keys = objectKeys(obj)
    , key;

  for (var i = 0, len = keys.length; i < len; ++i) {
    key = keys[i];
    if ('' == key) continue;
    if (null == obj[key]) {
      ret.push(encodeURIComponent(key) + '=');
    } else {
      ret.push(stringify(obj[key], prefix
        ? prefix + '[' + encodeURIComponent(key) + ']'
        : encodeURIComponent(key)));
    }
  }

  return ret.join('&');
}

/**
 * Set `obj`'s `key` to `val` respecting
 * the weird and wonderful syntax of a qs,
 * where "foo=bar&foo=baz" becomes an array.
 *
 * @param {Object} obj
 * @param {String} key
 * @param {String} val
 * @api private
 */

function set(obj, key, val) {
  var v = obj[key];
  if (Object.getOwnPropertyDescriptor(Object.prototype, key)) return;
  if (undefined === v) {
    obj[key] = val;
  } else if (isArray(v)) {
    v.push(val);
  } else {
    obj[key] = [v, val];
  }
}

/**
 * Locate last brace in `str` within the key.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function lastBraceInKey(str) {
  var len = str.length
    , brace
    , c;
  for (var i = 0; i < len; ++i) {
    c = str[i];
    if (']' == c) brace = false;
    if ('[' == c) brace = true;
    if ('=' == c && !brace) return i;
  }
}

/**
 * Decode `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

function decode(str) {
  try {
    return decodeURIComponent(str.replace(/\+/g, ' '));
  } catch (err) {
    return str;
  }
}

},{}],87:[function(require,module,exports){
var traverse = module.exports = function (obj) {
    return new Traverse(obj);
};

function Traverse (obj) {
    this.value = obj;
}

Traverse.prototype.get = function (ps) {
    var node = this.value;
    for (var i = 0; i < ps.length; i ++) {
        var key = ps[i];
        if (!node || !hasOwnProperty.call(node, key)) {
            node = undefined;
            break;
        }
        node = node[key];
    }
    return node;
};

Traverse.prototype.has = function (ps) {
    var node = this.value;
    for (var i = 0; i < ps.length; i ++) {
        var key = ps[i];
        if (!node || !hasOwnProperty.call(node, key)) {
            return false;
        }
        node = node[key];
    }
    return true;
};

Traverse.prototype.set = function (ps, value) {
    var node = this.value;
    for (var i = 0; i < ps.length - 1; i ++) {
        var key = ps[i];
        if (!hasOwnProperty.call(node, key)) node[key] = {};
        node = node[key];
    }
    node[ps[i]] = value;
    return value;
};

Traverse.prototype.map = function (cb) {
    return walk(this.value, cb, true);
};

Traverse.prototype.forEach = function (cb) {
    this.value = walk(this.value, cb, false);
    return this.value;
};

Traverse.prototype.reduce = function (cb, init) {
    var skip = arguments.length === 1;
    var acc = skip ? this.value : init;
    this.forEach(function (x) {
        if (!this.isRoot || !skip) {
            acc = cb.call(this, acc, x);
        }
    });
    return acc;
};

Traverse.prototype.paths = function () {
    var acc = [];
    this.forEach(function (x) {
        acc.push(this.path); 
    });
    return acc;
};

Traverse.prototype.nodes = function () {
    var acc = [];
    this.forEach(function (x) {
        acc.push(this.node);
    });
    return acc;
};

Traverse.prototype.clone = function () {
    var parents = [], nodes = [];
    
    return (function clone (src) {
        for (var i = 0; i < parents.length; i++) {
            if (parents[i] === src) {
                return nodes[i];
            }
        }
        
        if (typeof src === 'object' && src !== null) {
            var dst = copy(src);
            
            parents.push(src);
            nodes.push(dst);
            
            forEach(objectKeys(src), function (key) {
                dst[key] = clone(src[key]);
            });
            
            parents.pop();
            nodes.pop();
            return dst;
        }
        else {
            return src;
        }
    })(this.value);
};

function walk (root, cb, immutable) {
    var path = [];
    var parents = [];
    var alive = true;
    
    return (function walker (node_) {
        var node = immutable ? copy(node_) : node_;
        var modifiers = {};
        
        var keepGoing = true;
        
        var state = {
            node : node,
            node_ : node_,
            path : [].concat(path),
            parent : parents[parents.length - 1],
            parents : parents,
            key : path.slice(-1)[0],
            isRoot : path.length === 0,
            level : path.length,
            circular : null,
            update : function (x, stopHere) {
                if (!state.isRoot) {
                    state.parent.node[state.key] = x;
                }
                state.node = x;
                if (stopHere) keepGoing = false;
            },
            'delete' : function (stopHere) {
                delete state.parent.node[state.key];
                if (stopHere) keepGoing = false;
            },
            remove : function (stopHere) {
                if (isArray(state.parent.node)) {
                    state.parent.node.splice(state.key, 1);
                }
                else {
                    delete state.parent.node[state.key];
                }
                if (stopHere) keepGoing = false;
            },
            keys : null,
            before : function (f) { modifiers.before = f },
            after : function (f) { modifiers.after = f },
            pre : function (f) { modifiers.pre = f },
            post : function (f) { modifiers.post = f },
            stop : function () { alive = false },
            block : function () { keepGoing = false }
        };
        
        if (!alive) return state;
        
        function updateState() {
            if (typeof state.node === 'object' && state.node !== null) {
                if (!state.keys || state.node_ !== state.node) {
                    state.keys = objectKeys(state.node)
                }
                
                state.isLeaf = state.keys.length == 0;
                
                for (var i = 0; i < parents.length; i++) {
                    if (parents[i].node_ === node_) {
                        state.circular = parents[i];
                        break;
                    }
                }
            }
            else {
                state.isLeaf = true;
                state.keys = null;
            }
            
            state.notLeaf = !state.isLeaf;
            state.notRoot = !state.isRoot;
        }
        
        updateState();
        
        // use return values to update if defined
        var ret = cb.call(state, state.node);
        if (ret !== undefined && state.update) state.update(ret);
        
        if (modifiers.before) modifiers.before.call(state, state.node);
        
        if (!keepGoing) return state;
        
        if (typeof state.node == 'object'
        && state.node !== null && !state.circular) {
            parents.push(state);
            
            updateState();
            
            forEach(state.keys, function (key, i) {
                path.push(key);
                
                if (modifiers.pre) modifiers.pre.call(state, state.node[key], key);
                
                var child = walker(state.node[key]);
                if (immutable && hasOwnProperty.call(state.node, key)) {
                    state.node[key] = child.node;
                }
                
                child.isLast = i == state.keys.length - 1;
                child.isFirst = i == 0;
                
                if (modifiers.post) modifiers.post.call(state, child);
                
                path.pop();
            });
            parents.pop();
        }
        
        if (modifiers.after) modifiers.after.call(state, state.node);
        
        return state;
    })(root).node;
}

function copy (src) {
    if (typeof src === 'object' && src !== null) {
        var dst;
        
        if (isArray(src)) {
            dst = [];
        }
        else if (isDate(src)) {
            dst = new Date(src.getTime ? src.getTime() : src);
        }
        else if (isRegExp(src)) {
            dst = new RegExp(src);
        }
        else if (isError(src)) {
            dst = { message: src.message };
        }
        else if (isBoolean(src)) {
            dst = new Boolean(src);
        }
        else if (isNumber(src)) {
            dst = new Number(src);
        }
        else if (isString(src)) {
            dst = new String(src);
        }
        else if (Object.create && Object.getPrototypeOf) {
            dst = Object.create(Object.getPrototypeOf(src));
        }
        else if (src.constructor === Object) {
            dst = {};
        }
        else {
            var proto =
                (src.constructor && src.constructor.prototype)
                || src.__proto__
                || {}
            ;
            var T = function () {};
            T.prototype = proto;
            dst = new T;
        }
        
        forEach(objectKeys(src), function (key) {
            dst[key] = src[key];
        });
        return dst;
    }
    else return src;
}

var objectKeys = Object.keys || function keys (obj) {
    var res = [];
    for (var key in obj) res.push(key)
    return res;
};

function toS (obj) { return Object.prototype.toString.call(obj) }
function isDate (obj) { return toS(obj) === '[object Date]' }
function isRegExp (obj) { return toS(obj) === '[object RegExp]' }
function isError (obj) { return toS(obj) === '[object Error]' }
function isBoolean (obj) { return toS(obj) === '[object Boolean]' }
function isNumber (obj) { return toS(obj) === '[object Number]' }
function isString (obj) { return toS(obj) === '[object String]' }

var isArray = Array.isArray || function isArray (xs) {
    return Object.prototype.toString.call(xs) === '[object Array]';
};

var forEach = function (xs, fn) {
    if (xs.forEach) return xs.forEach(fn)
    else for (var i = 0; i < xs.length; i++) {
        fn(xs[i], i, xs);
    }
};

forEach(objectKeys(Traverse.prototype), function (key) {
    traverse[key] = function (obj) {
        var args = [].slice.call(arguments, 1);
        var t = new Traverse(obj);
        return t[key].apply(t, args);
    };
});

var hasOwnProperty = Object.hasOwnProperty || function (obj, key) {
    return key in obj;
};

},{}],88:[function(require,module,exports){
/**
 * Expose the `Swagger` plugin.
 */
module.exports = Swagger;

/**
 * Module dependencies.
 */
var Remoting = require('../');

/**
 * Create a remotable Swagger module for plugging into `RemoteObjects`.
 */
function Swagger(remotes, options, models) {
  // Unfold options.
  var _options = options || {};
  var name = _options.name || 'swagger';
  var version = _options.version;
  var basePath = _options.basePath;

  // We need a temporary REST adapter to discover our available routes.
  var adapter = remotes.handler('rest').adapter;
  var routes = adapter.allRoutes();
  var classes = remotes.classes();

  var extension = {};
  var helper = Remoting.extend(extension);

  var apiDocs = {};
  var resourceDoc = {
    apiVersion: version,
    swaggerVersion: '1.1',
    basePath: basePath,
    apis: []
  };

  classes.forEach(function (item) {
    resourceDoc.apis.push({
      path: '/' + name + item.http.path,
      description: item.ctor.sharedCtor && item.ctor.sharedCtor.description
    });

    apiDocs[item.name] = {
      apiVersion: resourceDoc.apiVersion,
      swaggerVersion: resourceDoc.swaggerVersion,
      basePath: resourceDoc.basePath,
      apis: [],
      models: models
    };

    helper.method(api, {
      path: item.name,
      http: { path: item.http.path },
      returns: { type: 'object', root: true }
    });
    function api(callback) {
      callback(null, apiDocs[item.name]);
    }
    addDynamicBasePathGetter(remotes, name + '.' + item.name, apiDocs[item.name]);
  });

  routes.forEach(function (route) {
    var split = route.method.split('.');
    var doc = apiDocs[split[0]];
    var classDef;

    if (!doc) {
      console.error('Route exists with no class: %j', route);
      return;
    }

    classDef = classes.filter(function (item) {
      return item.name === split[0];
    })[0];

    if (classDef && classDef.sharedCtor && classDef.sharedCtor.accepts && split.length > 2 /* HACK */) {
      route.accepts = (route.accepts || []).concat(classDef.sharedCtor.accepts);
    }

    doc.apis.push(routeToAPI(route));
  });

  /**
   * The topmost Swagger resource is a description of all (non-Swagger) resources
   * available on the system, and where to find more information about them.
   */
  helper.method(resources, {
    returns: [{ type: 'object', root: true }]
  });
  function resources(callback) {
    callback(null, resourceDoc);
  }
  addDynamicBasePathGetter(remotes, name + '.resources', resourceDoc);

  remotes.exports[name] = extension;
  return extension;
}

/**
 * There's a few forces at play that require this "hack". The Swagger spec
 * requires a `basePath` to be set at various points in the API/Resource
 * descriptions. However, we can't guarantee this path is either reachable or
 * desirable if it's set as a part of the options.
 *
 * The simplest way around this is to reflect the value of the `Host` HTTP
 * header as the `basePath`. Because we pre-build the Swagger data, we don't
 * know that header at the time the data is built. Hence, the getter function.
 * We can use a `before` hook to pluck the `Host`, then the getter kicks in to
 * return that path as the `basePath` during JSON serialization.
 *
 * @param {SharedClassCollection} remotes The Collection to register a `before`
 *                                        hook on.
 * @param {String} path                   The full path of the route to register
 *                                        a `before` hook on.
 * @param {Object} obj                    The Object to install the `basePath`
 *                                        getter on.
 */
function addDynamicBasePathGetter(remotes, path, obj) {
  var initialPath = obj.basePath || '/';
  var basePath = String(obj.basePath) || '';

  if (!/^https?:\/\//.test(basePath)) {
    remotes.before(path, function (ctx, next) {
      var headers = ctx.req.headers;
      var host = headers.Host || headers.host;

      basePath = ctx.req.protocol + '://' + host + initialPath;

      next();
    });
  }

  return setter(obj);

  function getter() {
    return basePath;
  }

  function setter(obj) {
    return Object.defineProperty(obj, 'basePath', {
      configurable: false,
      enumerable: true,
      get: getter
    });
  }
}

/**
 * Converts from an sl-remoting-formatted "Route" description to a
 * Swagger-formatted "API" description.
 */

function routeToAPI(route) {
  var returnDesc = route.returns && route.returns[0];

  return {
    path: convertPathFragments(route.path),
    operations: [{
      httpMethod: convertVerb(route.verb),
      nickname: route.method.replace(/\./g, '_'), // [rfeng] Swagger UI doesn't escape '.' for jQuery selector
      responseClass: returnDesc ? returnDesc.model || prepareDataType(returnDesc.type) : 'void',
      parameters: route.accepts ? route.accepts.map(acceptToParameter(route)) : [],
      errorResponses: [], // TODO(schoon) - We don't have descriptions for this yet.
      summary: route.description, // TODO(schoon) - Excerpt?
      notes: '' // TODO(schoon) - `description` metadata?
    }]
  };
}

function convertPathFragments(path) {
  return path.split('/').map(function (fragment) {
    if (fragment.charAt(0) === ':') {
      return '{' + fragment.slice(1) + '}';
    }
    return fragment;
  }).join('/');
}

function convertVerb(verb) {
  if (verb.toLowerCase() === 'all') {
    return 'POST';
  }

  if (verb.toLowerCase() === 'del') {
    return 'DELETE';
  }

  return verb.toUpperCase();
}

/**
 * A generator to convert from an sl-remoting-formatted "Accepts" description to
 * a Swagger-formatted "Parameter" description.
 */

function acceptToParameter(route) {
  var type = 'form';

  if (route.verb.toLowerCase() === 'get') {
    type = 'query';
  }

  return function (accepts) {
    var name = accepts.name || accepts.arg;
    var paramType = type;

    // TODO: Regex. This is leaky.
    if (route.path.indexOf(':' + name) !== -1) {
      paramType = 'path';
    }

    // Check the http settings for the argument
    if(accepts.http && accepts.http.source) {
        paramType = accepts.http.source;
    }

    return {
      paramType: paramType || type,
      name: name,
      description: accepts.description,
      dataType: accepts.model || prepareDataType(accepts.type),
      required: !!accepts.required,
      allowMultiple: false
    };
  };
}

/**
 * Converts from an sl-remoting data type to a Swagger dataType.
 */

function prepareDataType(type) {
  if (!type) {
    return 'void';
  }

  // TODO(schoon) - Add support for complex dataTypes, "models", etc.
  switch (type) {
    case 'buffer':
      return 'byte';
    case 'date':
      return 'Date';
    case 'number':
      return 'double';
  }

  return type;
}

},{"../":89}],89:[function(require,module,exports){
/**
 * remotes ~ public api
 */

module.exports = require('./lib/remote-objects');
},{"./lib/remote-objects":91}],90:[function(require,module,exports){
/*!
 * Expose `ExportsHelper`.
 */

module.exports = ExportsHelper;

/*!
 * Module dependencies.
 */
var debug = require('debug')('strong-remoting:exports-helper');

/*!
 * Constants
 */
var PASSTHROUGH_OPTIONS = ['http', 'description'];

/**
 * @class A wrapper to make manipulating the exports object easier.
 *
 * @constructor
 * Create a new `ExportsHelper` with the given `options`.
 */

function ExportsHelper(obj) {
  if (!(this instanceof ExportsHelper)) {
    return new ExportsHelper(obj);
  }

  this._obj = obj;
}

/**
 * Sets a value at any path within the exports object.
 */
ExportsHelper.prototype.setPath = setPath;
function setPath(path, value) {
  var self = this;
  var obj = self._obj;
  var split = path.split('.');
  var name = split.pop();

  split.forEach(function (key) {
    if (!obj[key]) {
      obj[key] = {};
    }

    obj = obj[key];
  });

  debug('Setting %s to %s', path, value);
  obj[name] = value;

  return self;
}

/**
 * Exports a constructor ("type") with the provided options.
 */
ExportsHelper.prototype.addType = type;
ExportsHelper.prototype.type = type;
function type(fn, options) {
  var self = this;
  var path = options.path || options.name || fn.name || null;
  var sharedCtor = options.sharedCtor || null;
  var accepts = options.accepts || null;

  if (!path) {
    // TODO: Error.
    return self;
  }

  if (!sharedCtor) {
    // TODO(schoon) - This shouldn't be thought of (or named) as a "shared
    // constructor". Instead, this is the lazy find/create sl-remoting uses when
    // a prototype method is called. `getInstance`? `findOrCreate`? `load`?
    sharedCtor = function () {
      var _args = [].slice.call(arguments);
      _args.pop()(null, fn.apply(null, _args));
    };
  }

  if (!sharedCtor.accepts) {
    sharedCtor.accepts = accepts;
  }

  // This is required because sharedCtors are called just like any other
  // remotable method. However, you always expect the instance and nothing else.
  if (!sharedCtor.returns) {
    sharedCtor.returns = { type: 'object', root: true };
  }

  PASSTHROUGH_OPTIONS.forEach(function (key) {
    if (options[key]) {
      sharedCtor[key] = options[key];
    }
  });

  self.setPath(path, fn);
  fn.shared = true;
  fn.sharedCtor = sharedCtor;

  return new ExportsHelper(fn.prototype);
}

/**
 * Exports a Function with the provided options.
 */
ExportsHelper.prototype.addMethod = method;
ExportsHelper.prototype.method = method;
function method(fn, options) {
  var self = this;
  var path = options.path || options.name || fn.name || null;
  var accepts = options.accepts || null;
  var returns = options.returns || null;

  if (!path) {
    // TODO: Error.
    return self;
  }

  self.setPath(path, fn);
  fn.shared = true;
  fn.accepts = accepts;
  fn.returns = returns;

  PASSTHROUGH_OPTIONS.forEach(function (key) {
    if (options[key]) {
      fn[key] = options[key];
    }
  });

  return self;
}

},{"debug":60}],91:[function(require,module,exports){
/*!
 * Expose `RemoteObjects`.
 */

module.exports = RemoteObjects;

/*!
 * Module dependencies.
 */

var EventEmitter = require('eventemitter2').EventEmitter2
  , debug = require('debug')('strong-remoting:remotes')
  , util = require('util')
  , inherits = util.inherits
  , assert = require('assert')
  , SharedClass = require('./shared-class')
  , ExportsHelper = require('./exports-helper');

/**
 * Create a new `RemoteObjects` with the given `options`.
 *
 * ```js
 * var remoteObjects = require('strong-remoting').create();
 * ```
 *
 * @param {Object} options
 * @return {RemoteObjects}
 */

function RemoteObjects(options) {
  EventEmitter.call(this, {wildcard: true});
  // Avoid warning: possible EventEmitter memory leak detected
  this.setMaxListeners(16);
  this.options = options || {};
  this.exports = this.options.exports || {};
}

/*!
 * Inherit from `EventEmitter`.
 */

inherits(RemoteObjects, EventEmitter);

/*!
 * Simplified APIs
 */

RemoteObjects.create = function (options) {
  return new RemoteObjects(options);
}

RemoteObjects.extend = function (exports) {
  return new ExportsHelper(exports);
}

/**
 * Create a handler from the given adapter.
 *
 * @param {String} adapter name
 * @return {Function}
 */

// TODO(schoon) - Add options support.
RemoteObjects.prototype.handler = function (name, server) {
  var Adapter = this.adapter(name);
  var adapter = new Adapter(this, server);
  var handler = adapter.createHandler();

  if(handler) {
    // allow adapter reference from handler
    handler.adapter = adapter;
  }

  return handler;
}

/**
 * Get an adapter by name.
 * @param {String} name The adapter name
 * @return {Adapter}
 */

RemoteObjects.prototype.adapter = function (name) {
  return require('./' + name + '-adapter');
}

/**
 * Get all classes.
 */

RemoteObjects.prototype.classes = function () {
  var exports = this.exports;

  return Object
    .keys(exports)
    .map(function (name) {
      return new SharedClass(name, exports[name]);
    });
}

/**
 * Find a method by its string name.
 *
 * Example Method Strings:
 *
 *  - `MyClass.prototype.myMethod`
 *  - `MyClass.staticMethod`
 *  - `obj.method`
 *
 * @param {String} methodString
 */

RemoteObjects.prototype.findMethod = function (methodString) {
  var methods = this.methods();

  for (var i = 0; i < methods.length; i++) {
    if(methods[i].stringName === methodString) return methods[i];
  }
}

/**
 * List all methods.
 */

RemoteObjects.prototype.methods = function () {
  var methods = [];

  this
    .classes()
    .forEach(function (sc) {
      methods = sc.methods().concat(methods);
    });

  return methods;
}

/**
 * Get as JSON.
 */

RemoteObjects.prototype.toJSON = function () {
  var result = {};
  var methods = this.methods();

  methods.forEach(function (sharedMethod) {
    result[sharedMethod.stringName] = {
      http: sharedMethod.fn && sharedMethod.fn.http,
      accepts: sharedMethod.accepts,
      returns: sharedMethod.returns
    };
  });

  return result;
}

/**
 * Execute the given function before the matched method string.
 *
 * **Examples:**
 *
 * ```js
 * // Do something before our `user.greet` example, earlier.
 * remotes.before('user.greet', function (ctx, next) {
 *   if((ctx.req.param('password') || '').toString() !== '1234') {
 *     next(new Error('Bad password!'));
 *   } else {
 *     next();
 *   }
 * });
 *
 * // Do something before any `user` method.
 * remotes.before('user.*', function (ctx, next) {
 *   console.log('Calling a user method.');
 *   next();
 * });
 *
 * // Do something before a `dog` instance method.
 * remotes.before('dog.prototype.*', function (ctx, next) {
 *   var dog = this;
 *   console.log('Calling a method on "%s".', dog.name);
 *   next();
 * });
 * ```
 *
 * @param {String} methodMatch The glob to match a method string
 * @callback {Function} hook
 * @param {Context} ctx The adapter specific context
 * @param {Function} next Call with an optional error object
 * @param {SharedMethod} method The SharedMethod object
 */

RemoteObjects.prototype.before = function (methodMatch, fn) {
  this.on('before.' + methodMatch, fn);
}

/**
 * Execute the given `hook` function after the matched method string.
 *
 * **Examples:**
 *
 * ```js
 * // Do something after the `speak` instance method.
 * // NOTE: you cannot cancel a method after it has been called.
 * remotes.after('dog.prototype.speak', function (ctx, next) {
 *   console.log('After speak!');
 *   next();
 * });
 *
 * // Do something before all methods.
 * remotes.before('**', function (ctx, next, method) {
 *   console.log('Calling:', method.name);
 *   next();
 * });
 *
 * // Modify all returned values named `result`.
 * remotes.after('**', function (ctx, next) {
 *   ctx.result += '!!!';
 *   next();
 * });
 * ```
 *
 * @param {String} methodMatch The glob to match a method string
 * @callback {Function} hook
 * @param {Context} ctx The adapter specific context
 * @param {Function} next Call with an optional error object
 * @param {SharedMethod} method The SharedMethod object
 */

RemoteObjects.prototype.after = function (methodMatch, fn) {
  this.on('after.' + methodMatch, fn);
}

/*!
 * Create a middleware style emit that supports wildcards.
 */

RemoteObjects.prototype.execHooks = function(when, method, scope, ctx, next) {
  var stack = [];
  var ee = this;
  var type = when + '.' + method.sharedClass.name + (method.isStatic ? '.' : '.prototype.') + method.name;

  this._events || init.call(this);

  var handler;

  // context
  this.objectName = method.sharedClass.name;
  this.methodName = method.name;

  if(this.wildcard) {
    handler = [];
    var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
    searchListenerTree.call(this, handler, ns, this.listenerTree, 0);
  } else {
    handler = this._events[type];
  }

  if (typeof handler === 'function') {
    this.event = type;

    addToStack(handler);

    return execStack();
  } else if (handler) {
    var l = arguments.length;
    var args = new Array(l - 1);
    for (var i = 1; i < l; i++) args[i - 1] = arguments[i];

    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      addToStack(listeners[i]);
    }
  }

  function addToStack(fn) {
    stack.push(fn);
  }

  function execStack(err) {
    if(err) return next(err);

    var cur = stack.shift();

    if(cur) {
      cur.call(scope, ctx, execStack, method);
    } else {
      next();
    }
  }

  return execStack();
};

// from EventEmitter2
function searchListenerTree(handlers, type, tree, i) {
  if (!tree) {
    return [];
  }
  var listeners=[], leaf, len, branch, xTree, xxTree, isolatedBranch, endReached,
      typeLength = type.length, currentType = type[i], nextType = type[i+1];
  if (i === typeLength && tree._listeners) {
    //
    // If at the end of the event(s) list and the tree has listeners
    // invoke those listeners.
    //
    if (typeof tree._listeners === 'function') {
      handlers && handlers.push(tree._listeners);
      return [tree];
    } else {
      for (leaf = 0, len = tree._listeners.length; leaf < len; leaf++) {
        handlers && handlers.push(tree._listeners[leaf]);
      }
      return [tree];
    }
  }

  if ((currentType === '*' || currentType === '**') || tree[currentType]) {
    //
    // If the event emitted is '*' at this part
    // or there is a concrete match at this patch
    //
    if (currentType === '*') {
      for (branch in tree) {
        if (branch !== '_listeners' && tree.hasOwnProperty(branch)) {
          listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i+1));
        }
      }
      return listeners;
    } else if(currentType === '**') {
      endReached = (i+1 === typeLength || (i+2 === typeLength && nextType === '*'));
      if(endReached && tree._listeners) {
        // The next element has a _listeners, add it to the handlers.
        listeners = listeners.concat(searchListenerTree(handlers, type, tree, typeLength));
      }

      for (branch in tree) {
        if (branch !== '_listeners' && tree.hasOwnProperty(branch)) {
          if(branch === '*' || branch === '**') {
            if(tree[branch]._listeners && !endReached) {
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], typeLength));
            }
            listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i));
          } else if(branch === nextType) {
            listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i+2));
          } else {
            // No match on this one, shift into the tree but not in the type array.
            listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i));
          }
        }
      }
      return listeners;
    }

    listeners = listeners.concat(searchListenerTree(handlers, type, tree[currentType], i+1));
  }

  xTree = tree['*'];
  if (xTree) {
    //
    // If the listener tree will allow any match for this part,
    // then recursively explore all branches of the tree
    //
    searchListenerTree(handlers, type, xTree, i+1);
  }

  xxTree = tree['**'];
  if(xxTree) {
    if(i < typeLength) {
      if(xxTree._listeners) {
        // If we have a listener on a '**', it will catch all, so add its handler.
        searchListenerTree(handlers, type, xxTree, typeLength);
      }

      // Build arrays of matching next branches and others.
      for(branch in xxTree) {
        if(branch !== '_listeners' && xxTree.hasOwnProperty(branch)) {
          if(branch === nextType) {
            // We know the next element will match, so jump twice.
            searchListenerTree(handlers, type, xxTree[branch], i+2);
          } else if(branch === currentType) {
            // Current node matches, move into the tree.
            searchListenerTree(handlers, type, xxTree[branch], i+1);
          } else {
            isolatedBranch = {};
            isolatedBranch[branch] = xxTree[branch];
            searchListenerTree(handlers, type, { '**': isolatedBranch }, i+1);
          }
        }
      }
    } else if(xxTree._listeners) {
      // We have reached the end and still on a '**'
      searchListenerTree(handlers, type, xxTree, typeLength);
    } else if(xxTree['*'] && xxTree['*']._listeners) {
      searchListenerTree(handlers, type, xxTree['*'], typeLength);
    }
  }

  return listeners;
}

/**
 * Invoke the given shared method using the supplied context.
 * Execute registered before/after hooks.
 * @param ctx
 * @param method
 * @param cb
 */
RemoteObjects.prototype.invokeMethodInContext = function(ctx, method, cb) {
  var self = this;

  var scope = this.getScope(ctx, method);

  self.execHooks('before', method, scope, ctx, function(err) {
    if (err) return cb(err);

    ctx.invoke(scope, method, function(err, result) {
      if (err) return cb(err);
      ctx.result = result;
      self.execHooks('after', method, scope, ctx, function(err) {
        if (err) return cb(err);
        cb();
      });
    });
  });
};

/**
 * Determine what scope object to use when invoking the given remote method in
 * the given context.
 * @private
 */
RemoteObjects.prototype.getScope = function(ctx, method) {
  // Static methods are invoked on the constructor (this = constructor fn)
  // Prototype methods are invoked on the instance (this = instance)
  return ctx.instance || method.ctor;
}

},{"./exports-helper":90,"./shared-class":92,"assert":24,"debug":60,"eventemitter2":94,"util":58}],92:[function(require,module,exports){
/**
 * Expose `SharedClass`.
 */

module.exports = SharedClass;

/**
 * Module dependencies.
 */

var debug = require('debug')('strong-remoting:shared-class')
  , util = require('util')
  , inherits = util.inherits
  , SharedMethod = require('./shared-method')
  , assert = require('assert');
  
/**
 * Create a new `SharedClass` with the given `options`.
 *
 * @param {Object} options
 * @return {SharedClass}
 */

function SharedClass(name, ctor) {
  this.name = name || ctor.remoteNamespace;
  this.ctor = ctor;

  if (typeof ctor === 'function') {
    // TODO(schoon) - Can we fall back to using the ctor as a method directly?
    // Without that, all remote methods have to be two levels deep, e.g.
    // `/meta/routes`.
    assert(ctor.sharedCtor, 'must define a sharedCtor');
    this.sharedCtor = new SharedMethod(ctor.sharedCtor, 'sharedCtor');
  }

  this.http = util._extend({ path: '/' + this.name }, ctor.http);
  
  assert(this.name, 'must include a remoteNamespace when creating a SharedClass');
}

/**
 * Get all shared methods.
 */

SharedClass.prototype.methods = function () {
  var ctor = this.ctor;
  var methods = [];
  var sc = this;
  
  // static methods
  eachRemoteFunctionInObject(ctor, function (fn, name) {
    methods.push(new SharedMethod(fn, name, sc, true));
  });
  
  // instance methods
  eachRemoteFunctionInObject(ctor.prototype, function (fn, name) {
    methods.push(new SharedMethod(fn, name, sc));
  });
  
  return methods;
}

function eachRemoteFunctionInObject(obj, f) {
  if(!obj) return;
    
  for(var key in obj) {
    if(key === 'super_') {
      // Skip super class
      continue;
    }
    var fn;
     
    try {
      fn = obj[key];
    } catch(e) {
    }
    
    if(typeof fn === 'function' && fn.shared) {
      f(fn, key);
    }
  }
}

},{"./shared-method":93,"assert":24,"debug":60,"util":58}],93:[function(require,module,exports){
var Buffer=require("__browserify_Buffer");/**
 * Expose `SharedMethod`.
 */

module.exports = SharedMethod;

/**
 * Module dependencies.
 */

var EventEmitter = require('events').EventEmitter
  , debug = require('debug')('strong-remoting:shared-method')
  , util = require('util')
  , inherits = util.inherits
  , assert = require('assert')
  , traverse = require('traverse');

/**
 * Create a new `SharedMethod` with the given `fn`.
 *
 * @param {Function} fn
 * @return {SharedMethod}
 */

function SharedMethod(fn, name, sc, isStatic) {
  assert(fn);
  this.fn = fn;
  this.name = name;
  this.isStatic = isStatic;
  this.accepts = fn.accepts || [];
  this.returns = fn.returns || [];
  this.description = fn.description;
  this.http = fn.http || {};
  this.rest = fn.rest || {};
  this.sharedClass = sc;

  if(sc) {
    this.ctor = sc.ctor;
    this.sharedCtor = sc.sharedCtor;
  }
  if(name === 'sharedCtor') {
    this.isSharedCtor = true;
  }

  if(this.accepts && !Array.isArray(this.accepts)) {
    this.accepts = [this.accepts];
  }
  if(this.returns && !Array.isArray(this.returns)) {
    this.returns = [this.returns];
  }

  this.stringName = (sc ? sc.name : '') + (isStatic ? '.' : '.prototype.') + name;
}

/**
 * Execute the remote method using the given arg data.
 *
 * @param args {Object} containing named argument data
 * @param fn {Function} callback `fn(err, result)` containing named result data
 */

SharedMethod.prototype.invoke = function (scope, args, fn) {
  var accepts = this.accepts;
  var returns = this.returns;
  var method = this.fn;
  var sharedMethod = this;
  var formattedArgs = [];
  var result;

  // map the given arg data in order they are expected in
  if(accepts) {
    for(var i = 0; i < accepts.length; i++) {
      var desc = accepts[i];
      var name = desc.name || desc.arg;
      var uarg = SharedMethod.convertArg(desc, args[name]);
      var actualType = SharedMethod.getType(uarg);

      // is the arg optional?
      // arg was not provided
      if(actualType === 'undefined') {
        if(desc.required) {
          var err = new Error(name + ' is a required arg');
          err.statusCode = 400;
          return fn(err);
        } else {
          // Add the argument even if it's undefined to stick with the accepts
          formattedArgs.push(undefined);
          continue;
        }
      }

      // convert strings
      if(actualType === 'string' && desc.type !== 'any' && actualType !== desc.type) {
        switch(desc.type) {
          case 'number':
            uarg = Number(uarg);
          break;
          case 'boolean':
            uarg = Boolean(uarg);
          break;
          case 'object':
          case 'array':
            uarg = JSON.parse(uarg);
          break;
        }
      }

      // Add the argument even if it's undefined to stick with the accepts
      formattedArgs.push(uarg);
    }
  }

  // define the callback
  function callback(err) {
    if(err) {
      return fn(err);
    }

    result = SharedMethod.toResult(returns, [].slice.call(arguments, 1));

    debug('- %s - result %j', sharedMethod.name, result);

    fn(null, result);
  }

  // add in the required callback
  formattedArgs.push(callback);

  debug('- %s - invoke with', this.name, formattedArgs);

  // invoke
  return method.apply(scope, formattedArgs);
}

/**
 * Returns an appropriate type based on `val`.
 */

SharedMethod.getType = function (val) {
  var type = typeof val;

  switch (type) {
    case 'undefined':
    case 'boolean':
    case 'number':
    case 'function':
    case 'string':
      return type;
    case 'object':
      // null
      if (val === null) {
        return 'null';
      }

      // buffer
      if (Buffer.isBuffer(val)) {
        return 'buffer';
      }

      // array
      if (Array.isArray(val)) {
        return 'array';
      }

      // date
      if (val instanceof Date) {
        return 'date';
      }

      // object
      return 'object';
  }
};

/**
 * Returns a reformatted Object valid for consumption as remoting function
 * arguments
 */

SharedMethod.convertArg = function(accept, raw) {
  if(accept.http && (accept.http.source === 'req'
    || accept.http.source === 'res'
    || accept.http.source === 'context'
    )) {
    return raw;
  }
  if(raw === null || typeof raw !== 'object') {
    return raw;
  }
  var data = traverse(raw).forEach(function(x) {
    if(x === null || typeof x !== 'object') {
      return x;
    }
    var result = x;
    if(x.$type === 'base64' || x.$type === 'date') {
      switch (x.$type) {
        case 'base64':
          result = new Buffer(x.$data, 'base64');
          break;
        case 'date':
          result = new Date(x.$data);
          break;
      }
      this.update(result);
    }
    return result;
  });
  return data;
};

/**
 * Returns a reformatted Object valid for consumption as JSON from an Array of
 * results from a remoting function, based on `returns`.
 */

SharedMethod.toResult = function(returns, raw) {
  var result = {};

  if (!returns.length) {
    return;
  }

  returns = returns.filter(function (item, index) {
    if (index >= raw.length) {
      return false;
    }

    if (item.root) {
      result = convert(raw[index]);
      return false;
    }

    return true;
  });

  returns.forEach(function (item, index) {
    result[item.name || item.arg] = convert(raw[index]);
  });

  return result;

  function convert(val) {
    switch (SharedMethod.getType(val)) {
      case 'date':
        return {
          $type: 'date',
          $data: val.toString()
        };
      case 'buffer':
        return {
          $type: 'base64',
          $data: val.toString('base64')
        };
    }

    return val;
  }
};

},{"__browserify_Buffer":38,"assert":24,"debug":60,"events":32,"traverse":95,"util":58}],94:[function(require,module,exports){
var process=require("__browserify_process");;!function(exports, undefined) {

  var isArray = Array.isArray ? Array.isArray : function _isArray(obj) {
    return Object.prototype.toString.call(obj) === "[object Array]";
  };
  var defaultMaxListeners = 10;

  function init() {
    this._events = {};
    if (this._conf) {
      configure.call(this, this._conf);
    }
  }

  function configure(conf) {
    if (conf) {

      this._conf = conf;

      conf.delimiter && (this.delimiter = conf.delimiter);
      conf.maxListeners && (this._events.maxListeners = conf.maxListeners);
      conf.wildcard && (this.wildcard = conf.wildcard);
      conf.newListener && (this.newListener = conf.newListener);

      if (this.wildcard) {
        this.listenerTree = {};
      }
    }
  }

  function EventEmitter(conf) {
    this._events = {};
    this.newListener = false;
    configure.call(this, conf);
  }

  //
  // Attention, function return type now is array, always !
  // It has zero elements if no any matches found and one or more
  // elements (leafs) if there are matches
  //
  function searchListenerTree(handlers, type, tree, i) {
    if (!tree) {
      return [];
    }
    var listeners=[], leaf, len, branch, xTree, xxTree, isolatedBranch, endReached,
        typeLength = type.length, currentType = type[i], nextType = type[i+1];
    if (i === typeLength && tree._listeners) {
      //
      // If at the end of the event(s) list and the tree has listeners
      // invoke those listeners.
      //
      if (typeof tree._listeners === 'function') {
        handlers && handlers.push(tree._listeners);
        return [tree];
      } else {
        for (leaf = 0, len = tree._listeners.length; leaf < len; leaf++) {
          handlers && handlers.push(tree._listeners[leaf]);
        }
        return [tree];
      }
    }

    if ((currentType === '*' || currentType === '**') || tree[currentType]) {
      //
      // If the event emitted is '*' at this part
      // or there is a concrete match at this patch
      //
      if (currentType === '*') {
        for (branch in tree) {
          if (branch !== '_listeners' && tree.hasOwnProperty(branch)) {
            listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i+1));
          }
        }
        return listeners;
      } else if(currentType === '**') {
        endReached = (i+1 === typeLength || (i+2 === typeLength && nextType === '*'));
        if(endReached && tree._listeners) {
          // The next element has a _listeners, add it to the handlers.
          listeners = listeners.concat(searchListenerTree(handlers, type, tree, typeLength));
        }

        for (branch in tree) {
          if (branch !== '_listeners' && tree.hasOwnProperty(branch)) {
            if(branch === '*' || branch === '**') {
              if(tree[branch]._listeners && !endReached) {
                listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], typeLength));
              }
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i));
            } else if(branch === nextType) {
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i+2));
            } else {
              // No match on this one, shift into the tree but not in the type array.
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i));
            }
          }
        }
        return listeners;
      }

      listeners = listeners.concat(searchListenerTree(handlers, type, tree[currentType], i+1));
    }

    xTree = tree['*'];
    if (xTree) {
      //
      // If the listener tree will allow any match for this part,
      // then recursively explore all branches of the tree
      //
      searchListenerTree(handlers, type, xTree, i+1);
    }

    xxTree = tree['**'];
    if(xxTree) {
      if(i < typeLength) {
        if(xxTree._listeners) {
          // If we have a listener on a '**', it will catch all, so add its handler.
          searchListenerTree(handlers, type, xxTree, typeLength);
        }

        // Build arrays of matching next branches and others.
        for(branch in xxTree) {
          if(branch !== '_listeners' && xxTree.hasOwnProperty(branch)) {
            if(branch === nextType) {
              // We know the next element will match, so jump twice.
              searchListenerTree(handlers, type, xxTree[branch], i+2);
            } else if(branch === currentType) {
              // Current node matches, move into the tree.
              searchListenerTree(handlers, type, xxTree[branch], i+1);
            } else {
              isolatedBranch = {};
              isolatedBranch[branch] = xxTree[branch];
              searchListenerTree(handlers, type, { '**': isolatedBranch }, i+1);
            }
          }
        }
      } else if(xxTree._listeners) {
        // We have reached the end and still on a '**'
        searchListenerTree(handlers, type, xxTree, typeLength);
      } else if(xxTree['*'] && xxTree['*']._listeners) {
        searchListenerTree(handlers, type, xxTree['*'], typeLength);
      }
    }

    return listeners;
  }

  function growListenerTree(type, listener) {

    type = typeof type === 'string' ? type.split(this.delimiter) : type.slice();

    //
    // Looks for two consecutive '**', if so, don't add the event at all.
    //
    for(var i = 0, len = type.length; i+1 < len; i++) {
      if(type[i] === '**' && type[i+1] === '**') {
        return;
      }
    }

    var tree = this.listenerTree;
    var name = type.shift();

    while (name) {

      if (!tree[name]) {
        tree[name] = {};
      }

      tree = tree[name];

      if (type.length === 0) {

        if (!tree._listeners) {
          tree._listeners = listener;
        }
        else if(typeof tree._listeners === 'function') {
          tree._listeners = [tree._listeners, listener];
        }
        else if (isArray(tree._listeners)) {

          tree._listeners.push(listener);

          if (!tree._listeners.warned) {

            var m = defaultMaxListeners;

            if (typeof this._events.maxListeners !== 'undefined') {
              m = this._events.maxListeners;
            }

            if (m > 0 && tree._listeners.length > m) {

              tree._listeners.warned = true;
              console.error('(node) warning: possible EventEmitter memory ' +
                            'leak detected. %d listeners added. ' +
                            'Use emitter.setMaxListeners() to increase limit.',
                            tree._listeners.length);
              console.trace();
            }
          }
        }
        return true;
      }
      name = type.shift();
    }
    return true;
  }

  // By default EventEmitters will print a warning if more than
  // 10 listeners are added to it. This is a useful default which
  // helps finding memory leaks.
  //
  // Obviously not all Emitters should be limited to 10. This function allows
  // that to be increased. Set to zero for unlimited.

  EventEmitter.prototype.delimiter = '.';

  EventEmitter.prototype.setMaxListeners = function(n) {
    this._events || init.call(this);
    this._events.maxListeners = n;
    if (!this._conf) this._conf = {};
    this._conf.maxListeners = n;
  };

  EventEmitter.prototype.event = '';

  EventEmitter.prototype.once = function(event, fn) {
    this.many(event, 1, fn);
    return this;
  };

  EventEmitter.prototype.many = function(event, ttl, fn) {
    var self = this;

    if (typeof fn !== 'function') {
      throw new Error('many only accepts instances of Function');
    }

    function listener() {
      if (--ttl === 0) {
        self.off(event, listener);
      }
      fn.apply(this, arguments);
    }

    listener._origin = fn;

    this.on(event, listener);

    return self;
  };

  EventEmitter.prototype.emit = function() {

    this._events || init.call(this);

    var type = arguments[0];

    if (type === 'newListener' && !this.newListener) {
      if (!this._events.newListener) { return false; }
    }

    // Loop through the *_all* functions and invoke them.
    if (this._all) {
      var l = arguments.length;
      var args = new Array(l - 1);
      for (var i = 1; i < l; i++) args[i - 1] = arguments[i];
      for (i = 0, l = this._all.length; i < l; i++) {
        this.event = type;
        this._all[i].apply(this, args);
      }
    }

    // If there is no 'error' event listener then throw.
    if (type === 'error') {

      if (!this._all &&
        !this._events.error &&
        !(this.wildcard && this.listenerTree.error)) {

        if (arguments[1] instanceof Error) {
          throw arguments[1]; // Unhandled 'error' event
        } else {
          throw new Error("Uncaught, unspecified 'error' event.");
        }
        return false;
      }
    }

    var handler;

    if(this.wildcard) {
      handler = [];
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      searchListenerTree.call(this, handler, ns, this.listenerTree, 0);
    }
    else {
      handler = this._events[type];
    }

    if (typeof handler === 'function') {
      this.event = type;
      if (arguments.length === 1) {
        handler.call(this);
      }
      else if (arguments.length > 1)
        switch (arguments.length) {
          case 2:
            handler.call(this, arguments[1]);
            break;
          case 3:
            handler.call(this, arguments[1], arguments[2]);
            break;
          // slower
          default:
            var l = arguments.length;
            var args = new Array(l - 1);
            for (var i = 1; i < l; i++) args[i - 1] = arguments[i];
            handler.apply(this, args);
        }
      return true;
    }
    else if (handler) {
      var l = arguments.length;
      var args = new Array(l - 1);
      for (var i = 1; i < l; i++) args[i - 1] = arguments[i];

      var listeners = handler.slice();
      for (var i = 0, l = listeners.length; i < l; i++) {
        this.event = type;
        listeners[i].apply(this, args);
      }
      return (listeners.length > 0) || this._all;
    }
    else {
      return this._all;
    }

  };

  EventEmitter.prototype.on = function(type, listener) {

    if (typeof type === 'function') {
      this.onAny(type);
      return this;
    }

    if (typeof listener !== 'function') {
      throw new Error('on only accepts instances of Function');
    }
    this._events || init.call(this);

    // To avoid recursion in the case that type == "newListeners"! Before
    // adding it to the listeners, first emit "newListeners".
    this.emit('newListener', type, listener);

    if(this.wildcard) {
      growListenerTree.call(this, type, listener);
      return this;
    }

    if (!this._events[type]) {
      // Optimize the case of one listener. Don't need the extra array object.
      this._events[type] = listener;
    }
    else if(typeof this._events[type] === 'function') {
      // Adding the second element, need to change to array.
      this._events[type] = [this._events[type], listener];
    }
    else if (isArray(this._events[type])) {
      // If we've already got an array, just append.
      this._events[type].push(listener);

      // Check for listener leak
      if (!this._events[type].warned) {

        var m = defaultMaxListeners;

        if (typeof this._events.maxListeners !== 'undefined') {
          m = this._events.maxListeners;
        }

        if (m > 0 && this._events[type].length > m) {

          this._events[type].warned = true;
          console.error('(node) warning: possible EventEmitter memory ' +
                        'leak detected. %d listeners added. ' +
                        'Use emitter.setMaxListeners() to increase limit.',
                        this._events[type].length);
          console.trace();
        }
      }
    }
    return this;
  };

  EventEmitter.prototype.onAny = function(fn) {

    if(!this._all) {
      this._all = [];
    }

    if (typeof fn !== 'function') {
      throw new Error('onAny only accepts instances of Function');
    }

    // Add the function to the event listener collection.
    this._all.push(fn);
    return this;
  };

  EventEmitter.prototype.addListener = EventEmitter.prototype.on;

  EventEmitter.prototype.off = function(type, listener) {
    if (typeof listener !== 'function') {
      throw new Error('removeListener only takes instances of Function');
    }

    var handlers,leafs=[];

    if(this.wildcard) {
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      leafs = searchListenerTree.call(this, null, ns, this.listenerTree, 0);
    }
    else {
      // does not use listeners(), so no side effect of creating _events[type]
      if (!this._events[type]) return this;
      handlers = this._events[type];
      leafs.push({_listeners:handlers});
    }

    for (var iLeaf=0; iLeaf<leafs.length; iLeaf++) {
      var leaf = leafs[iLeaf];
      handlers = leaf._listeners;
      if (isArray(handlers)) {

        var position = -1;

        for (var i = 0, length = handlers.length; i < length; i++) {
          if (handlers[i] === listener ||
            (handlers[i].listener && handlers[i].listener === listener) ||
            (handlers[i]._origin && handlers[i]._origin === listener)) {
            position = i;
            break;
          }
        }

        if (position < 0) {
          continue;
        }

        if(this.wildcard) {
          leaf._listeners.splice(position, 1);
        }
        else {
          this._events[type].splice(position, 1);
        }

        if (handlers.length === 0) {
          if(this.wildcard) {
            delete leaf._listeners;
          }
          else {
            delete this._events[type];
          }
        }
        return this;
      }
      else if (handlers === listener ||
        (handlers.listener && handlers.listener === listener) ||
        (handlers._origin && handlers._origin === listener)) {
        if(this.wildcard) {
          delete leaf._listeners;
        }
        else {
          delete this._events[type];
        }
      }
    }

    return this;
  };

  EventEmitter.prototype.offAny = function(fn) {
    var i = 0, l = 0, fns;
    if (fn && this._all && this._all.length > 0) {
      fns = this._all;
      for(i = 0, l = fns.length; i < l; i++) {
        if(fn === fns[i]) {
          fns.splice(i, 1);
          return this;
        }
      }
    } else {
      this._all = [];
    }
    return this;
  };

  EventEmitter.prototype.removeListener = EventEmitter.prototype.off;

  EventEmitter.prototype.removeAllListeners = function(type) {
    if (arguments.length === 0) {
      !this._events || init.call(this);
      return this;
    }

    if(this.wildcard) {
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      var leafs = searchListenerTree.call(this, null, ns, this.listenerTree, 0);

      for (var iLeaf=0; iLeaf<leafs.length; iLeaf++) {
        var leaf = leafs[iLeaf];
        leaf._listeners = null;
      }
    }
    else {
      if (!this._events[type]) return this;
      this._events[type] = null;
    }
    return this;
  };

  EventEmitter.prototype.listeners = function(type) {
    if(this.wildcard) {
      var handlers = [];
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      searchListenerTree.call(this, handlers, ns, this.listenerTree, 0);
      return handlers;
    }

    this._events || init.call(this);

    if (!this._events[type]) this._events[type] = [];
    if (!isArray(this._events[type])) {
      this._events[type] = [this._events[type]];
    }
    return this._events[type];
  };

  EventEmitter.prototype.listenersAny = function() {

    if(this._all) {
      return this._all;
    }
    else {
      return [];
    }

  };

  if (typeof define === 'function' && define.amd) {
    define(function() {
      return EventEmitter;
    });
  } else {
    exports.EventEmitter2 = EventEmitter;
  }

}(typeof process !== 'undefined' && typeof process.title !== 'undefined' && typeof exports !== 'undefined' ? exports : window);

},{"__browserify_process":39}],95:[function(require,module,exports){
module.exports=require(87)
},{}],96:[function(require,module,exports){
/**
 * Module dependencies
 */

var crypto = require('crypto');

/**
 * 62 characters in the ascii range that can be used in URLs without special
 * encoding.
 */
var UIDCHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Make a Buffer into a string ready for use in URLs
 *
 * @param {String}
 * @returns {String}
 * @api private
 */
function tostr(bytes) {
  var chars, r, i;

  r = [];
  for (i = 0; i < bytes.length; i++) {
    r.push(UIDCHARS[bytes[i] % UIDCHARS.length]);
  }

  return r.join('');
}

/**
 * Generate an Unique Id
 *
 * @param {Number} length  The number of chars of the uid
 * @param {Number} cb (optional)  Callback for async uid generation
 * @api public
 */

function uid(length, cb) {

  if (typeof cb === 'undefined') {
    return tostr(crypto.pseudoRandomBytes(length));
  } else {
    crypto.pseudoRandomBytes(length, function(err, bytes) {
       if (err) return cb(err);
       cb(null, tostr(bytes));
    })
  }
}

/**
 * Exports
 */

module.exports = uid;

},{"crypto":27}],97:[function(require,module,exports){
//  Underscore.string
//  (c) 2010 Esa-Matti Suuronen <esa-matti aet suuronen dot org>
//  Underscore.string is freely distributable under the terms of the MIT license.
//  Documentation: https://github.com/epeli/underscore.string
//  Some code is borrowed from MooTools and Alexandru Marasteanu.
//  Version '2.3.2'

!function(root, String){
  'use strict';

  // Defining helper functions.

  var nativeTrim = String.prototype.trim;
  var nativeTrimRight = String.prototype.trimRight;
  var nativeTrimLeft = String.prototype.trimLeft;

  var parseNumber = function(source) { return source * 1 || 0; };

  var strRepeat = function(str, qty){
    if (qty < 1) return '';
    var result = '';
    while (qty > 0) {
      if (qty & 1) result += str;
      qty >>= 1, str += str;
    }
    return result;
  };

  var slice = [].slice;

  var defaultToWhiteSpace = function(characters) {
    if (characters == null)
      return '\\s';
    else if (characters.source)
      return characters.source;
    else
      return '[' + _s.escapeRegExp(characters) + ']';
  };

  // Helper for toBoolean
  function boolMatch(s, matchers) {
    var i, matcher, down = s.toLowerCase();
    matchers = [].concat(matchers);
    for (i = 0; i < matchers.length; i += 1) {
      matcher = matchers[i];
      if (!matcher) continue;
      if (matcher.test && matcher.test(s)) return true;
      if (matcher.toLowerCase() === down) return true;
    }
  }

  var escapeChars = {
    lt: '<',
    gt: '>',
    quot: '"',
    amp: '&',
    apos: "'"
  };

  var reversedEscapeChars = {};
  for(var key in escapeChars) reversedEscapeChars[escapeChars[key]] = key;
  reversedEscapeChars["'"] = '#39';

  // sprintf() for JavaScript 0.7-beta1
  // http://www.diveintojavascript.com/projects/javascript-sprintf
  //
  // Copyright (c) Alexandru Marasteanu <alexaholic [at) gmail (dot] com>
  // All rights reserved.

  var sprintf = (function() {
    function get_type(variable) {
      return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase();
    }

    var str_repeat = strRepeat;

    var str_format = function() {
      if (!str_format.cache.hasOwnProperty(arguments[0])) {
        str_format.cache[arguments[0]] = str_format.parse(arguments[0]);
      }
      return str_format.format.call(null, str_format.cache[arguments[0]], arguments);
    };

    str_format.format = function(parse_tree, argv) {
      var cursor = 1, tree_length = parse_tree.length, node_type = '', arg, output = [], i, k, match, pad, pad_character, pad_length;
      for (i = 0; i < tree_length; i++) {
        node_type = get_type(parse_tree[i]);
        if (node_type === 'string') {
          output.push(parse_tree[i]);
        }
        else if (node_type === 'array') {
          match = parse_tree[i]; // convenience purposes only
          if (match[2]) { // keyword argument
            arg = argv[cursor];
            for (k = 0; k < match[2].length; k++) {
              if (!arg.hasOwnProperty(match[2][k])) {
                throw new Error(sprintf('[_.sprintf] property "%s" does not exist', match[2][k]));
              }
              arg = arg[match[2][k]];
            }
          } else if (match[1]) { // positional argument (explicit)
            arg = argv[match[1]];
          }
          else { // positional argument (implicit)
            arg = argv[cursor++];
          }

          if (/[^s]/.test(match[8]) && (get_type(arg) != 'number')) {
            throw new Error(sprintf('[_.sprintf] expecting number but found %s', get_type(arg)));
          }
          switch (match[8]) {
            case 'b': arg = arg.toString(2); break;
            case 'c': arg = String.fromCharCode(arg); break;
            case 'd': arg = parseInt(arg, 10); break;
            case 'e': arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential(); break;
            case 'f': arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg); break;
            case 'o': arg = arg.toString(8); break;
            case 's': arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg); break;
            case 'u': arg = Math.abs(arg); break;
            case 'x': arg = arg.toString(16); break;
            case 'X': arg = arg.toString(16).toUpperCase(); break;
          }
          arg = (/[def]/.test(match[8]) && match[3] && arg >= 0 ? '+'+ arg : arg);
          pad_character = match[4] ? match[4] == '0' ? '0' : match[4].charAt(1) : ' ';
          pad_length = match[6] - String(arg).length;
          pad = match[6] ? str_repeat(pad_character, pad_length) : '';
          output.push(match[5] ? arg + pad : pad + arg);
        }
      }
      return output.join('');
    };

    str_format.cache = {};

    str_format.parse = function(fmt) {
      var _fmt = fmt, match = [], parse_tree = [], arg_names = 0;
      while (_fmt) {
        if ((match = /^[^\x25]+/.exec(_fmt)) !== null) {
          parse_tree.push(match[0]);
        }
        else if ((match = /^\x25{2}/.exec(_fmt)) !== null) {
          parse_tree.push('%');
        }
        else if ((match = /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(_fmt)) !== null) {
          if (match[2]) {
            arg_names |= 1;
            var field_list = [], replacement_field = match[2], field_match = [];
            if ((field_match = /^([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
              field_list.push(field_match[1]);
              while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
                if ((field_match = /^\.([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
                  field_list.push(field_match[1]);
                }
                else if ((field_match = /^\[(\d+)\]/.exec(replacement_field)) !== null) {
                  field_list.push(field_match[1]);
                }
                else {
                  throw new Error('[_.sprintf] huh?');
                }
              }
            }
            else {
              throw new Error('[_.sprintf] huh?');
            }
            match[2] = field_list;
          }
          else {
            arg_names |= 2;
          }
          if (arg_names === 3) {
            throw new Error('[_.sprintf] mixing positional and named placeholders is not (yet) supported');
          }
          parse_tree.push(match);
        }
        else {
          throw new Error('[_.sprintf] huh?');
        }
        _fmt = _fmt.substring(match[0].length);
      }
      return parse_tree;
    };

    return str_format;
  })();



  // Defining underscore.string

  var _s = {

    VERSION: '2.3.0',

    isBlank: function(str){
      if (str == null) str = '';
      return (/^\s*$/).test(str);
    },

    stripTags: function(str){
      if (str == null) return '';
      return String(str).replace(/<\/?[^>]+>/g, '');
    },

    capitalize : function(str){
      str = str == null ? '' : String(str);
      return str.charAt(0).toUpperCase() + str.slice(1);
    },

    chop: function(str, step){
      if (str == null) return [];
      str = String(str);
      step = ~~step;
      return step > 0 ? str.match(new RegExp('.{1,' + step + '}', 'g')) : [str];
    },

    clean: function(str){
      return _s.strip(str).replace(/\s+/g, ' ');
    },

    count: function(str, substr){
      if (str == null || substr == null) return 0;

      str = String(str);
      substr = String(substr);

      var count = 0,
        pos = 0,
        length = substr.length;

      while (true) {
        pos = str.indexOf(substr, pos);
        if (pos === -1) break;
        count++;
        pos += length;
      }

      return count;
    },

    chars: function(str) {
      if (str == null) return [];
      return String(str).split('');
    },

    swapCase: function(str) {
      if (str == null) return '';
      return String(str).replace(/\S/g, function(c){
        return c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase();
      });
    },

    escapeHTML: function(str) {
      if (str == null) return '';
      return String(str).replace(/[&<>"']/g, function(m){ return '&' + reversedEscapeChars[m] + ';'; });
    },

    unescapeHTML: function(str) {
      if (str == null) return '';
      return String(str).replace(/\&([^;]+);/g, function(entity, entityCode){
        var match;

        if (entityCode in escapeChars) {
          return escapeChars[entityCode];
        } else if (match = entityCode.match(/^#x([\da-fA-F]+)$/)) {
          return String.fromCharCode(parseInt(match[1], 16));
        } else if (match = entityCode.match(/^#(\d+)$/)) {
          return String.fromCharCode(~~match[1]);
        } else {
          return entity;
        }
      });
    },

    escapeRegExp: function(str){
      if (str == null) return '';
      return String(str).replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
    },

    splice: function(str, i, howmany, substr){
      var arr = _s.chars(str);
      arr.splice(~~i, ~~howmany, substr);
      return arr.join('');
    },

    insert: function(str, i, substr){
      return _s.splice(str, i, 0, substr);
    },

    include: function(str, needle){
      if (needle === '') return true;
      if (str == null) return false;
      return String(str).indexOf(needle) !== -1;
    },

    join: function() {
      var args = slice.call(arguments),
        separator = args.shift();

      if (separator == null) separator = '';

      return args.join(separator);
    },

    lines: function(str) {
      if (str == null) return [];
      return String(str).split("\n");
    },

    reverse: function(str){
      return _s.chars(str).reverse().join('');
    },

    startsWith: function(str, starts){
      if (starts === '') return true;
      if (str == null || starts == null) return false;
      str = String(str); starts = String(starts);
      return str.length >= starts.length && str.slice(0, starts.length) === starts;
    },

    endsWith: function(str, ends){
      if (ends === '') return true;
      if (str == null || ends == null) return false;
      str = String(str); ends = String(ends);
      return str.length >= ends.length && str.slice(str.length - ends.length) === ends;
    },

    succ: function(str){
      if (str == null) return '';
      str = String(str);
      return str.slice(0, -1) + String.fromCharCode(str.charCodeAt(str.length-1) + 1);
    },

    titleize: function(str){
      if (str == null) return '';
      str  = String(str).toLowerCase();
      return str.replace(/(?:^|\s|-)\S/g, function(c){ return c.toUpperCase(); });
    },

    camelize: function(str){
      return _s.trim(str).replace(/[-_\s]+(.)?/g, function(match, c){ return c ? c.toUpperCase() : ""; });
    },

    underscored: function(str){
      return _s.trim(str).replace(/([a-z\d])([A-Z]+)/g, '$1_$2').replace(/[-\s]+/g, '_').toLowerCase();
    },

    dasherize: function(str){
      return _s.trim(str).replace(/([A-Z])/g, '-$1').replace(/[-_\s]+/g, '-').toLowerCase();
    },

    classify: function(str){
      return _s.titleize(String(str).replace(/[\W_]/g, ' ')).replace(/\s/g, '');
    },

    humanize: function(str){
      return _s.capitalize(_s.underscored(str).replace(/_id$/,'').replace(/_/g, ' '));
    },

    trim: function(str, characters){
      if (str == null) return '';
      if (!characters && nativeTrim) return nativeTrim.call(str);
      characters = defaultToWhiteSpace(characters);
      return String(str).replace(new RegExp('\^' + characters + '+|' + characters + '+$', 'g'), '');
    },

    ltrim: function(str, characters){
      if (str == null) return '';
      if (!characters && nativeTrimLeft) return nativeTrimLeft.call(str);
      characters = defaultToWhiteSpace(characters);
      return String(str).replace(new RegExp('^' + characters + '+'), '');
    },

    rtrim: function(str, characters){
      if (str == null) return '';
      if (!characters && nativeTrimRight) return nativeTrimRight.call(str);
      characters = defaultToWhiteSpace(characters);
      return String(str).replace(new RegExp(characters + '+$'), '');
    },

    truncate: function(str, length, truncateStr){
      if (str == null) return '';
      str = String(str); truncateStr = truncateStr || '...';
      length = ~~length;
      return str.length > length ? str.slice(0, length) + truncateStr : str;
    },

    /**
     * _s.prune: a more elegant version of truncate
     * prune extra chars, never leaving a half-chopped word.
     * @author github.com/rwz
     */
    prune: function(str, length, pruneStr){
      if (str == null) return '';

      str = String(str); length = ~~length;
      pruneStr = pruneStr != null ? String(pruneStr) : '...';

      if (str.length <= length) return str;

      var tmpl = function(c){ return c.toUpperCase() !== c.toLowerCase() ? 'A' : ' '; },
        template = str.slice(0, length+1).replace(/.(?=\W*\w*$)/g, tmpl); // 'Hello, world' -> 'HellAA AAAAA'

      if (template.slice(template.length-2).match(/\w\w/))
        template = template.replace(/\s*\S+$/, '');
      else
        template = _s.rtrim(template.slice(0, template.length-1));

      return (template+pruneStr).length > str.length ? str : str.slice(0, template.length)+pruneStr;
    },

    words: function(str, delimiter) {
      if (_s.isBlank(str)) return [];
      return _s.trim(str, delimiter).split(delimiter || /\s+/);
    },

    pad: function(str, length, padStr, type) {
      str = str == null ? '' : String(str);
      length = ~~length;

      var padlen  = 0;

      if (!padStr)
        padStr = ' ';
      else if (padStr.length > 1)
        padStr = padStr.charAt(0);

      switch(type) {
        case 'right':
          padlen = length - str.length;
          return str + strRepeat(padStr, padlen);
        case 'both':
          padlen = length - str.length;
          return strRepeat(padStr, Math.ceil(padlen/2)) + str
                  + strRepeat(padStr, Math.floor(padlen/2));
        default: // 'left'
          padlen = length - str.length;
          return strRepeat(padStr, padlen) + str;
        }
    },

    lpad: function(str, length, padStr) {
      return _s.pad(str, length, padStr);
    },

    rpad: function(str, length, padStr) {
      return _s.pad(str, length, padStr, 'right');
    },

    lrpad: function(str, length, padStr) {
      return _s.pad(str, length, padStr, 'both');
    },

    sprintf: sprintf,

    vsprintf: function(fmt, argv){
      argv.unshift(fmt);
      return sprintf.apply(null, argv);
    },

    toNumber: function(str, decimals) {
      if (!str) return 0;
      str = _s.trim(str);
      if (!str.match(/^-?\d+(?:\.\d+)?$/)) return NaN;
      return parseNumber(parseNumber(str).toFixed(~~decimals));
    },

    numberFormat : function(number, dec, dsep, tsep) {
      if (isNaN(number) || number == null) return '';

      number = number.toFixed(~~dec);
      tsep = typeof tsep == 'string' ? tsep : ',';

      var parts = number.split('.'), fnums = parts[0],
        decimals = parts[1] ? (dsep || '.') + parts[1] : '';

      return fnums.replace(/(\d)(?=(?:\d{3})+$)/g, '$1' + tsep) + decimals;
    },

    strRight: function(str, sep){
      if (str == null) return '';
      str = String(str); sep = sep != null ? String(sep) : sep;
      var pos = !sep ? -1 : str.indexOf(sep);
      return ~pos ? str.slice(pos+sep.length, str.length) : str;
    },

    strRightBack: function(str, sep){
      if (str == null) return '';
      str = String(str); sep = sep != null ? String(sep) : sep;
      var pos = !sep ? -1 : str.lastIndexOf(sep);
      return ~pos ? str.slice(pos+sep.length, str.length) : str;
    },

    strLeft: function(str, sep){
      if (str == null) return '';
      str = String(str); sep = sep != null ? String(sep) : sep;
      var pos = !sep ? -1 : str.indexOf(sep);
      return ~pos ? str.slice(0, pos) : str;
    },

    strLeftBack: function(str, sep){
      if (str == null) return '';
      str += ''; sep = sep != null ? ''+sep : sep;
      var pos = str.lastIndexOf(sep);
      return ~pos ? str.slice(0, pos) : str;
    },

    toSentence: function(array, separator, lastSeparator, serial) {
      separator = separator || ', ';
      lastSeparator = lastSeparator || ' and ';
      var a = array.slice(), lastMember = a.pop();

      if (array.length > 2 && serial) lastSeparator = _s.rtrim(separator) + lastSeparator;

      return a.length ? a.join(separator) + lastSeparator + lastMember : lastMember;
    },

    toSentenceSerial: function() {
      var args = slice.call(arguments);
      args[3] = true;
      return _s.toSentence.apply(_s, args);
    },

    slugify: function(str) {
      if (str == null) return '';

      var from  = "ąàáäâãåæăćęèéëêìíïîłńòóöôõøśșțùúüûñçżź",
          to    = "aaaaaaaaaceeeeeiiiilnoooooosstuuuunczz",
          regex = new RegExp(defaultToWhiteSpace(from), 'g');

      str = String(str).toLowerCase().replace(regex, function(c){
        var index = from.indexOf(c);
        return to.charAt(index) || '-';
      });

      return _s.dasherize(str.replace(/[^\w\s-]/g, ''));
    },

    surround: function(str, wrapper) {
      return [wrapper, str, wrapper].join('');
    },

    quote: function(str, quoteChar) {
      return _s.surround(str, quoteChar || '"');
    },

    unquote: function(str, quoteChar) {
      quoteChar = quoteChar || '"';
      if (str[0] === quoteChar && str[str.length-1] === quoteChar)
        return str.slice(1,str.length-1);
      else return str;
    },

    exports: function() {
      var result = {};

      for (var prop in this) {
        if (!this.hasOwnProperty(prop) || prop.match(/^(?:include|contains|reverse)$/)) continue;
        result[prop] = this[prop];
      }

      return result;
    },

    repeat: function(str, qty, separator){
      if (str == null) return '';

      qty = ~~qty;

      // using faster implementation if separator is not needed;
      if (separator == null) return strRepeat(String(str), qty);

      // this one is about 300x slower in Google Chrome
      for (var repeat = []; qty > 0; repeat[--qty] = str) {}
      return repeat.join(separator);
    },

    naturalCmp: function(str1, str2){
      if (str1 == str2) return 0;
      if (!str1) return -1;
      if (!str2) return 1;

      var cmpRegex = /(\.\d+)|(\d+)|(\D+)/g,
        tokens1 = String(str1).toLowerCase().match(cmpRegex),
        tokens2 = String(str2).toLowerCase().match(cmpRegex),
        count = Math.min(tokens1.length, tokens2.length);

      for(var i = 0; i < count; i++) {
        var a = tokens1[i], b = tokens2[i];

        if (a !== b){
          var num1 = parseInt(a, 10);
          if (!isNaN(num1)){
            var num2 = parseInt(b, 10);
            if (!isNaN(num2) && num1 - num2)
              return num1 - num2;
          }
          return a < b ? -1 : 1;
        }
      }

      if (tokens1.length === tokens2.length)
        return tokens1.length - tokens2.length;

      return str1 < str2 ? -1 : 1;
    },

    levenshtein: function(str1, str2) {
      if (str1 == null && str2 == null) return 0;
      if (str1 == null) return String(str2).length;
      if (str2 == null) return String(str1).length;

      str1 = String(str1); str2 = String(str2);

      var current = [], prev, value;

      for (var i = 0; i <= str2.length; i++)
        for (var j = 0; j <= str1.length; j++) {
          if (i && j)
            if (str1.charAt(j - 1) === str2.charAt(i - 1))
              value = prev;
            else
              value = Math.min(current[j], current[j - 1], prev) + 1;
          else
            value = i + j;

          prev = current[j];
          current[j] = value;
        }

      return current.pop();
    },

    toBoolean: function(str, trueValues, falseValues) {
      if (typeof str === "number") str = "" + str;
      if (typeof str !== "string") return !!str;
      str = _s.trim(str);
      if (boolMatch(str, trueValues || ["true", "1"])) return true;
      if (boolMatch(str, falseValues || ["false", "0"])) return false;
    }
  };

  // Aliases

  _s.strip    = _s.trim;
  _s.lstrip   = _s.ltrim;
  _s.rstrip   = _s.rtrim;
  _s.center   = _s.lrpad;
  _s.rjust    = _s.lpad;
  _s.ljust    = _s.rpad;
  _s.contains = _s.include;
  _s.q        = _s.quote;
  _s.toBool   = _s.toBoolean;

  // Exporting

  // CommonJS module is defined
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports)
      module.exports = _s;

    exports._s = _s;
  }

  // Register as a named module with AMD.
  if (typeof define === 'function' && define.amd)
    define('underscore.string', [], function(){ return _s; });


  // Integrate with Underscore.js if defined
  // or create our own underscore object.
  root._ = root._ || {};
  root._.string = root._.str = _s;
}(this, String);

},{}],98:[function(require,module,exports){
module.exports={
  "name": "loopback",
  "description": "LoopBack: Open Mobile Platform for Node.js",
  "keywords": [
    "StrongLoop",
    "LoopBack",
    "Mobile",
    "Backend",
    "Platform",
    "mBaaS"
  ],
  "version": "1.6.1",
  "scripts": {
    "test": "mocha -R spec",
    "build-js": "mkdir -p dist && ./node_modules/.bin/browserify index.js -s loopback -o dist/loopback.js --ignore passport --ignore ./lib-cov/express --ignore ./lib-cov/connect --ignore nodemailer",
    "watch-js": "mkdir -p dist && ./node_modules/.bin/watchify index.js -s loopback -o dist/loopback.js",
    "uglify": "./node_modules/.bin/uglifyjs dist/loopback.js -mc > dist/loopback.min.js",
    "build": "npm run build-js && npm run uglify"
  },
  "dependencies": {
    "debug": "~0.7.2",
    "express": "~3.4.0",
    "strong-remoting": "~1.2.1",
    "inflection": "~1.2.5",
    "passport": "~0.1.17",
    "passport-local": "~0.1.6",
    "nodemailer": "~0.5.7",
    "ejs": "~0.8.4",
    "bcryptjs": "~0.7.10",
    "underscore.string": "~2.3.3",
    "underscore": "~1.5.2",
    "uid2": "0.0.3",
    "async": "~0.2.9",
    "canonical-json": "0.0.3",
    "browser-request": "~0.3.1"
  },
  "peerDependencies": {
    "loopback-datasource-juggler": "~1.2.13"
  },
  "devDependencies": {
    "loopback-datasource-juggler": "~1.2.13",
    "mocha": "~1.14.0",
    "strong-task-emitter": "0.0.x",
    "supertest": "~0.8.1",
    "chai": "~1.8.1",
    "loopback-testing": "~0.1.0",
    "watchify": "~0.4.1",
    "uglify-js": "~2.4.6",
    "jshint": "~2.3.0",
    "browserify": "~3.14.1",
    "grunt": "~0.4.2",
    "grunt-browserify": "~1.3.0",
    "grunt-mocha-selenium": "~0.7.0",
    "grunt-contrib-uglify": "~0.3.2",
    "grunt-contrib-jshint": "~0.8.0",
    "grunt-contrib-watch": "~0.5.3"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/strongloop/loopback"
  },
  "license": "MIT",
  "browser": {
    "express": "./lib/browser-express.js",
    "connect": false,
    "passport": false,
    "passport-local": false
  }
}

},{}]},{},[1])
(1)
});