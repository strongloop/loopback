/*!
 * Module Dependencies.
 */
var loopback = require('../loopback');
var compat = require('../compat');
var juggler = require('loopback-datasource-juggler');
var ModelBuilder = juggler.ModelBuilder;
var DataSource = juggler.DataSource;
var modeler = new ModelBuilder();
var async = require('async');
var assert = require('assert');
var _ = require('underscore');

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

/*!
 * Called when a model is extended.
 */

Model.setup = function () {
  var ModelCtor = this;
  var options = this.settings;
  
  ModelCtor.sharedClass = new SharedClass(remoteNamespace, ModelCtor);

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
  var idDesc = ModelCtor.modelName + ' id';
  ModelCtor.sharedCtor.accepts = [
    {arg: 'id', type: 'any', http: {source: 'path'}, description: idDesc}
    // {arg: 'instance', type: 'object', http: {source: 'body'}}
  ];

  ModelCtor.sharedCtor.http = [
    {path: '/:id'}
  ];
  
  ModelCtor.sharedCtor.returns = {root: true};

  return ModelCtor;
};

/*!
 * Get the reference to ACL in a lazy fashion to avoid race condition in require
 */
var _aclModel = null;
Model._ACL = function getACL(ACL) {
  if(ACL !== undefined) {
    // The function is used as a setter
    _aclModel = ACL;
  }
  if(_aclModel) {
    return _aclModel;
  }
  var aclModel = require('./acl').ACL;
  _aclModel = loopback.getModelByType(aclModel);
  return _aclModel;
};


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
  var aclModel = Model._ACL();
  var methodName = 'string' === typeof method? method: method && method.name;
  aclModel.checkAccessForToken(token, this.modelName, modelId, methodName, callback);
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

  var ACL = Model._ACL();

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

/**
 * Get the `Application` the Model is attached to.
 *
 * @callback {Function} callback
 * @param {Error} err
 * @param {Application} app
 * @end
 */

Model.getApp = function(callback) {
  var Model = this;
  if(this.app) {
    callback(null, this.app);
  } else {
    Model.once('attached', function() {
      assert(Model.app);
      callback(null, Model.app);
    });
  }
}

/**
 * Enable remote invocation for the method with the given name.
 * 
 * @param {String} name The name of the method.
 * ```js
 * // static method example (eg. Model.myMethod())
 * Model.remoteMethod('myMethod');
 * // instance method exampe (eg. Model.prototype.myMethod())
 * Model.remoteMethod('prototype.myMethod', {prototype: true});
 * @param {Object} options The remoting options.
 * See [loopback.remoteMethod()](http://docs.strongloop.com/display/DOC/Remote+methods+and+hooks#Remotemethodsandhooks-loopback.remoteMethod(fn,[options])) for details.
 */

Model.remoteMethod = function(name, options) {
  this.sharedClass.defineMethod(name, options);
}

// setup the initial model
Model.setup();
