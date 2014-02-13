/*!
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

  if(remoteModel.settings && remoteModel.settings.trackChanges) {
    remoteModel.settings.trackChanges = false;
  }

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
    method: 'DELETE',
    json: false
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
