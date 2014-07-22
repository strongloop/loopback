/*!
 * Module Dependencies.
 */

var Model = require('./model');
var runtime = require('../runtime');
var RemoteObjects = require('strong-remoting');
var assert = require('assert');
var async = require('async');

/**
 * Extends Model with basic query and CRUD support.
 *
 * **Change Event**
 *
 * Listen for model changes using the `change` event.
 *
 * ```js
 * MyPersistedModel.on('changed', function(obj) {
 *    console.log(obj) // => the changed model
 * });
 * ```
 *
 * @class PersistedModel
 * @param {Object} data
 * @param {Number} data.id The default id property
 */

var PersistedModel = module.exports = Model.extend('PersistedModel');

/*!
 * Setup the `PersistedModel` constructor.
 */

PersistedModel.setup = function setupPersistedModel() {
  // call Model.setup first
  Model.setup.call(this);

  var PersistedModel = this;
  var typeName = this.modelName;

  // setup a remoting type converter for this model
  RemoteObjects.convert(typeName, function(val) {
    return val ? new PersistedModel(val) : val;
  });

  // enable change tracking (usually for replication)
  if(this.settings.trackChanges) {
    PersistedModel._defineChangeModel();
    PersistedModel.once('dataSourceAttached', function() {
      PersistedModel.enableChangeTracking();
    });
  }
  
  PersistedModel.setupRemoting();
}

/*!
 * Throw an error telling the user that the method is not available and why.
 */

function throwNotAttached(modelName, methodName) {
  throw new Error(
      'Cannot call ' + modelName + '.'+ methodName + '().'
    + ' The ' + methodName + ' method has not been setup.'
    + ' The PersistedModel has not been correctly attached to a DataSource!'
  );
}

/*!
 * Convert null callbacks to 404 error objects.
 * @param  {HttpContext} ctx
 * @param  {Function} cb
 */

function convertNullToNotFoundError(ctx, cb) {
  if (ctx.result !== null) return cb();

  var modelName = ctx.method.sharedClass.name;
  var id = ctx.getArgByName('id');
  var msg = 'Unknown "' + modelName + '" id "' + id + '".';
  var error = new Error(msg);
  error.statusCode = error.status = 404;
  cb(error);
}

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

PersistedModel.create = function (data, callback) {
  throwNotAttached(this.modelName, 'create');
};

/**
 * Update or insert a model instance
 * @param {Object} data The model instance data
 * @param {Function} [callback] The callback function
 */

PersistedModel.upsert = PersistedModel.updateOrCreate = function upsert(data, callback) {
  throwNotAttached(this.modelName, 'upsert');
};

/**
 * Find one record, same as `find`, limited by 1 and return object, not collection,
 * if not found, create using data provided as second argument
 *
 * @param {Object} query - search conditions: {where: {test: 'me'}}.
 * @param {Object} data - object to create.
 * @param {Function} cb - callback called with (err, instance)
 */

PersistedModel.findOrCreate = function findOrCreate(query, data, callback) {
  throwNotAttached(this.modelName, 'findOrCreate');
};

PersistedModel.findOrCreate._delegate = true;

/**
 * Check whether a model instance exists in database
 *
 * @param {id} id - identifier of object (primary key value)
 * @param {Function} cb - callbacl called with (err, exists: Bool)
 */

PersistedModel.exists = function exists(id, cb) {
  throwNotAttached(this.modelName, 'exists');
};

/**
 * Find object by id
 *
 * @param {*} id - primary key value
 * @param {Function} cb - callback called with (err, instance)
 */

PersistedModel.findById = function find(id, cb) {
  throwNotAttached(this.modelName, 'findById');
};

/**
 * Find all instances of Model, matched by query
 * make sure you have marked as `index: true` fields for filter or sort
 *
 * @param {Object} params (optional)
 *
 * - where: Object `{ key: val, key2: {gt: 'val2'}}`
 * - include: String, Object or Array. See PersistedModel.include documentation.
 * - order: String
 * - limit: Number
 * - skip: Number
 *
 * @param {Function} callback (required) called with arguments:
 *
 * - err (null or Error)
 * - Array of instances
 */

PersistedModel.find = function find(params, cb) {
  throwNotAttached(this.modelName, 'find');
};

/**
 * Find one record, same as `all`, limited by 1 and return object, not collection
 *
 * @param {Object} params - search conditions: {where: {test: 'me'}}
 * @param {Function} cb - callback called with (err, instance)
 */

PersistedModel.findOne = function findOne(params, cb) {
  throwNotAttached(this.modelName, 'findOne');
};

/**
 * Destroy all matching records
 * @param {Object} [where] An object that defines the criteria
 * @param {Function} [cb] - callback called with (err)
 */

PersistedModel.remove =
PersistedModel.deleteAll =
PersistedModel.destroyAll = function destroyAll(where, cb) {
  throwNotAttached(this.modelName, 'destroyAll');
};

/**
 * Update multiple instances that match the where clause
 *
 * Example:
 *
 *```js
 * Employee.update({managerId: 'x001'}, {managerId: 'x002'}, function(err) {
 *     ...
 * });
 * ```
 *
 * @param {Object} [where] Search conditions (optional)
 * @param {Object} data Changes to be made
 * @param {Function} cb Callback, called with (err, count)
 */
PersistedModel.update =
  PersistedModel.updateAll = function updateAll(where, data, cb) {
    throwNotAttached(this.modelName, 'updateAll');
  };

/**
 * Destroy a record by id
 * @param {*} id The id value
 * @param {Function} cb - callback called with (err)
 */

PersistedModel.removeById =
PersistedModel.deleteById =
PersistedModel.destroyById = function deleteById(id, cb) {
  throwNotAttached(this.modelName, 'deleteById');
};

/**
 * Return count of matched records
 *
 * @param {Object} where - search conditions (optional)
 * @param {Function} cb - callback, called with (err, count)
 */

PersistedModel.count = function (where, cb) {
  throwNotAttached(this.modelName, 'count');
};

/**
 * Save instance. When instance haven't id, create method called instead.
 * Triggers: validate, save, update | create
 * @param options {validate: true, throws: false} [optional]
 * @param callback(err, obj)
 */

PersistedModel.prototype.save = function (options, callback) {
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
  var id = this.getId();

  if (!id) {
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
        Model.upsert(inst, function(err) {
          inst._initProperties(data);
          updateDone.call(inst, function () {
            saveDone.call(inst, function () {
              callback(err, inst);
            });
          });
        });
      }, data);
    }, data);
  }
};

/**
 * Determine if the data model is new.
 * @returns {Boolean}
 */

PersistedModel.prototype.isNewRecord = function () {
  throwNotAttached(this.constructor.modelName, 'isNewRecord');
};

/**
 * Delete object from persistence
 *
 * @triggers `destroy` hook (async) before and after destroying object
 */

PersistedModel.prototype.remove =
PersistedModel.prototype.delete =
PersistedModel.prototype.destroy = function (cb) {
  throwNotAttached(this.constructor.modelName, 'destroy');
};

PersistedModel.prototype.destroy._delegate = true;

/**
 * Update single attribute
 *
 * equals to `updateAttributes({name: value}, cb)
 *
 * @param {String} name - name of property
 * @param {Mixed} value - value of property
 * @param {Function} callback - callback called with (err, instance)
 */

PersistedModel.prototype.updateAttribute = function updateAttribute(name, value, callback) {
  throwNotAttached(this.constructor.modelName, 'updateAttribute');
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

PersistedModel.prototype.updateAttributes = function updateAttributes(data, cb) {
  throwNotAttached(this.modelName, 'updateAttributes');
};

/**
 * Reload object from persistence
 *
 * @requires `id` member of `object` to be able to call `find`
 * @param {Function} callback - called with (err, instance) arguments
 */

PersistedModel.prototype.reload = function reload(callback) {
  throwNotAttached(this.constructor.modelName, 'reload');
};

/**
 * Set the correct `id` property for the `PersistedModel`. If a `Connector` defines
 * a `setId` method it will be used. Otherwise the default lookup is used. You
 * should override this method to handle complex ids.
 *
 * @param {*} val The `id` value. Will be converted to the type the id property
 * specifies.
 */

PersistedModel.prototype.setId = function(val) {
  var ds = this.getDataSource();
  this[this.getIdName()] = val;
}

/**
 * Get the `id` value for the `PersistedModel`.
 *
 * @returns {*} The `id` value
 */

PersistedModel.prototype.getId = function() {
  var data = this.toObject();
  if(!data) return;
  return data[this.getIdName()];
}

/**
 * Get the id property name of the constructor.
 *
 * @returns {String} The `id` property name
 */

PersistedModel.prototype.getIdName = function() {
  return this.constructor.getIdName();
}

/**
 * Get the id property name of the constructor.
 *
 * @returns {String} The `id` property name
 */

PersistedModel.getIdName = function() {
  var Model = this;
  var ds = Model.getDataSource();

  if(ds.idName) {
    return ds.idName(Model.modelName);
  } else {
    return 'id';
  }
}

PersistedModel.setupRemoting = function() {
  var PersistedModel = this;
  var typeName = PersistedModel.modelName;
  var options = PersistedModel.settings;

  function setRemoting(scope, name, options) {
    var fn = scope[name];
    fn._delegate = true;
    options.isStatic = scope === PersistedModel;
    PersistedModel.remoteMethod(name, options);
  }

  setRemoting(PersistedModel, 'create', {
    description: 'Create a new instance of the model and persist it into the data source',
    accepts: {arg: 'data', type: 'object', description: 'Model instance data', http: {source: 'body'}},
    returns: {arg: 'data', type: typeName, root: true},
    http: {verb: 'post', path: '/'}
  });

  setRemoting(PersistedModel, 'upsert', {
    description: 'Update an existing model instance or insert a new one into the data source',
    accepts: {arg: 'data', type: 'object', description: 'Model instance data', http: {source: 'body'}},
    returns: {arg: 'data', type: typeName, root: true},
    http: {verb: 'put', path: '/'}
  });

  setRemoting(PersistedModel, 'exists', {
    description: 'Check whether a model instance exists in the data source',
    accepts: {arg: 'id', type: 'any', description: 'Model id', required: true},
    returns: {arg: 'exists', type: 'boolean'},
    http: {verb: 'get', path: '/:id/exists'}
  });

  setRemoting(PersistedModel, 'findById', {
    description: 'Find a model instance by id from the data source',
    accepts: {
      arg: 'id', type: 'any', description: 'Model id', required: true,
      http: {source: 'path'}
    },
    returns: {arg: 'data', type: typeName, root: true},
    http: {verb: 'get', path: '/:id'},
    rest: {after: convertNullToNotFoundError}
  });

  setRemoting(PersistedModel, 'find', {
    description: 'Find all instances of the model matched by filter from the data source',
    accepts: {arg: 'filter', type: 'object', description: 'Filter defining fields, where, orderBy, offset, and limit'},
    returns: {arg: 'data', type: [typeName], root: true},
    http: {verb: 'get', path: '/'}
  });

  setRemoting(PersistedModel, 'findOne', {
    description: 'Find first instance of the model matched by filter from the data source',
    accepts: {arg: 'filter', type: 'object', description: 'Filter defining fields, where, orderBy, offset, and limit'},
    returns: {arg: 'data', type: typeName, root: true},
    http: {verb: 'get', path: '/findOne'},
    rest: {after: convertNullToNotFoundError}
  });

  setRemoting(PersistedModel, 'destroyAll', {
    description: 'Delete all matching records',
    accepts: {arg: 'where', type: 'object', description: 'filter.where object'},
    http: {verb: 'del', path: '/'},
    shared: false
  });

  setRemoting(PersistedModel, 'updateAll', {
    description: 'Update instances of the model matched by where from the data source',
    accepts: [
      {arg: 'where', type: 'object', http: {source: 'query'},
        description: 'Criteria to match model instances'},
      {arg: 'data', type: 'object', http: {source: 'body'},
        description: 'An object of model property name/value pairs'},
    ],
    http: {verb: 'post', path: '/update'}
  });

  setRemoting(PersistedModel, 'deleteById', {
    description: 'Delete a model instance by id from the data source',
    accepts: {arg: 'id', type: 'any', description: 'Model id', required: true,
              http: {source: 'path'}},
    http: {verb: 'del', path: '/:id'}
  });

  setRemoting(PersistedModel, 'count', {
    description: 'Count instances of the model matched by where from the data source',
    accepts: {arg: 'where', type: 'object', description: 'Criteria to match model instances'},
    returns: {arg: 'count', type: 'number'},
    http: {verb: 'get', path: '/count'}
  });

  setRemoting(PersistedModel.prototype, 'updateAttributes', {
    description: 'Update attributes for a model instance and persist it into the data source',
    accepts: {arg: 'data', type: 'object', http: {source: 'body'}, description: 'An object of model property name/value pairs'},
    returns: {arg: 'data', type: typeName, root: true},
    http: {verb: 'put', path: '/'}
  });

  if(options.trackChanges) {
    setRemoting(PersistedModel, 'diff', {
      description: 'Get a set of deltas and conflicts since the given checkpoint',
      accepts: [
        {arg: 'since', type: 'number', description: 'Find deltas since this checkpoint'},
        {arg: 'remoteChanges', type: 'array', description: 'an array of change objects',
         http: {source: 'body'}}
      ],      
      returns: {arg: 'result', type: 'object', root: true},
      http: {verb: 'post', path: '/diff'}
    });

    setRemoting(PersistedModel, 'changes', {
      description: 'Get the changes to a model since a given checkpoint.'
                 + 'Provide a filter object to reduce the number of results returned.',
      accepts: [
        {arg: 'since', type: 'number', description: 'Only return changes since this checkpoint'},
        {arg: 'filter', type: 'object', description: 'Only include changes that match this filter'}
      ],
      returns: {arg: 'changes', type: 'array', root: true},
      http: {verb: 'get', path: '/changes'}
    });
    
    setRemoting(PersistedModel, 'checkpoint', {
      description: 'Create a checkpoint.',
      returns: {arg: 'checkpoint', type: 'object', root: true},
      http: {verb: 'post', path: '/checkpoint'}
    });

    setRemoting(PersistedModel, 'currentCheckpoint', {
      description: 'Get the current checkpoint.',
      returns: {arg: 'checkpoint', type: 'object', root: true},
      http: {verb: 'get', path: '/checkpoint'}
    });

    setRemoting(PersistedModel, 'createUpdates', {
      description: 'Create an update list from a delta list',
      accepts: {arg: 'deltas', type: 'array', http: {source: 'body'}},
      returns: {arg: 'updates', type: 'array', root: true},
      http: {verb: 'post', path: '/create-updates'}
    });

    setRemoting(PersistedModel, 'bulkUpdate', {
      description: 'Run multiple updates at once. Note: this is not atomic.',
      accepts: {arg: 'updates', type: 'array'},
      http: {verb: 'post', path: '/bulk-update'}
    });

    setRemoting(PersistedModel, 'rectifyAllChanges', {
      description: 'Rectify all Model changes.',
      http: {verb: 'post', path: '/rectify-all'}
    });

    setRemoting(PersistedModel, 'rectifyChange', {
      description: 'Tell loopback that a change to the model with the given id has occurred.',
      accepts: {arg: 'id', type: 'any', http: {source: 'path'}},
      http: {verb: 'post', path: '/:id/rectify-change'}
    });
  }
}

/**
 * Get a set of deltas and conflicts since the given checkpoint.
 *
 * See `Change.diff()` for details.
 * 
 * @param  {Number}   since         Find deltas since this checkpoint
 * @param  {Array}   remoteChanges  An array of change objects
 * @param  {Function} callback      
 */

PersistedModel.diff = function(since, remoteChanges, callback) {
  var Change = this.getChangeModel();
  Change.diff(this.modelName, since, remoteChanges, callback);
}

/**
 * Get the changes to a model since a given checkpoint. Provide a filter object
 * to reduce the number of results returned.
 * @param  {Number}   since    Only return changes since this checkpoint
 * @param  {Object}   filter   Only include changes that match this filter
 * (same as `Model.find(filter, ...)`)
 * @callback {Function} callback
 * @param {Error} err
 * @param {Array} changes An array of `Change` objects
 * @end
 */

PersistedModel.changes = function(since, filter, callback) {
  if(typeof since === 'function') {
    filter = {};
    callback = since;
    since = -1;
  }
  if(typeof filter === 'function') {
    callback = filter;
    since = -1;
    filter = {};
  }

  var idName = this.dataSource.idName(this.modelName);
  var Change = this.getChangeModel();
  var model = this;

  filter = filter || {};
  filter.fields = {};
  filter.where = filter.where || {};
  filter.fields[idName] = true;

  // TODO(ritch) this whole thing could be optimized a bit more
  Change.find({
    checkpoint: {gt: since},
    modelName: this.modelName
  }, function(err, changes) {
    if(err) return cb(err);
    var ids = changes.map(function(change) {
      return change.getModelId();
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

PersistedModel.checkpoint = function(cb) {
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

PersistedModel.currentCheckpoint = function(cb) {
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

PersistedModel.replicate = function(since, targetModel, options, callback) {
  var lastArg = arguments[arguments.length - 1];

  if(typeof lastArg === 'function' && arguments.length > 1) {
    callback = lastArg;
  }

  if(typeof since === 'function' && since.modelName) {
    targetModel = since;
    since = -1;
  }

  options = options || {};

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

  callback = callback || function defaultReplicationCallback(err) {
    if(err) throw err;
  }

  var tasks = [
    getSourceChanges,
    getDiffFromTarget,
    createSourceUpdates,
    bulkUpdate,
    checkpoint
  ];

  async.waterfall(tasks, done);

  function getSourceChanges(cb) {
    sourceModel.changes(since, options.filter, cb);
  }

  function getDiffFromTarget(sourceChanges, cb) {
    targetModel.diff(since, sourceChanges, cb);
  }

  function createSourceUpdates(_diff, cb) {
    diff = _diff;
    diff.conflicts = diff.conflicts || [];
    if(diff && diff.deltas && diff.deltas.length) {
      sourceModel.createUpdates(diff.deltas, cb);
    } else {
      // nothing to replicate
      done();
    }
  }

  function bulkUpdate(updates, cb) {
    targetModel.bulkUpdate(updates, cb);
  }

  function checkpoint() {
    var cb = arguments[arguments.length - 1];
    sourceModel.checkpoint(cb);
  }

  function done(err) {
    if(err) return callback(err);

    var conflicts = diff.conflicts.map(function(change) {
      return new Change.Conflict(
        change.modelId, sourceModel, targetModel
      );
    });

    if(conflicts.length) {
      sourceModel.emit('conflicts', conflicts);
    }

    callback && callback(null, conflicts);
  }
}

/**
 * Create an update list (for `Model.bulkUpdate()`) from a delta list
 * (result of `Change.diff()`).
 * 
 * @param  {Array}    deltas 
 * @param  {Function} callback
 */

PersistedModel.createUpdates = function(deltas, cb) {
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
            if(!inst) {
              console.error('missing data for change:', change);
              return cb && cb(new Error('missing data for change: '
                + change.modelId));
            }
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

PersistedModel.bulkUpdate = function(updates, callback) {
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
 * @throws {Error} Throws an error if the change model is not correctly setup.
 * @return {Change}
 */

PersistedModel.getChangeModel = function() {
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

PersistedModel.getSourceId = function(cb) {
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

PersistedModel.enableChangeTracking = function() {
  var Model = this;
  var Change = this.Change || this._defineChangeModel();
  var cleanupInterval = Model.settings.changeCleanupInterval || 30000;

  assert(this.dataSource, 'Cannot enableChangeTracking(): ' + this.modelName
    + ' is not attached to a dataSource');

  Change.attachTo(this.dataSource);
  Change.getCheckpointModel().attachTo(this.dataSource);

  Model.afterSave = function afterSave(next) {
    Model.rectifyChange(this.getId(), next);
  }

  Model.afterDestroy = function afterDestroy(next) {
    Model.rectifyChange(this.getId(), next);
  }

  Model.on('deletedAll', cleanup);

  if(runtime.isServer) {
    // initial cleanup
    cleanup();

    // cleanup
    setInterval(cleanup, cleanupInterval);

    function cleanup() {
      Model.rectifyAllChanges(function(err) {
        if(err) {
          console.error(Model.modelName + ' Change Cleanup Error:');
          console.error(err);
        }
      });
    }
  }
}

PersistedModel._defineChangeModel = function() {
  var BaseChangeModel = require('./change');
  return this.Change = BaseChangeModel.extend(this.modelName + '-change',
    {},
    {
      trackModel: this
    }
  );
}

PersistedModel.rectifyAllChanges = function(callback) {
  this.getChangeModel().rectifyAll(callback);
}

/**
 * Handle a change error. Override this method in a subclassing model to customize
 * change error handling.
 *
 * @param {Error} err
 */

PersistedModel.handleChangeError = function(err) {
  if(err) {
    console.error(Model.modelName + ' Change Tracking Error:');
    console.error(err);
  }
}

/**
 * Tell loopback that a change to the model with the given id has occurred.
 *
 * @param {*} id The id of the model that has changed
 * @callback {Function} callback
 * @param {Error} err
 */

PersistedModel.rectifyChange = function(id, callback) {
  var Change = this.getChangeModel();
  Change.rectifyModelChanges(this.modelName, [id], callback);
}

PersistedModel.setup();
