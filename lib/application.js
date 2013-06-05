/**
 * Module dependencies.
 */

var Model = require('../node_modules/model/lib/model')
  , DataSource = require('jugglingdb').DataSource
  , ModelBuilder = require('jugglingdb').ModelBuilder
  , assert = require('assert')
  , RemoteObjects = require('sl-remoting')
  , i8n = require('inflection');

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
 * Get ModelBuilder.
 */
 
app.modelBuilder = function () {
  return this._modelBuilder || (this._modelBuilder = new ModelBuilder())
}

/**
 * Define a model.
 *
 * @param name {String}
 * @param options {Object}
 * @returns {Model}
 */

app.model =
app.defineModel =
app.define = function (name, properties, options) {
  var modelBuilder = this.modelBuilder();
  var ModelCtor = modelBuilder.define(name, properties, options);
  
  ModelCtor.dataSource = function (name) {
    var dataSource = app.dataSources[name];
    
    dataSource.attach(this);
    
    var hasMany = ModelCtor.hasMany;
  
    if(!hasMany) return;
  
    // override the default relations to add shared proxy methods
    // cannot expose the relation methods since they are only defined
    // once you get them (eg. prototype[name])
    ModelCtor.hasMany = function (anotherClass, params) {
      var origArgs = arguments;
      var thisClass = this, thisClassName = this.modelName;
      params = params || {};
      if (typeof anotherClass === 'string') {
          params.as = anotherClass;
          if (params.model) {
              anotherClass = params.model;
          } else {
              var anotherClassName = i8n.singularize(anotherClass).toLowerCase();
              for(var name in this.schema.models) {
                  if (name.toLowerCase() === anotherClassName) {
                      anotherClass = this.schema.models[name];
                  }
              }
          }
      }
      
      var pluralized = i8n.pluralize(anotherClass.modelName);
      var methodName = params.as ||
          i8n.camelize(pluralized, true);
      var proxyMethodName = 'get' + i8n.titleize(pluralized, true);
    
      // create a proxy method
      var fn = this.prototype[proxyMethodName] = function () {
        // this cannot be a shared method
        // because it is defined when you
        // inside a property getter...
        
        this[methodName].apply(thisClass, arguments);
      };
      
      fn.shared = true;
      fn.http = {verb: 'get', path: '/' + methodName};
      hasMany.apply(this, arguments);
    };
  };
  
  ModelCtor.shared = true;
  ModelCtor.sharedCtor = function (id, fn) {
    if(id) {
      ModelCtor.find(id, fn);
    } else {
      fn(null, new ModelCtor(data));
    }
  };
  ModelCtor.sharedCtor.accepts = [
    // todo... models need to expose what id type they need
    {arg: 'id', type: 'any'},
    {arg: 'data', type: 'object'}
  ];
  ModelCtor.sharedCtor.http = [
    {path: '/'},
    {path: '/:id'}
  ];
  
  
  return (app._models[ModelCtor.pluralModelName] = ModelCtor);
}

/**
 * Get all models.
 */

app.models = function () {
  var models = this._models;
  var result = {};
  var dataSources = this.dataSources;
  
  // add in any model from a data source
  Object.keys(this.dataSources).forEach(function (name) {
    var dataSource = dataSources[name];
    
    Object.keys(dataSource.models).forEach(function (className) {
      var model = dataSource.models[className];
      result[exportedName(model)] = model;
    });
  });
  
  // add in defined models
  Object.keys(models).forEach(function (name) {
    var model = models[name];
    result[exportedName(model)] = model;
  });
  
  function exportedName(model) {
    return model.pluralModelName || i8n.pluralize(model.modelName);
  }
  
  return result;
}


/**
 * Get all remote objects.
 */

app.remoteObjects = function () {
  var result = {};
  var models = this.models();
  
  // add in models
  Object.keys(models)
    .forEach(function (name) {
      var ModelCtor = models[name];
      
      // only add shared models
      if(ModelCtor.shared && typeof ModelCtor.sharedCtor === 'function') {
        result[name] = ModelCtor;
      }
    });
    
  return result;
}

/**
 * App data sources and models.
 */

app._models = {};
app.dataSources = {};

/**
 * Get the apps set of remote objects.
 */
 
app.remotes = function () {
  return this._remotes || (this._remotes = RemoteObjects.create());
}

/**
 * Attach a remote data source.
 *
 * @param name {String}
 * @param options {Object}
 * @returns {DataSource}
 */

app.dataSource = function (name, options) {
  var dataSources = this.dataSources || (this.dataSources = {});
  return (dataSources[name] = new DataSource(options.adapter, options));
}