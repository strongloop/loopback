/**
 * Module dependencies.
 */

var DataSource = require('loopback-datasource-juggler').DataSource
  , ModelBuilder = require('loopback-datasource-juggler').ModelBuilder
  , assert = require('assert')
  , fs = require('fs')
  , RemoteObjects = require('strong-remoting')
  , swagger = require('strong-remoting/ext/swagger')
  , stringUtils = require('underscore.string')
  , path = require('path');

/**
 * Export the app prototype.
 */

var app = exports = module.exports = {};

/**
 * Create a set of remote objects.
 */

app.remotes = function () {
  if(this._remotes) {
    return this._remotes;
  } else {
    return (this._remotes = RemoteObjects.create());
  }
}

/**
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
 * App models.
 */

app._models = [];

/**
 * Expose a model.
 *
 * @param Model {Model}
 */

app.model = function (Model, config) {
  if(arguments.length === 1) {
    assert(typeof Model === 'function', 'app.model(Model) => Model must be a function / constructor');
    this.remotes().exports[Model.pluralModelName] = Model;
    this._models.push(Model);
    Model.shared = true;
    Model.app = this;
    Model.emit('attached', this);
    return;
  }
  var modelName = Model;
  assert(typeof modelName === 'string', 'app.model(name, properties, options) => name must be a string');

  Model =
  this.models[modelName] =
  this.models[classify(modelName)] =
  this.models[camelize(modelName)] = modelFromConfig(modelName, config, this);

  this.model(Model);

  return Model;
}

/**
 * Get all exposed models.
 */

app.models = function () {
  return this._models;
}

/**
 * Define a DataSource.
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
      result[ModelCtor.pluralModelName] = ModelCtor;
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
 * Enable documentation
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
 * Initialize the app using JSON and JavaScript files.
 *
 * @throws {Error} If config is not valid
 * @throws {Error} If boot fails
 */

app.boot = function(options) {
  var app = this;
  options = options || {};
  var cwd = options.cwd = options.cwd || process.cwd();
  var ctx = {};
  var appConfig = options.app;
  var modelConfig = options.models;
  var dataSourceConfig = options.dataSources;

  if(!appConfig) {
    appConfig = tryReadConfig(cwd, 'app') || {};
  }
  if(!modelConfig) {
    modelConfig = tryReadConfig(cwd, 'models') || {};
  }
  if(!dataSourceConfig) {
    dataSourceConfig = tryReadConfig(cwd, 'datasources') || {};
  }

  assertIsValidConfig('app', appConfig);
  assertIsValidConfig('model', modelConfig);
  assertIsValidConfig('data source', dataSourceConfig);

  if(appConfig.host !== undefined) {
    assert(typeof appConfig.host === 'string', 'app.host must be a string');
    app.set('host', appConfig.host);
  }

  if(appConfig.port !== undefined) {
    var portType = typeof appConfig.port;
    assert(portType === 'string' || portType === 'number', 'app.port must be a string or number');
    app.set('port', appConfig.port);
  }

  // instantiate data sources
  forEachKeyedObject(dataSourceConfig, function(key, obj) {
    app.dataSource(key, obj);
  });

  // instantiate models
  forEachKeyedObject(modelConfig, function(key, obj) {
    app.model(key, obj);
  });

  // require directories
  var requiredModels = requireDir(path.join(cwd, 'models'));
  var requiredDataSources = requireDir(path.join(cwd, 'datasources'));
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

function requireDirAs(type, dir) {
  return requireDir(dir);
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

