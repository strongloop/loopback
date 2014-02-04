/*!
 * Dependencies.
 */

var assert = require('assert')
  , loopback = require('../loopback')
  , debug = require('debug')
  , path = require('path');

/*!
 * Export the ServerConnector class.
 */

module.exports = ServerConnector;

/*!
 * Create an instance of the connector with the given `settings`.
 */

function ServerConnector(settings) {
  this.settings = settings;
}

ServerConnector.initialize = function(dataSource, callback) {
  var connector = dataSource.connector = new ServerConnector(dataSource.settings);
  connector.dataSource = dataSource;
  dataSource.DataAccessObject = function() {}; // unused for this connector
  var remoteModels = connector.settings.discover;
  if(remoteModels) {
    remoteModels.forEach(connector.buildModel.bind(connector));
  }
  callback();
}

ServerConnector.prototype.invoke = function(ctx, callback) {
  var req = ctx.toRequest();
  console.log(req);
}

ServerConnector.prototype.createRequest = function(method, args) {
  var baseUrl = path.join(this.settings.base || '/');
  var route = (method.routes && method.routes[0]) || {path: '/'};
  var url = path.join(baseUrl, route.path);
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

  if(!Model.defineMethod) {
    Model.defineMethod = function defineMethod(method) {
      var scope = method.fullName.indexOf('.prototype.') > -1
        ? Model.prototype : Model;

      scope[method.name] = function() {
        console.log(method.name);
        var callback = arguments[arguments.length - 1];
        var ctx = new Context(
          connector.settings.base,
          remoteModel,
          Model,
          method,
          arguments
        );
        if(typeof callback !== 'function') callback = undefined;
        connector.invoke(ctx, callback);
      };
    }
  }

  remoteModel.methods.forEach(Model.defineMethod.bind(Model));
}

function Context(base, meta, model, method, args) {
  this.base = base;
  this.meta = meta;
  this.model = model;
  this.method = method;
  this.args = this.mapArgs(args);
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
    headers: this.headers()
  }
}

Context.prototype.url = function() {
  var url = path.join(
    this.base,
    this.meta.baseRoute.path,
    this.route().path
  );

  // replace url fragments with url params
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
