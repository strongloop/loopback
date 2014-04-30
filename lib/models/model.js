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

Model.shared = true;

/*!
 * Called when a model is extended.
 */

Model.setup = function () {
  var ModelCtor = this;
  var options = this.settings;
  
  if(options.trackChanges) {
    this._defineChangeModel();
  }
  
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
  
  // enable change tracking (usually for replication)
  if(options.trackChanges) {
    ModelCtor.once('dataSourceAttached', function() {
      ModelCtor.enableChangeTracking();
    });
  }

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
    if(err) return cb(err);
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
 * @param  {Number}   [since]        Since this checkpoint
 * @param  {Model}    targetModel  Target this model class
 * @param  {Object} [options]
 * @param {Object} [options.filter] Replicate models that match this filter
 * @callback {Function} [callback]
 * @param {Error} err
 * @param {Conflict[]} conflicts A list of changes that could not be replicated
 * due to conflicts.
 */

Model.replicate = function(since, targetModel, options, callback) {
  var lastArg = arguments[arguments.length - 1];

  if(typeof lastArg === 'function' && arguments.length > 1) {
    callback = lastArg;
  }

  if(typeof since === 'funciton' && since.modelName) {
    since = -1;
    targetModel = since;
  }

  var sourceModel = this;
  var diff;
  var updates;
  var Change = this.getChangeModel();
  var TargetChange = targetModel.getChangeModel();
  var changeTrackingEnabled = Change && TargetChange;

  assert(
    changeTrackingEnabled,
    'You must enable change tracking before replicating'
  );

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
          debugger;
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
 * @throws {Error} Throws an error if the change model is not correctly setup.
 * @return {Change}
 */

Model.getChangeModel = function() {
  var changeModel = this.Change;
  var isSetup = changeModel && changeModel.dataSource;

  assert(isSetup, 'Cannot get a setup Change model');

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
  var Change = this.Change || this._defineChangeModel();
  var cleanupInterval = Model.settings.changeCleanupInterval || 30000;

  assert(this.dataSource, 'Cannot enableChangeTracking(): ' + this.modelName
    + ' is not attached to a dataSource');

  Change.attachTo(this.dataSource);
  Change.getCheckpointModel().attachTo(this.dataSource);

  Model.on('changed', function(obj) {
    Change.rectifyModelChanges(Model.modelName, [obj.id], function(err) {
      if(err) {
        console.error(Model.modelName + ' Change Tracking Error:');
        console.error(err);
      }
    });
  });

  Model.on('deleted', function(obj) {
    Change.rectifyModelChanges(Model.modelName, [obj.id], function(err) {
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

Model._defineChangeModel = function() {
  var BaseChangeModel = require('./change');
  return this.Change = BaseChangeModel.extend(this.modelName + '-change');
}
