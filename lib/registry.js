var assert = require('assert');
var extend = require('util')._extend;
var juggler = require('loopback-datasource-juggler');
var debug = require('debug')('loopback:registry');
var DataSource = juggler.DataSource;
var ModelBuilder = juggler.ModelBuilder;

module.exports = Registry;

/**
 * Define and reference `Models` and `DataSources`.
 *
 * @class
 */

function Registry() {
  this.defaultDataSources = {};
  this.modelBuilder = new ModelBuilder();
  require('./model')(this);
  require('./persisted-model')(this);

  // Set the default model base class.
  this.modelBuilder.defaultModelBaseClass = this.getModel('Model');
}

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

Registry.prototype.createModel = function(name, properties, options) {

  if (arguments.length === 1 && typeof name === 'object') {
    var config = name;
    name = config.name;
    properties = config.properties;
    options = buildModelOptionsFromConfig(config);

    assert(typeof name === 'string',
      'The model-config property `name` must be a string');
  }

  options = options || {};
  var BaseModel = options.base || options.super;

  if (typeof BaseModel === 'string') {
    var baseName = BaseModel;
    BaseModel = this.getModel(BaseModel);

    if (BaseModel === undefined) {
      if (baseName === 'DataModel') {
        console.warn('Model `%s` is extending deprecated `DataModel. ' +
          'Use `PersistedModel` instead.', name);
        BaseModel = this.getModel('PersistedModel');
      } else {
        console.warn('Model `%s` is extending an unknown model `%s`. ' +
          'Using `PersistedModel` as the base.', name, baseName);
      }
    }
  }

  BaseModel = BaseModel || this.getModel('PersistedModel');
  var model = BaseModel.extend(name, properties, options);
  model.registry = this;

  this._defineRemoteMethods(model, options.methods);

  // try to attach
  try {
    this.autoAttachModel(model);
  } catch (e) {}

  return model;
};

function buildModelOptionsFromConfig(config) {
  var options = extend({}, config.options);
  for (var key in config) {
    if (['name', 'properties', 'options'].indexOf(key) !== -1) {
      // Skip items which have special meaning
      continue;
    }

    if (options[key] !== undefined) {
      // When both `config.key` and `config.options.key` are set,
      // use the latter one
      continue;
    }

    options[key] = config[key];
  }
  return options;
}

/*
 * Add the acl entry to the acls
 * @param {Object[]} acls
 * @param {Object} acl
 */
function addACL(acls, acl) {
  for (var i = 0, n = acls.length; i < n; i++) {
    // Check if there is a matching acl to be overriden
    if (acls[i].property === acl.property &&
      acls[i].accessType === acl.accessType &&
      acls[i].principalType === acl.principalType &&
      acls[i].principalId === acl.principalId) {
      acls[i] = acl;
      return;
    }
  }
  acls.push(acl);
}

/**
 * Alter an existing Model class.
 * @param {Model} ModelCtor The model constructor to alter.
 * @options {Object} config Additional configuration to apply
 * @property {DataSource} dataSource Attach the model to a dataSource.
 * @property {Object} [relations] Model relations to add/update.
 *
 * @header loopback.configureModel(ModelCtor, config)
 */

Registry.prototype.configureModel = function(ModelCtor, config) {
  var settings = ModelCtor.settings;
  var modelName = ModelCtor.modelName;

  // Relations
  if (typeof config.relations === 'object' && config.relations !== null) {
    var relations = settings.relations = settings.relations || {};
    Object.keys(config.relations).forEach(function(key) {
      // FIXME: [rfeng] We probably should check if the relation exists
      relations[key] = extend(relations[key] || {}, config.relations[key]);
    });
  } else if (config.relations != null) {
    console.warn('The relations property of `%s` configuration ' +
      'must be an object', modelName);
  }

  // ACLs
  if (Array.isArray(config.acls)) {
    var acls = settings.acls = settings.acls || [];
    config.acls.forEach(function(acl) {
      addACL(acls, acl);
    });
  } else if (config.acls != null) {
    console.warn('The acls property of `%s` configuration ' +
      'must be an array of objects', modelName);
  }

  // Settings
  var excludedProperties = {
    base: true,
    'super': true,
    relations: true,
    acls: true,
    dataSource: true
  };
  if (typeof config.options === 'object' && config.options !== null) {
    for (var p in config.options) {
      if (!(p in excludedProperties)) {
        settings[p] = config.options[p];
      } else {
        console.warn('Property `%s` cannot be reconfigured for `%s`',
          p, modelName);
      }
    }
  } else if (config.options != null) {
    console.warn('The options property of `%s` configuration ' +
      'must be an object', modelName);
  }

  // It's important to attach the datasource after we have updated
  // configuration, so that the datasource picks up updated relations
  if (config.dataSource) {
    assert(config.dataSource instanceof DataSource,
        'Cannot configure ' + ModelCtor.modelName +
        ': config.dataSource must be an instance of DataSource');
    ModelCtor.attachTo(config.dataSource);
    debug('Attached model `%s` to dataSource `%s`',
      modelName, config.dataSource.name);
  } else if (config.dataSource === null || config.dataSource === false) {
    debug('Model `%s` is not attached to any DataSource by configuration.',
      modelName);
  } else {
    debug('Model `%s` is not attached to any DataSource, possibly by a mistake.',
      modelName);
    console.warn(
      'The configuration of `%s` is missing `dataSource` property.\n' +
      'Use `null` or `false` to mark models not attached to any data source.',
      modelName);
  }

  // Remote methods
  this._defineRemoteMethods(ModelCtor, config.methods);
};

Registry.prototype._defineRemoteMethods = function(ModelCtor, methods) {
  if (!methods) return;
  if (typeof methods !== 'object') {
    console.warn('Ignoring non-object "methods" setting of "%s".',
      ModelCtor.modelName);
    return;
  }

  Object.keys(methods).forEach(function(key) {
    var meta = methods[key];
    if (typeof meta.isStatic !== 'boolean') {
      console.warn('Remoting metadata for "%s.%s" is missing "isStatic" ' +
        'flag, the method is registered as an instance method.',
        ModelCtor.modelName,
        key);
      console.warn('This behaviour may change in the next major version.');
    }
    ModelCtor.remoteMethod(key, meta);
  });
};

/**
 * Look up a model class by name from all models created by
 * `loopback.createModel()`
 * @param {String|Function} modelOrName The model name or a `Model` constructor.
 * @returns {Model} The model class
 *
 * @header loopback.findModel(modelName)
 */
Registry.prototype.findModel = function(modelName) {
  if (typeof modelType === 'function') return modelName;
  return this.modelBuilder.models[modelName];
};

/**
 * Look up a model class by name from all models created by
 * `loopback.createModel()`. **Throw an error when no such model exists.**
 *
 * @param {String} modelOrName The model name or a `Model` constructor.
 * @returns {Model} The model class
 *
 * @header loopback.getModel(modelName)
 */
Registry.prototype.getModel = function(modelName) {
  var model = this.findModel(modelName);
  if (model) return model;

  throw new Error('Model not found: ' + modelName);
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
Registry.prototype.getModelByType = function(modelType) {
  var type = typeof modelType;
  var accepted = ['function', 'string'];

  assert(accepted.indexOf(type) > -1,
    'The model type must be a constructor or model name');

  if (type === 'string') {
    modelType = this.getModel(modelType);
  }

  var models = this.modelBuilder.models;
  for (var m in models) {
    if (models[m].prototype instanceof modelType) {
      return models[m];
    }
  }
  return modelType;
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

Registry.prototype.createDataSource = function(name, options) {
  var self = this;

  var ds = new DataSource(name, options, self.modelBuilder);
  ds.createModel = function(name, properties, settings) {
    settings = settings || {};
    var BaseModel = settings.base || settings.super;
    if (!BaseModel) {
      // Check the connector types
      var connectorTypes = ds.getTypes();
      if (Array.isArray(connectorTypes) && connectorTypes.indexOf('db') !== -1) {
        // Only set up the base model to PersistedModel if the connector is DB
        BaseModel = self.PersistedModel;
      } else {
        BaseModel = self.Model;
      }
      settings.base = BaseModel;
    }
    var ModelCtor = self.createModel(name, properties, settings);
    ModelCtor.attachTo(ds);
    return ModelCtor;
  };

  if (ds.settings && ds.settings.defaultForType) {
    this.setDefaultDataSourceForType(ds.settings.defaultForType, ds);
  }

  return ds;
};

/**
 * Get an in-memory data source. Use one if it already exists.
 *
 * @param {String} [name] The name of the data source.
 * If not provided, the `'default'` is used.
 */

Registry.prototype.memory = function(name) {
  name = name || 'default';
  var memory = (
    this._memoryDataSources || (this._memoryDataSources = {})
    )[name];

  if (!memory) {
    memory = this._memoryDataSources[name] = this.createDataSource({
      connector: 'memory'
    });
  }

  return memory;
};

/**
 * Set the default `dataSource` for a given `type`.
 * @param {String} type The datasource type.
 * @param {Object|DataSource} dataSource The data source settings or instance
 * @returns {DataSource} The data source instance.
 *
 * @header loopback.setDefaultDataSourceForType(type, dataSource)
 */

Registry.prototype.setDefaultDataSourceForType = function(type, dataSource) {
  var defaultDataSources = this.defaultDataSources;

  if (!(dataSource instanceof DataSource)) {
    dataSource = this.createDataSource(dataSource);
  }

  defaultDataSources[type] = dataSource;
  return dataSource;
};

/**
 * Get the default `dataSource` for a given `type`.
 * @param {String} type The datasource type.
 * @returns {DataSource} The data source instance
 */

Registry.prototype.getDefaultDataSourceForType = function(type) {
  return this.defaultDataSources && this.defaultDataSources[type];
};

/**
 * Attach any model that does not have a dataSource to
 * the default dataSource for the type the Model requests
 */

Registry.prototype.autoAttach = function() {
  var models = this.modelBuilder.models;
  assert.equal(typeof models, 'object', 'Cannot autoAttach without a models object');

  Object.keys(models).forEach(function(modelName) {
    var ModelCtor = models[modelName];

    // Only auto attach if the model doesn't have an explicit data source
    if (ModelCtor && (!(ModelCtor.dataSource instanceof DataSource))) {
      this.autoAttachModel(ModelCtor);
    }
  }, this);
};

Registry.prototype.autoAttachModel = function(ModelCtor) {
  if (ModelCtor.autoAttach) {
    var ds = this.getDefaultDataSourceForType(ModelCtor.autoAttach);

    assert(
      ds instanceof DataSource,
      'cannot autoAttach model "' + ModelCtor.modelName +
      '". No dataSource found of type ' + ModelCtor.autoAttach
    );

    ModelCtor.attachTo(ds);
  }
};

// temporary alias to simplify migration of code based on <=2.0.0-beta3
Object.defineProperty(Registry.prototype, 'DataModel', {
  get: function() {
    var stackLines = new Error().stack.split('\n');
    console.warn('loopback.DataModel is deprecated, ' +
      'use loopback.PersistedModel instead.');
    // Log the location where loopback.DataModel was called
    console.warn(stackLines[2]);
    return this.PersistedModel;
  }
});
