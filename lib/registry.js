/*
 * This file exports methods and objects for manipulating
 * Models and DataSources.
 *
 * It is an internal file that should not be used outside of loopback.
 * All exported entities can be accessed via the `loopback` object.
 * @private
 */

var assert = require('assert');
var extend = require('util')._extend;
var juggler = require('loopback-datasource-juggler');
var debug = require('debug')('loopback:registry');
var DataSource = juggler.DataSource;
var ModelBuilder = juggler.ModelBuilder;

var registry = module.exports;

registry.defaultDataSources = {};

registry.modelBuilder = new ModelBuilder();

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

registry.createModel = function(name, properties, options) {
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
          'Use `PeristedModel` instead.', name);
        BaseModel = this.PersistedModel;
      } else {
        console.warn('Model `%s` is extending an unknown model `%s`. ' +
          'Using `PersistedModel` as the base.', name, baseName);
      }
    }
  }

  BaseModel = BaseModel || this.PersistedModel;

  var model = BaseModel.extend(name, properties, options);

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

/**
 * Alter an existing Model class.
 * @param {Model} ModelCtor The model constructor to alter.
 * @options {Object} config Additional configuration to apply
 * @property {DataSource} dataSource Attach the model to a dataSource.
 * @property {Object} [relations] Model relations to add/update.
 *
 * @header loopback.configureModel(ModelCtor, config)
 */

registry.configureModel = function(ModelCtor, config) {
  var settings = ModelCtor.settings;

  if (config.relations) {
    var relations = settings.relations = settings.relations || {};
    Object.keys(config.relations).forEach(function(key) {
      relations[key] = extend(relations[key] || {}, config.relations[key]);
    });
  }

  // It's important to attach the datasource after we have updated
  // configuration, so that the datasource picks up updated relations
  if (config.dataSource) {
    assert(config.dataSource instanceof DataSource,
        'Cannot configure ' + ModelCtor.modelName +
        ': config.dataSource must be an instance of DataSource');
    ModelCtor.attachTo(config.dataSource);
    debug('Attached model `%s` to dataSource `%s`',
      ModelCtor.definition.name, config.dataSource.name);
  } else if (config.dataSource === null) {
    debug('Model `%s` is not attached to any DataSource by configuration.',
      ModelCtor.definition.name);
  } else {
    debug('Model `%s` is not attached to any DataSource, possibly by a mistake.',
      ModelCtor.definition.name);
    console.warn(
      'The configuration of `%s` is missing `dataSource` property.\n' +
      'Use `null` or `false` to mark models not attached to any data source.',
      ModelCtor.definition.name);
  }
};

/**
 * Look up a model class by name from all models created by
 * `loopback.createModel()`
 * @param {String} modelName The model name
 * @returns {Model} The model class
 *
 * @header loopback.findModel(modelName)
 */
registry.findModel = function(modelName) {
  return this.modelBuilder.models[modelName];
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
registry.getModel = function(modelName) {
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
registry.getModelByType = function(modelType) {
  assert(typeof modelType === 'function',
    'The model type must be a constructor');
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
 *
 * @header loopback.createDataSource(name, options)
 */

registry.createDataSource = function(name, options) {
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
 *
 * @header loopback.memory([name])
 */

registry.memory = function(name) {
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

registry.setDefaultDataSourceForType = function(type, dataSource) {
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
 * @returns {DataSource} The data source instance.
 * @header loopback.getDefaultDataSourceForType(type)
 */

registry.getDefaultDataSourceForType = function(type) {
  return this.defaultDataSources && this.defaultDataSources[type];
};

/**
 * Attach any model that does not have a dataSource to
 * the default dataSource for the type the Model requests
 * @header loopback.autoAttach()
 */

registry.autoAttach = function() {
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

registry.autoAttachModel = function(ModelCtor) {
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

registry.DataSource = DataSource;

/*
 * Core models
 * @private
 */

registry.Model = require('./model');
registry.PersistedModel = require('./persisted-model');

// temporary alias to simplify migration of code based on <=2.0.0-beta3
Object.defineProperty(registry, 'DataModel', {
  get: function() {
    var stackLines = new Error().stack.split('\n');
    console.warn('loopback.DataModel is deprecated, ' +
      'use loopback.PersistedModel instead.');
    // Log the location where loopback.DataModel was called
    console.warn(stackLines[2]);
    return this.PersistedModel;
  }
});

// Set the default model base class. This is done after the Model class is defined.
registry.modelBuilder.defaultModelBaseClass = registry.Model;
