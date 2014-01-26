/*!
 * Module Dependencies.
 */
var loopback = require('../loopback');
var compat = require('../compat');
var ModelBuilder = require('loopback-datasource-juggler').ModelBuilder;
var modeler = new ModelBuilder();
var assert = require('assert');

/**
 * The built in loopback.Model.
 *
 * @class
 * @param {Object} data
 */

var Model = module.exports = modeler.define('Model');

Model.shared = true;

/*!
 * Called when a model is extended.
 */

Model.setup = function () {
  var ModelCtor = this;
  
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
  var idName = this.idName();
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
      return change.modelId;
    });
    filter.where[idName] = {inq: ids};
    model.find(filter, function(err, models) {
      if(err) return cb(err);
      var modelIds = models.map(function(m) {
        return m[idName];
      });
      callback(null, changes.filter(function(ch) {
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
  var Checkpoint = this.getChangeModel().Checkpoint;
  this.getSourceId(function(err, sourceId) {
    if(err) return cb(err);
    Checkpoint.create({
      sourceId: sourceId
    }, cb);
  });
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

  var tasks = [
    getLocalChanges,
    getDiffFromTarget,
    createSourceUpdates,
    bulkUpdate,
    sourceModel.checkpoint.bind(sourceModel)
  ];

  async.waterfall(tasks, function(err) {
    if(err) return callback(err);
    callback(null, diff.conflicts);
  });

  function getLocalChanges(cb) {
    sourceModel.changes(since, options.filter, cb);
  }

  function getDiffFromTarget(sourceChanges, cb) {
    targetModel.diff(since, sourceChanges, cb);
  }

  function createSourceUpdates(_diff, cb) {
    diff = _diff;
    sourceModel.createUpdates(diff.deltas, cb);
  }

  function bulkUpdate(updates, cb) {
    targetModel.bulkUpdate(updates, cb);
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
  var type = change.type();

  deltas.forEach(function(change) {
    change = new Change(change);
    var update = {type: type, change: change};
    switch(type) {
      case Change.CREATE:
      case Change.UPDATE:
        tasks.push(function(cb) {
          Model.findById(change.modelId, function(err, inst) {
            if(err) return cb(err);
            update.data = inst;
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
  var idName = Model.idName();
  var Change = this.getChangeModel();

  updates.forEach(function(update) {
    switch(update.type) {
      case Change.UPDATE:
      case Change.CREATE:
        tasks.push(Model.upsert.bind(Model, update.data));
      break;
      case: Change.DELETE:
        var data = {};
        data[idName] = update.change.modelId;
        var model = new Model(data);
        tasks.push(model.destroy.bind(model));
      break;
    }
  });

  async.parallel(tasks, callback);
}

Model.getChangeModel = function() {
  
}
