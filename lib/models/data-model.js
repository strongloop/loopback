/*!
 * Module Dependencies.
 */

var Model = require('./model');
var loopback = require('../loopback');
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
 * MyDataModel.on('changed', function(obj) {
 *    console.log(obj) // => the changed model
 * });
 * ```
 *
 * @class DataModel
 * @param {Object} data
 * @param {Number} data.id The default id property
 */

var DataModel = module.exports = Model.extend('DataModel');

/*!
 * Setup the `DataModel` constructor.
 */

DataModel.setup = function setupDataModel() {
  // call Model.setup first
  Model.setup.call(this);

  var DataModel = this;
  var typeName = this.modelName;

  // setup a remoting type converter for this model
  RemoteObjects.convert(typeName, function(val) {
    return val ? new DataModel(val) : val;
  });

  // enable change tracking (usually for replication)
  if(this.settings.trackChanges) {
    DataModel._defineChangeModel();
    DataModel.once('dataSourceAttached', function() {
      DataModel.enableChangeTracking();
    });
  }
  
  DataModel.setupRemoting();
}

/*!
 * Throw an error telling the user that the method is not available and why.
 */

function throwNotAttached(modelName, methodName) {
  throw new Error(
      'Cannot call ' + modelName + '.'+ methodName + '().'
    + ' The ' + methodName + ' method has not been setup.'
    + ' The DataModel has not been correctly attached to a DataSource!'
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
  var msg = 'Unkown "' + modelName + '" id "' + id + '".';
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

DataModel.create = function (data, callback) {
  throwNotAttached(this.modelName, 'create');
};

/**
 * Update or insert a model instance
 * @param {Object} data The model instance data
 * @param {Function} [callback] The callback function
 */

DataModel.upsert = DataModel.updateOrCreate = function upsert(data, callback) {
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

DataModel.findOrCreate = function findOrCreate(query, data, callback) {
  throwNotAttached(this.modelName, 'findOrCreate');
};

/**
 * Check whether a model instance exists in database
 *
 * @param {id} id - identifier of object (primary key value)
 * @param {Function} cb - callbacl called with (err, exists: Bool)
 */

DataModel.exists = function exists(id, cb) {
  throwNotAttached(this.modelName, 'exists');
};

/**
 * Find object by id
 *
 * @param {*} id - primary key value
 * @param {Function} cb - callback called with (err, instance)
 */

DataModel.findById = function find(id, cb) {
  throwNotAttached(this.modelName, 'findById');
};

/**
 * Find all instances of Model, matched by query
 * make sure you have marked as `index: true` fields for filter or sort
 *
 * @param {Object} params (optional)
 *
 * - where: Object `{ key: val, key2: {gt: 'val2'}}`
 * - include: String, Object or Array. See DataModel.include documentation.
 * - order: String
 * - limit: Number
 * - skip: Number
 *
 * @param {Function} callback (required) called with arguments:
 *
 * - err (null or Error)
 * - Array of instances
 */

DataModel.find = function find(params, cb) {
  throwNotAttached(this.modelName, 'find');
};

/**
 * Find one record, same as `all`, limited by 1 and return object, not collection
 *
 * @param {Object} params - search conditions: {where: {test: 'me'}}
 * @param {Function} cb - callback called with (err, instance)
 */

DataModel.findOne = function findOne(params, cb) {
  throwNotAttached(this.modelName, 'findOne');
};

/**
 * Destroy all matching records
 * @param {Object} [where] An object that defines the criteria
 * @param {Function} [cb] - callback called with (err)
 */

DataModel.remove =
DataModel.deleteAll =
DataModel.destroyAll = function destroyAll(where, cb) {
  throwNotAttached(this.modelName, 'destroyAll');
};

/**
 * Destroy a record by id
 * @param {*} id The id value
 * @param {Function} cb - callback called with (err)
 */

DataModel.removeById =
DataModel.deleteById =
DataModel.destroyById = function deleteById(id, cb) {
  throwNotAttached(this.modelName, 'deleteById');
};

/**
 * Return count of matched records
 *
 * @param {Object} where - search conditions (optional)
 * @param {Function} cb - callback, called with (err, count)
 */

DataModel.count = function (where, cb) {
  throwNotAttached(this.modelName, 'count');
};

/**
 * Save instance. When instance haven't id, create method called instead.
 * Triggers: validate, save, update | create
 * @param options {validate: true, throws: false} [optional]
 * @param callback(err, obj)
 */

DataModel.prototype.save = function (options, callback) {
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

DataModel.prototype.isNewRecord = function () {
  throwNotAttached(this.constructor.modelName, 'isNewRecord');
};

/**
 * Delete object from persistence
 *
 * @triggers `destroy` hook (async) before and after destroying object
 */

DataModel.prototype.remove =
DataModel.prototype.delete =
DataModel.prototype.destroy = function (cb) {
  throwNotAttached(this.constructor.modelName, 'destroy');
};

DataModel.prototype.destroy._delegate = true;

/**
 * Update single attribute
 *
 * equals to `updateAttributes({name: value}, cb)
 *
 * @param {String} name - name of property
 * @param {Mixed} value - value of property
 * @param {Function} callback - callback called with (err, instance)
 */

DataModel.prototype.updateAttribute = function updateAttribute(name, value, callback) {
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

DataModel.prototype.updateAttributes = function updateAttributes(data, cb) {
  throwNotAttached(this.modelName, 'updateAttributes');
};

/**
 * Reload object from persistence
 *
 * @requires `id` member of `object` to be able to call `find`
 * @param {Function} callback - called with (err, instance) arguments
 */

DataModel.prototype.reload = function reload(callback) {
  throwNotAttached(this.constructor.modelName, 'reload');
};

/**
 * Set the correct `id` property for the `DataModel`. If a `Connector` defines
 * a `setId` method it will be used. Otherwise the default lookup is used. You
 * should override this method to handle complex ids.
 *
 * @param {*} val The `id` value. Will be converted to the type the id property
 * specifies.
 */

DataModel.prototype.setId = function(val) {
  var ds = this.getDataSource();
  this[this.getIdName()] = val;
}

/**
 * Get the `id` value for the `DataModel`.
 *
 * @returns {*} The `id` value
 */

DataModel.prototype.getId = function() {
  var data = this.toObject();
  if(!data) return;
  return data[this.getIdName()];
}

/**
 * Get the id property name of the constructor.
 *
 * @returns {String} The `id` property name
 */

DataModel.prototype.getIdName = function() {
  return this.constructor.getIdName();
}

/**
 * Get the id property name of the constructor.
 *
 * @returns {String} The `id` property name
 */

DataModel.getIdName = function() {
  var Model = this;
  var ds = Model.getDataSource();

  if(ds.idName) {
    return ds.idName(Model.modelName);
  } else {
    return 'id';
  }
}

DataModel.setupRemoting = function() {
  var DataModel = this;
  var typeName = DataModel.modelName;
  var options = DataModel.settings;

  function setRemoting(scope, name, options) {
    var fn = scope[name];
    options.isStatic = scope === DataModel;
    DataModel.remoteMethod(name, options);
  }

  setRemoting(DataModel, 'create', {
    description: 'Create a new instance of the model and persist it into the data source',
    accepts: {arg: 'data', type: 'object', description: 'Model instance data', http: {source: 'body'}},
    returns: {arg: 'data', type: typeName, root: true},
    http: {verb: 'post', path: '/'}
  });

  setRemoting(DataModel, 'upsert', {
    description: 'Update an existing model instance or insert a new one into the data source',
    accepts: {arg: 'data', type: 'object', description: 'Model instance data', http: {source: 'body'}},
    returns: {arg: 'data', type: typeName, root: true},
    http: {verb: 'put', path: '/'}
  });

  setRemoting(DataModel, 'exists', {
    description: 'Check whether a model instance exists in the data source',
    accepts: {arg: 'id', type: 'any', description: 'Model id', required: true},
    returns: {arg: 'exists', type: 'boolean'},
    http: {verb: 'get', path: '/:id/exists'}
  });

  setRemoting(DataModel, 'findById', {
    description: 'Find a model instance by id from the data source',
    accepts: {
      arg: 'id', type: 'any', description: 'Model id', required: true,
      http: {source: 'path'}
    },
    returns: {arg: 'data', type: typeName, root: true},
    http: {verb: 'get', path: '/:id'},
    rest: {after: convertNullToNotFoundError}
  });

  setRemoting(DataModel, 'find', {
    description: 'Find all instances of the model matched by filter from the data source',
    accepts: {arg: 'filter', type: 'object', description: 'Filter defining fields, where, orderBy, offset, and limit'},
    returns: {arg: 'data', type: [typeName], root: true},
    http: {verb: 'get', path: '/'}
  });

  setRemoting(DataModel, 'findOne', {
    description: 'Find first instance of the model matched by filter from the data source',
    accepts: {arg: 'filter', type: 'object', description: 'Filter defining fields, where, orderBy, offset, and limit'},
    returns: {arg: 'data', type: typeName, root: true},
    http: {verb: 'get', path: '/findOne'}
  });

  setRemoting(DataModel, 'destroyAll', {
    description: 'Delete all matching records',
    accepts: {arg: 'where', type: 'object', description: 'filter.where object'},
    http: {verb: 'del', path: '/'},
    shared: false
  });

  setRemoting(DataModel, 'removeById', {
    description: 'Delete a model instance by id from the data source',
    accepts: {arg: 'id', type: 'any', description: 'Model id', required: true,
              http: {source: 'path'}},
    http: {verb: 'del', path: '/:id'}
  });

  setRemoting(DataModel, 'count', {
    description: 'Count instances of the model matched by where from the data source',
    accepts: {arg: 'where', type: 'object', description: 'Criteria to match model instances'},
    returns: {arg: 'count', type: 'number'},
    http: {verb: 'get', path: '/count'}
  });

  setRemoting(DataModel.prototype, 'updateAttributes', {
    description: 'Update attributes for a model instance and persist it into the data source',
    accepts: {arg: 'data', type: 'object', http: {source: 'body'}, description: 'An object of model property name/value pairs'},
    returns: {arg: 'data', type: typeName, root: true},
    http: {verb: 'put', path: '/'}
  });

  if(options.trackChanges) {
    setRemoting(DataModel, 'diff', {
      description: 'Get a set of deltas and conflicts since the given checkpoint',
      accepts: [
        {arg: 'since', type: 'number', description: 'Find deltas since this checkpoint'},
        {arg: 'remoteChanges', type: 'array', description: 'an array of change objects',
         http: {source: 'body'}}
      ],      
      returns: {arg: 'result', type: 'object', root: true},
      http: {verb: 'post', path: '/diff'}
    });

    setRemoting(DataModel, 'changes', {
      description: 'Get the changes to a model since a given checkpoint.'
                 + 'Provide a filter object to reduce the number of results returned.',
      accepts: [
        {arg: 'since', type: 'number', description: 'Only return changes since this checkpoint'},
        {arg: 'filter', type: 'object', description: 'Only include changes that match this filter'}
      ],
      returns: {arg: 'changes', type: 'array', root: true},
      http: {verb: 'get', path: '/changes'}
    });
    
    setRemoting(DataModel, 'checkpoint', {
      description: 'Create a checkpoint.',
      returns: {arg: 'checkpoint', type: 'object', root: true},
      http: {verb: 'post', path: '/checkpoint'}
    });

    setRemoting(DataModel, 'currentCheckpoint', {
      description: 'Get the current checkpoint.',
      returns: {arg: 'checkpoint', type: 'object', root: true},
      http: {verb: 'get', path: '/checkpoint'}
    });

    setRemoting(DataModel, 'createUpdates', {
      description: 'Create an update list from a delta list',
      accepts: {arg: 'deltas', type: 'array', http: {source: 'body'}},
      returns: {arg: 'updates', type: 'array', root: true},
      http: {verb: 'post', path: '/create-updates'}
    });

    setRemoting(DataModel, 'bulkUpdate', {
      description: 'Run multiple updates at once. Note: this is not atomic.',
      accepts: {arg: 'updates', type: 'array'},
      http: {verb: 'post', path: '/bulk-update'}
    });

    setRemoting(DataModel, 'rectifyAllChanges', {
      description: 'Rectify all Model changes.',
      http: {verb: 'post', path: '/rectify-all'}
    });

    setRemoting(DataModel, 'rectifyChange', {
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

DataModel.diff = function(since, remoteChanges, callback) {
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

DataModel.changes = function(since, filter, callback) { 
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

DataModel.checkpoint = function(cb) {
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

DataModel.currentCheckpoint = function(cb) {
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

DataModel.replicate = function(since, targetModel, options, callback) {
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

DataModel.createUpdates = function(deltas, cb) {
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

DataModel.bulkUpdate = function(updates, callback) {
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

DataModel.getChangeModel = function() {
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

DataModel.getSourceId = function(cb) {
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

DataModel.enableChangeTracking = function() {
  var Model = this;
  var Change = this.Change || this._defineChangeModel();
  var cleanupInterval = Model.settings.changeCleanupInterval || 30000;

  assert(this.dataSource, 'Cannot enableChangeTracking(): ' + this.modelName
    + ' is not attached to a dataSource');

  Change.attachTo(this.dataSource);
  Change.getCheckpointModel().attachTo(this.dataSource);

  Model.on('changed', function(obj) {
    Model.rectifyChange(obj.getId(), Model.handleChangeError);
  });

  Model.on('deleted', function(id) {
    Model.rectifyChange(id, Model.handleChangeError);
  });

  Model.on('deletedAll', cleanup);

  if(loopback.isServer) {
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

DataModel._defineChangeModel = function() {
  var BaseChangeModel = require('./change');
  return this.Change = BaseChangeModel.extend(this.modelName + '-change',
    {},
    {
      trackModel: this
    }
  );
}

DataModel.rectifyAllChanges = function(callback) {
  this.getChangeModel().rectifyAll(callback);
}

/**
 * Handle a change error. Override this method in a subclassing model to customize
 * change error handling.
 *
 * @param {Error} err
 */

DataModel.handleChangeError = function(err) {
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

DataModel.rectifyChange = function(id, callback) {
  var Change = this.getChangeModel();
  Change.rectifyModelChanges(this.modelName, [id], callback);
}

DataModel.setup();
