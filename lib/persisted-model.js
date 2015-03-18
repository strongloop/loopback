/*!
 * Module Dependencies.
 */

var Model = require('./model');
var registry = require('./registry');
var runtime = require('./runtime');
var assert = require('assert');
var async = require('async');
var deprecated = require('depd')('loopback');
var debug = require('debug')('loopback:persisted-model');

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
 */

var PersistedModel = module.exports = Model.extend('PersistedModel');

/*!
 * Setup the `PersistedModel` constructor.
 */

PersistedModel.setup = function setupPersistedModel() {
  // call Model.setup first
  Model.setup.call(this);

  var PersistedModel = this;

  // enable change tracking (usually for replication)
  if (this.settings.trackChanges) {
    PersistedModel._defineChangeModel();
    PersistedModel.once('dataSourceAttached', function() {
      PersistedModel.enableChangeTracking();
    });
  }

  PersistedModel.setupRemoting();
};

/*!
 * Throw an error telling the user that the method is not available and why.
 */

function throwNotAttached(modelName, methodName) {
  throw new Error(
    'Cannot call ' + modelName + '.' + methodName + '().' +
    ' The ' + methodName + ' method has not been setup.' +
    ' The PersistedModel has not been correctly attached to a DataSource!'
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
  error.code = 'MODEL_NOT_FOUND';
  cb(error);
}

/**
 * Create new instance of Model, and save to database.
 *
 * @param {Object}|[{Object}] data Optional data argument.  Can be either a single model instance or an array of instances.
 *
 * @callback {Function} callback Callback function called with `cb(err, obj)` signature.
 * @param {Error} err Error object; see [Error object](http://docs.strongloop.com/display/LB/Error+object).
 * @param {Object} models Model instances or null.
 */

PersistedModel.create = function(data, callback) {
  throwNotAttached(this.modelName, 'create');
};

/**
 * Update or insert a model instance
 * @param {Object} data The model instance data to insert.
 * @callback {Function} callback Callback function called with `cb(err, obj)` signature.
 * @param {Error} err Error object; see [Error object](http://docs.strongloop.com/display/LB/Error+object).
 * @param {Object} model Updated model instance.
 */

PersistedModel.upsert = PersistedModel.updateOrCreate = function upsert(data, callback) {
  throwNotAttached(this.modelName, 'upsert');
};

/**
 * Find one record matching the optional `where` filter. The same as `find`, but limited to one object.
 * Returns an object, not collection.
 * If not found, create the object using data provided as second argument.
 *
 * @param {Object} where Where clause, such as `{where: {test: 'me'}}`
 * <br/>see [Where filter](http://docs.strongloop.com/display/public/LB/Where+filter).
 * @param {Object} data Data to insert if object matching the `where` filter is not found.
 * @callback {Function} callback Callback function called with `cb(err, instance)` arguments.  Required.
 * @param {Error} err Error object; see [Error object](http://docs.strongloop.com/display/LB/Error+object).
 * @param {Object} instance Model instance matching the `where` filter, if found.
 */

PersistedModel.findOrCreate = function findOrCreate(query, data, callback) {
  throwNotAttached(this.modelName, 'findOrCreate');
};

PersistedModel.findOrCreate._delegate = true;

/**
 * Check whether a model instance exists in database.
 *
 * @param {id} id Identifier of object (primary key value).
 *
 * @callback {Function} callback Callback function called with `(err, exists)` arguments.  Required.
 * @param {Error} err Error object; see [Error object](http://docs.strongloop.com/display/LB/Error+object).
 * @param {Boolean} exists True if the instance with the specified ID exists; false otherwise.
 */

PersistedModel.exists = function exists(id, cb) {
  throwNotAttached(this.modelName, 'exists');
};

/**
 * Find object by ID.
 *
 * @param {*} id Primary key value
 * @callback {Function} callback Callback function called with `(err, instance)` arguments.  Required.
 * @param {Error} err Error object; see [Error object](http://docs.strongloop.com/display/LB/Error+object).
 * @param {Object} instance Model instance matching the specified ID or null if no instance matches.
 */

PersistedModel.findById = function find(id, cb) {
  throwNotAttached(this.modelName, 'findById');
};

/**
 * Find all model instances that match `filter` specification.
 * See [Querying models](http://docs.strongloop.com/display/LB/Querying+models).
 *
 * @options {Object} [filter] Optional Filter JSON object; see below.
 * @property {String|Object|Array} fields Identify fields to include in return result.
 * <br/>See [Fields filter](http://docs.strongloop.com/display/LB/Fields+filter).
 * @property {String|Object|Array} include  See PersistedModel.include documentation.
 * <br/>See [Include filter](http://docs.strongloop.com/display/LB/Include+filter).
 * @property {Number} limit Maximum number of instances to return.
 * <br/>See [Limit filter](http://docs.strongloop.com/display/LB/Limit+filter).
 * @property {String} order Sort order: either "ASC" for ascending or "DESC" for descending.
 * <br/>See [Order filter](http://docs.strongloop.com/display/LB/Order+filter).
 * @property {Number} skip Number of results to skip.
 * <br/>See [Skip filter](http://docs.strongloop.com/display/LB/Skip+filter).
 * @property {Object} where Where clause, like
 * ```
 * { key: val, key2: {gt: 'val2'}, ...}
 * ```
 * <br/>See [Where filter](http://docs.strongloop.com/display/LB/Where+filter).
 *
 * @callback {Function} callback Callback function called with `(err, returned-instances)` arguments.    Required.
 * @param {Error} err Error object; see [Error object](http://docs.strongloop.com/display/LB/Error+object).
 * @param {Array} models Model instances matching the filter, or null if none found.
 */

PersistedModel.find = function find(params, cb) {
  throwNotAttached(this.modelName, 'find');
};

/**
 * Find one model instance that matches `filter` specification.
 * Same as `find`, but limited to one result;
 * Returns object, not collection.
 *
 * @options {Object} [filter] Optional Filter JSON object; see below.
 * @property {String|Object|Array} fields Identify fields to include in return result.
 * <br/>See [Fields filter](http://docs.strongloop.com/display/LB/Fields+filter).
 * @property {String|Object|Array} include  See PersistedModel.include documentation.
 * <br/>See [Include filter](http://docs.strongloop.com/display/LB/Include+filter).
 * @property {String} order Sort order: either "ASC" for ascending or "DESC" for descending.
 * <br/>See [Order filter](http://docs.strongloop.com/display/LB/Order+filter).
 * @property {Number} skip Number of results to skip.
 * <br/>See [Skip filter](http://docs.strongloop.com/display/LB/Skip+filter).
 * @property {Object} where Where clause, like
 * ```
 * { key: val, key2: {gt: 'val2'}, ...}
 * ```
 * <br/>See [Where filter](http://docs.strongloop.com/display/LB/Where+filter).
 *
 * @callback {Function} callback Callback function called with `(err, returned-instance)` arguments.  Required.
 * @param {Error} err Error object; see [Error object](http://docs.strongloop.com/display/LB/Error+object).
 * @param {Array} model First model instance that matches the filter or null if none found.
 */

PersistedModel.findOne = function findOne(params, cb) {
  throwNotAttached(this.modelName, 'findOne');
};

/**
 * Destroy all model instances that match the optional `where` specification.
 *
 * @param {Object} [where] Optional where filter, like:
 * ```
 * { key: val, key2: {gt: 'val2'}, ...}
 * ```
 * <br/>See [Where filter](http://docs.strongloop.com/display/LB/Where+filter).
 *
 * @callback {Function} callback Optional callback function called with `(err)` argument.
 * @param {Error} err Error object; see [Error object](http://docs.strongloop.com/display/LB/Error+object).
 */

PersistedModel.destroyAll = function destroyAll(where, cb) {
  throwNotAttached(this.modelName, 'destroyAll');
};

/**
 * Alias for `destroyAll`
 */
PersistedModel.remove = PersistedModel.destroyAll;

/**
 * Alias for `destroyAll`
 */
PersistedModel.deleteAll = PersistedModel.destroyAll;

/**
 * Update multiple instances that match the where clause.
 *
 * Example:
 *
 *```js
 * Employee.updateAll({managerId: 'x001'}, {managerId: 'x002'}, function(err, count) {
 *     ...
 * });
 * ```
 *
 * @param {Object} [where] Optional `where` filter, like
 * ```
 * { key: val, key2: {gt: 'val2'}, ...}
 * ```
 * <br/>see [Where filter](http://docs.strongloop.com/display/public/LB/Where+filter).
 * @param {Object} data Object containing data to replace matching instances, if any.
 *
 * @callback {Function} callback Callback function called with `(err, count)` arguments.  Required.
 * @param {Error} err Error object; see [Error object](http://docs.strongloop.com/display/LB/Error+object).
 * @param {Number} count Number of instances updated.
 *
 */
PersistedModel.updateAll = function updateAll(where, data, cb) {
  throwNotAttached(this.modelName, 'updateAll');
};

/**
 * Alias for updateAll.
 */
PersistedModel.update = PersistedModel.updateAll;

/**
 * Destroy model instance with the specified ID.
 * @param {*} id The ID value of model instance to delete.
 * @callback {Function} callback Callback function called with `(err)` arguments.  Required.
 * @param {Error} err Error object; see [Error object](http://docs.strongloop.com/display/LB/Error+object).
 */
PersistedModel.destroyById = function deleteById(id, cb) {
  throwNotAttached(this.modelName, 'deleteById');
};

/**
 * Alias for destroyById.
 */
PersistedModel.removeById = PersistedModel.destroyById;

/**
 * Alias for destroyById.
 */
PersistedModel.deleteById = PersistedModel.destroyById;

/**
 * Return the number of records that match the optional "where" filter.
 * @parame {Object} [where] Optional where filter, like
 * ```
 * { key: val, key2: {gt: 'val2'}, ...}
 * ```
 * <br/>See [Where filter](http://docs.strongloop.com/display/LB/Where+filter).
 * @callback {Function} callback Callback function called with `(err, count)` arguments.  Required.
 * @param {Error} err Error object; see [Error object](http://docs.strongloop.com/display/LB/Error+object).
 * @param {Number} count Number of instances updated.
 */

PersistedModel.count = function(where, cb) {
  throwNotAttached(this.modelName, 'count');
};

/**
 * Save model instance. If the instance doesn't have an ID, then calls [create](#persistedmodelcreatedata-cb) instead.
 * Triggers: validate, save, update, or create.
 * @options {Object} [options] See below.
 * @property {Boolean} validate Perform validation before saving.  Default is true.
 * @property {Boolean} throws If true, throw a validation error; WARNING: This can crash Node.
 * If false, report the error via callback.  Default is false.
 * @callback {Function} callback Optional callback function called with `(err, obj)` arguments.
 * @param {Error} err Error object; see [Error object](http://docs.strongloop.com/display/LB/Error+object).
 * @param {Object} instance Model instance saved or created.
 */

PersistedModel.prototype.save = function(options, callback) {
  var Model = this.constructor;

  if (typeof options == 'function') {
    callback = options;
    options = {};
  }

  callback = callback || function() {
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

  inst.isValid(function(valid) {
    if (valid) {
      save();
    } else {
      var err = new Model.ValidationError(inst);
      // throws option is dangerous for async usage
      if (options.throws) {
        throw err;
      }
      callback(err, inst);
    }
  });

  // then save
  function save() {
    inst.trigger('save', function(saveDone) {
      inst.trigger('update', function(updateDone) {
        Model.upsert(inst, function(err) {
          inst._initProperties(data);
          updateDone.call(inst, function() {
            saveDone.call(inst, function() {
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
 * @returns {Boolean} Returns true if the data model is new; false otherwise.
 */

PersistedModel.prototype.isNewRecord = function() {
  throwNotAttached(this.constructor.modelName, 'isNewRecord');
};

/**
 * Deletes the model from persistence.
 * Triggers `destroy` hook (async) before and after destroying object.
 * @param {Function} callback Callback function.
 */

PersistedModel.prototype.destroy = function(cb) {
  throwNotAttached(this.constructor.modelName, 'destroy');
};

/**
 * Alias for destroy.
 * @header PersistedModel.remove
 */
PersistedModel.prototype.remove = PersistedModel.prototype.destroy;

/**
 * Alias for destroy.
 * @header PersistedModel.delete
 */
PersistedModel.prototype.delete = PersistedModel.prototype.destroy;

PersistedModel.prototype.destroy._delegate = true;

/**
 * Update a single attribute.
 * Equivalent to `updateAttributes({name: 'value'}, cb)`
 *
 * @param {String} name Name of property.
 * @param {Mixed} value Value of property.
 * @callback {Function} callback Callback function called with `(err, instance)` arguments.  Required.
 * @param {Error} err Error object; see [Error object](http://docs.strongloop.com/display/LB/Error+object).
 * @param {Object} instance Updated instance.
 */

PersistedModel.prototype.updateAttribute = function updateAttribute(name, value, callback) {
  throwNotAttached(this.constructor.modelName, 'updateAttribute');
};

/**
 * Update set of attributes.  Performs validation before updating.
 *
 * Triggers: `validation`, `save` and `update` hooks
 * @param {Object} data Dta to update.
 * @callback {Function} callback Callback function called with `(err, instance)` arguments.  Required.
 * @param {Error} err Error object; see [Error object](http://docs.strongloop.com/display/LB/Error+object).
 * @param {Object} instance Updated instance.
 */

PersistedModel.prototype.updateAttributes = function updateAttributes(data, cb) {
  throwNotAttached(this.modelName, 'updateAttributes');
};

/**
 * Reload object from persistence.  Requires `id` member of `object` to be able to call `find`.
 * @callback {Function} callback Callback function called with `(err, instance)` arguments.  Required.
 * @param {Error} err Error object; see [Error object](http://docs.strongloop.com/display/LB/Error+object).
 * @param {Object} instance Model instance.
 */

PersistedModel.prototype.reload = function reload(callback) {
  throwNotAttached(this.constructor.modelName, 'reload');
};

/**
 * Set the correct `id` property for the `PersistedModel`. Uses the `setId` method if the model is attached to
 * connector that defines it.  Otherwise, uses the default lookup.
 * Override this method to handle complex IDs.
 *
 * @param {*} val The `id` value. Will be converted to the type that the `id` property specifies.
 */

PersistedModel.prototype.setId = function(val) {
  var ds = this.getDataSource();
  this[this.getIdName()] = val;
};

/**
 * Get the `id` value for the `PersistedModel`.
 *
 * @returns {*} The `id` value
 */

PersistedModel.prototype.getId = function() {
  var data = this.toObject();
  if (!data) return;
  return data[this.getIdName()];
};

/**
 * Get the `id` property name of the constructor.
 *
 * @returns {String} The `id` property name
 */

PersistedModel.prototype.getIdName = function() {
  return this.constructor.getIdName();
};

/**
 * Get the `id` property name of the constructor.
 *
 * @returns {String} The `id` property name
 */

PersistedModel.getIdName = function() {
  var Model = this;
  var ds = Model.getDataSource();

  if (ds.idName) {
    return ds.idName(Model.modelName);
  } else {
    return 'id';
  }
};

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
    accessType: 'WRITE',
    accepts: {arg: 'data', type: 'object', description: 'Model instance data', http: {source: 'body'}},
    returns: {arg: 'data', type: typeName, root: true},
    http: {verb: 'post', path: '/'}
  });

  setRemoting(PersistedModel, 'upsert', {
    aliases: ['updateOrCreate'],
    description: 'Update an existing model instance or insert a new one into the data source',
    accessType: 'WRITE',
    accepts: {arg: 'data', type: 'object', description: 'Model instance data', http: {source: 'body'}},
    returns: {arg: 'data', type: typeName, root: true},
    http: {verb: 'put', path: '/'}
  });

  setRemoting(PersistedModel, 'exists', {
    description: 'Check whether a model instance exists in the data source',
    accessType: 'READ',
    accepts: {arg: 'id', type: 'any', description: 'Model id', required: true},
    returns: {arg: 'exists', type: 'boolean'},
    http: [
      {verb: 'get', path: '/:id/exists'},
      {verb: 'head', path: '/:id'}
    ],
    rest: {
      // After hook to map exists to 200/404 for HEAD
      after: function(ctx, cb) {
        if (ctx.req.method === 'GET') {
          // For GET, return {exists: true|false} as is
          return cb();
        }
        if (!ctx.result.exists) {
          var modelName = ctx.method.sharedClass.name;
          var id = ctx.getArgByName('id');
          var msg = 'Unknown "' + modelName + '" id "' + id + '".';
          var error = new Error(msg);
          error.statusCode = error.status = 404;
          error.code = 'MODEL_NOT_FOUND';
          cb(error);
        } else {
          cb();
        }
      }
    }
  });

  setRemoting(PersistedModel, 'findById', {
    description: 'Find a model instance by id from the data source',
    accessType: 'READ',
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
    accessType: 'READ',
    accepts: {arg: 'filter', type: 'object', description: 'Filter defining fields, where, orderBy, offset, and limit'},
    returns: {arg: 'data', type: [typeName], root: true},
    http: {verb: 'get', path: '/'}
  });

  setRemoting(PersistedModel, 'findOne', {
    description: 'Find first instance of the model matched by filter from the data source',
    accessType: 'READ',
    accepts: {arg: 'filter', type: 'object', description: 'Filter defining fields, where, orderBy, offset, and limit'},
    returns: {arg: 'data', type: typeName, root: true},
    http: {verb: 'get', path: '/findOne'},
    rest: {after: convertNullToNotFoundError}
  });

  setRemoting(PersistedModel, 'destroyAll', {
    description: 'Delete all matching records',
    accessType: 'WRITE',
    accepts: {arg: 'where', type: 'object', description: 'filter.where object'},
    http: {verb: 'del', path: '/'},
    shared: false
  });

  setRemoting(PersistedModel, 'updateAll', {
    aliases: ['update'],
    description: 'Update instances of the model matched by where from the data source',
    accessType: 'WRITE',
    accepts: [
      {arg: 'where', type: 'object', http: {source: 'query'},
        description: 'Criteria to match model instances'},
      {arg: 'data', type: 'object', http: {source: 'body'},
        description: 'An object of model property name/value pairs'},
    ],
    http: {verb: 'post', path: '/update'}
  });

  setRemoting(PersistedModel, 'deleteById', {
    aliases: ['destroyById', 'removeById'],
    description: 'Delete a model instance by id from the data source',
    accessType: 'WRITE',
    accepts: {arg: 'id', type: 'any', description: 'Model id', required: true,
              http: {source: 'path'}},
    http: {verb: 'del', path: '/:id'}
  });

  setRemoting(PersistedModel, 'count', {
    description: 'Count instances of the model matched by where from the data source',
    accessType: 'READ',
    accepts: {arg: 'where', type: 'object', description: 'Criteria to match model instances'},
    returns: {arg: 'count', type: 'number'},
    http: {verb: 'get', path: '/count'}
  });

  setRemoting(PersistedModel.prototype, 'updateAttributes', {
    description: 'Update attributes for a model instance and persist it into the data source',
    accessType: 'WRITE',
    accepts: {arg: 'data', type: 'object', http: {source: 'body'}, description: 'An object of model property name/value pairs'},
    returns: {arg: 'data', type: typeName, root: true},
    http: {verb: 'put', path: '/'}
  });

  if (options.trackChanges) {
    setRemoting(PersistedModel, 'diff', {
      description: 'Get a set of deltas and conflicts since the given checkpoint',
      accessType: 'READ',
      accepts: [
        {arg: 'since', type: 'number', description: 'Find deltas since this checkpoint'},
        {arg: 'remoteChanges', type: 'array', description: 'an array of change objects',
         http: {source: 'body'}}
      ],
      returns: {arg: 'result', type: 'object', root: true},
      http: {verb: 'post', path: '/diff'}
    });

    setRemoting(PersistedModel, 'changes', {
      description: 'Get the changes to a model since a given checkpoint.' +
        'Provide a filter object to reduce the number of results returned.',
      accessType: 'READ',
      accepts: [
        {arg: 'since', type: 'number', description: 'Only return changes since this checkpoint'},
        {arg: 'filter', type: 'object', description: 'Only include changes that match this filter'}
      ],
      returns: {arg: 'changes', type: 'array', root: true},
      http: {verb: 'get', path: '/changes'}
    });

    setRemoting(PersistedModel, 'checkpoint', {
      description: 'Create a checkpoint.',
      accessType: 'WRITE',
      returns: {arg: 'checkpoint', type: 'object', root: true},
      http: {verb: 'post', path: '/checkpoint'}
    });

    setRemoting(PersistedModel, 'currentCheckpoint', {
      description: 'Get the current checkpoint.',
      accessType: 'READ',
      returns: {arg: 'checkpoint', type: 'object', root: true},
      http: {verb: 'get', path: '/checkpoint'}
    });

    setRemoting(PersistedModel, 'createUpdates', {
      description: 'Create an update list from a delta list',
      accessType: 'WRITE',
      accepts: {arg: 'deltas', type: 'array', http: {source: 'body'}},
      returns: {arg: 'updates', type: 'array', root: true},
      http: {verb: 'post', path: '/create-updates'}
    });

    setRemoting(PersistedModel, 'bulkUpdate', {
      description: 'Run multiple updates at once. Note: this is not atomic.',
      accessType: 'WRITE',
      accepts: {arg: 'updates', type: 'array'},
      http: {verb: 'post', path: '/bulk-update'}
    });

    setRemoting(PersistedModel, 'rectifyAllChanges', {
      description: 'Rectify all Model changes.',
      accessType: 'WRITE',
      http: {verb: 'post', path: '/rectify-all'}
    });

    setRemoting(PersistedModel, 'rectifyChange', {
      description: 'Tell loopback that a change to the model with the given id has occurred.',
      accessType: 'WRITE',
      accepts: {arg: 'id', type: 'any', http: {source: 'path'}},
      http: {verb: 'post', path: '/:id/rectify-change'}
    });
  }
};

/**
 * Get a set of deltas and conflicts since the given checkpoint.
 *
 * See [Change.diff()](#change-diff) for details.
 *
 * @param  {Number}  since  Find deltas since this checkpoint.
 * @param  {Array}  remoteChanges  An array of change objects.
 * @callback {Function} callback Callback function called with `(err, result)` arguments.  Required.
 * @param {Error} err Error object; see [Error object](http://docs.strongloop.com/display/LB/Error+object).
 * @param {Object} result Object with `deltas` and `conflicts` properties; see [Change.diff()](#change-diff) for details.
 */

PersistedModel.diff = function(since, remoteChanges, callback) {
  var Change = this.getChangeModel();
  Change.diff(this.modelName, since, remoteChanges, callback);
};

/**
 * Get the changes to a model since the specified checkpoint. Provide a filter object
 * to reduce the number of results returned.
 * @param  {Number}   since    Return only changes since this checkpoint.
 * @param  {Object}   filter   Include only changes that match this filter, the same as for [#persistedmodel-find](find()).
 * @callback {Function} callback Callback function called with `(err, changes)` arguments.  Required.
 * @param {Error} err Error object; see [Error object](http://docs.strongloop.com/display/LB/Error+object).
 * @param {Array} changes An array of [Change](#change) objects.
 */

PersistedModel.changes = function(since, filter, callback) {
  if (typeof since === 'function') {
    filter = {};
    callback = since;
    since = -1;
  }
  if (typeof filter === 'function') {
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
  Change.find({ where: {
    checkpoint: { gte: since },
    modelName: this.modelName
  }}, function(err, changes) {
    if (err) return callback(err);
    if (!Array.isArray(changes) || changes.length === 0) return callback(null, []);
    var ids = changes.map(function(change) {
      return change.getModelId();
    });
    filter.where[idName] = {inq: ids};
    model.find(filter, function(err, models) {
      if (err) return callback(err);
      var modelIds = models.map(function(m) {
        return m[idName].toString();
      });
      callback(null, changes.filter(function(ch) {
        if (ch.type() === Change.DELETE) return true;
        return modelIds.indexOf(ch.modelId) > -1;
      }));
    });
  });
};

/**
 * Create a checkpoint.
 *
 * @param  {Function} callback
 */

PersistedModel.checkpoint = function(cb) {
  var Checkpoint = this.getChangeModel().getCheckpointModel();
  this.getSourceId(function(err, sourceId) {
    if (err) return cb(err);
    Checkpoint.create({
      sourceId: sourceId
    }, cb);
  });
};

/**
 * Get the current checkpoint ID.
 *
 * @callback {Function} callback Callback function called with `(err, currentCheckpointId)` arguments.  Required.
 * @param {Error} err Error object; see [Error object](http://docs.strongloop.com/display/LB/Error+object).
 * @param {Number} currentCheckpointId Current checkpoint ID.
 */

PersistedModel.currentCheckpoint = function(cb) {
  var Checkpoint = this.getChangeModel().getCheckpointModel();
  Checkpoint.current(cb);
};

/**
 * Replicate changes since the given checkpoint to the given target model.
 *
 * @param  {Number}   [since]  Since this checkpoint
 * @param  {Model}    targetModel  Target this model class
 * @param  {Object} [options]
 * @param {Object} [options.filter] Replicate models that match this filter
 * @callback {Function} [callback] Callback function called with `(err, conflicts)` arguments.
 * @param {Error} err Error object; see [Error object](http://docs.strongloop.com/display/LB/Error+object).
 * @param {Conflict[]} conflicts A list of changes that could not be replicated due to conflicts.
 */

PersistedModel.replicate = function(since, targetModel, options, callback) {
  var lastArg = arguments[arguments.length - 1];

  if (typeof lastArg === 'function' && arguments.length > 1) {
    callback = lastArg;
  }

  if (typeof since === 'function' && since.modelName) {
    targetModel = since;
    since = -1;
  }

  if (typeof since !== 'object') {
    since = { source: since, target: since };
  }

  options = options || {};

  var sourceModel = this;
  callback = callback || function defaultReplicationCallback(err) {
    if (err) throw err;
  };

  debug('replicating %s since %s to %s since %s',
    sourceModel.modelName,
    since.source,
    targetModel.modelName,
    since.target);
  if (options.filter) {
    debug('\twith filter %j', options.filter);
  }

  // In order to avoid a race condition between the replication and
  // other clients modifying the data, we must create the new target
  // checkpoint as the first step of the replication process.
  // As a side-effect of that, the replicated changes are associated
  // with the new target checkpoint. This is actually desired behaviour,
  // because that way clients replicating *from* the target model
  // since the new checkpoint will pick these changes up.
  // However, it increases the likelihood of (false) conflicts being detected.
  // In order to prevent that, we run the replication multiple times,
  // until no changes were replicated, but at most MAX_ATTEMPTS times
  // to prevent starvation. In most cases, the second run will find no changes
  // to replicate and we are done.
  var MAX_ATTEMPTS = 3;

  run(1, since);

  function run(attempt, since) {
    debug('\titeration #%s', attempt);
    tryReplicate(sourceModel, targetModel, since, options, next);

    function next(err, conflicts, cps, updates) {
      var finished = err || conflicts.length ||
        !updates || updates.length === 0 ||
        attempt >= MAX_ATTEMPTS;

      if (finished)
        return callback(err, conflicts, cps);
      run(attempt + 1, cps);
    }
  }
};

function tryReplicate(sourceModel, targetModel, since, options, callback) {
  var Change = sourceModel.getChangeModel();
  var TargetChange = targetModel.getChangeModel();
  var changeTrackingEnabled = Change && TargetChange;

  assert(
    changeTrackingEnabled,
    'You must enable change tracking before replicating'
  );

  var diff;
  var updates;
  var newSourceCp, newTargetCp;

  var tasks = [
    checkpoints,
    getSourceChanges,
    getDiffFromTarget,
    createSourceUpdates,
    bulkUpdate
  ];

  async.waterfall(tasks, done);

  function getSourceChanges(cb) {
    sourceModel.changes(since.source, options.filter, debug.enabled ? log : cb);

    function log(err, result) {
      if (err) return cb(err);
      debug('\tusing source changes');
      result.forEach(function(it) { debug('\t\t%j', it); });
      cb(err, result);
    }
  }

  function getDiffFromTarget(sourceChanges, cb) {
    targetModel.diff(since.target, sourceChanges, debug.enabled ? log : cb);

    function log(err, result) {
      if (err) return cb(err);
      if (result.conflicts && result.conflicts.length) {
        debug('\tdiff conflicts');
        result.conflicts.forEach(function(d) { debug('\t\t%j', d); });
      }
      if (result.deltas && result.deltas.length) {
        debug('\tdiff deltas');
        result.deltas.forEach(function(it) { debug('\t\t%j', it); });
      }
      cb(err, result);
    }
  }

  function createSourceUpdates(_diff, cb) {
    diff = _diff;
    diff.conflicts = diff.conflicts || [];
    if (diff && diff.deltas && diff.deltas.length) {
      debug('\tbuilding a list of updates');
      sourceModel.createUpdates(diff.deltas, cb);
    } else {
      // nothing to replicate
      done();
    }
  }

  function bulkUpdate(_updates, cb) {
    debug('\tstarting bulk update');
    updates = _updates;
    targetModel.bulkUpdate(updates, cb);
  }

  function checkpoints() {
    var cb = arguments[arguments.length - 1];
    sourceModel.checkpoint(function(err, source) {
      newSourceCp = source.seq;
      targetModel.checkpoint(function(err, target) {
        newTargetCp = target.seq;
        debug('\tcreated checkpoints');
        debug('\t\t%s for source model %s', newSourceCp, sourceModel.modelName);
        debug('\t\t%s for target model %s', newTargetCp, targetModel.modelName);
        cb(err);
      });
    });
  }

  function done(err) {
    if (err) return callback(err);

    debug('\treplication finished');
    debug('\t\t%s conflict(s) detected', diff.conflicts.length);
    debug('\t\t%s change(s) applied', +(updates && updates.length));
    debug('\t\tnew checkpoints: { source: %j, target: %j }',
      newSourceCp, newTargetCp);

    var conflicts = diff.conflicts.map(function(change) {
      return new Change.Conflict(
        change.modelId, sourceModel, targetModel
      );
    });

    if (conflicts.length) {
      sourceModel.emit('conflicts', conflicts);
    }

    if (callback) {
      var newCheckpoints = { source: newSourceCp, target: newTargetCp };
      callback(null, conflicts, newCheckpoints, updates);
    }
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
    change = new Change(change);
    var type = change.type();
    var update = {type: type, change: change};
    switch (type) {
      case Change.CREATE:
      case Change.UPDATE:
        tasks.push(function(cb) {
          Model.findById(change.modelId, function(err, inst) {
            if (err) return cb(err);
            if (!inst) {
              console.error('missing data for change:', change);
              return cb &&
                cb(new Error('missing data for change: ' + change.modelId));
            }
            if (inst.toObject) {
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
    if (err) return cb(err);
    cb(null, updates);
  });
};

/**
 * Apply an update list.
 *
 * **Note: this is not atomic**
 *
 * @param  {Array} updates An updates list, usually from [createUpdates()](#persistedmodel-createupdates).
 * @param  {Function} callback Callback function.
 */

PersistedModel.bulkUpdate = function(updates, callback) {
  var tasks = [];
  var Model = this;
  var idName = this.dataSource.idName(this.modelName);
  var Change = this.getChangeModel();

  updates.forEach(function(update) {
    switch (update.type) {
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
};

/**
 * Get the `Change` model.
 * Throws an error if the change model is not correctly setup.
 * @return {Change}
 */

PersistedModel.getChangeModel = function() {
  var changeModel = this.Change;
  var isSetup = changeModel && changeModel.dataSource;

  assert(isSetup, 'Cannot get a setup Change model');

  return changeModel;
};

/**
 * Get the source identifier for this model or dataSource.
 *
 * @callback {Function} callback Callback function called with `(err, id)` arguments.
 * @param {Error} err Error object; see [Error object](http://docs.strongloop.com/display/LB/Error+object).
 * @param {String} sourceId Source identifier for the model or dataSource.
 */

PersistedModel.getSourceId = function(cb) {
  var dataSource = this.dataSource;
  if (!dataSource) {
    this.once('dataSourceAttached', this.getSourceId.bind(this, cb));
  }
  assert(
    dataSource.connector.name,
    'Model.getSourceId: cannot get id without dataSource.connector.name'
  );
  var id = [dataSource.connector.name, this.modelName].join('-');
  cb(null, id);
};

/**
 * Enable the tracking of changes made to the model. Usually for replication.
 */

PersistedModel.enableChangeTracking = function() {
  var Model = this;
  var Change = this.Change || this._defineChangeModel();
  var cleanupInterval = Model.settings.changeCleanupInterval || 30000;

  assert(this.dataSource, 'Cannot enableChangeTracking(): ' + this.modelName +
    ' is not attached to a dataSource');

  var idName = this.getIdName();
  var idProp = this.definition.properties[idName];
  var idType = idProp && idProp.type;
  var idDefn = idProp && idProp.defaultFn;
  if (idType !== String || !(idDefn === 'uuid' || idDefn === 'guid')) {
    deprecated('The model ' + this.modelName + ' is tracking changes, ' +
      'which requries a string id with GUID/UUID default value.');
  }

  Change.attachTo(this.dataSource);
  Change.getCheckpointModel().attachTo(this.dataSource);

  Model.observe('after save', rectifyOnSave);

  Model.observe('after delete', rectifyOnDelete);

  if (runtime.isServer) {
    // initial cleanup
    cleanup();

    // cleanup
    setInterval(cleanup, cleanupInterval);
  }

  function cleanup() {
    Model.rectifyAllChanges(function(err) {
      if (err) {
        console.error(Model.modelName + ' Change Cleanup Error:');
        console.error(err);
      }
    });
  }
};

function rectifyOnSave(ctx, next) {
  if (ctx.instance) {
    ctx.Model.rectifyChange(ctx.instance.getId(), reportErrorAndNext);
  } else {
    ctx.Model.rectifyAllChanges(reportErrorAndNext);
  }

  function reportErrorAndNext(err) {
    if (err) {
      console.error(
        ctx.Model.modelName + '.rectifyChange(s) after save failed:' + err);
    }
    next();
  }
}

function rectifyOnDelete(ctx, next) {
  var id = getIdFromWhereByModelId(ctx.Model, ctx.where);
  if (id) {
    ctx.Model.rectifyChange(id, reportErrorAndNext);
  } else {
    ctx.Model.rectifyAllChanges(reportErrorAndNext);
  }

  function reportErrorAndNext(err) {
    if (err) {
      console.error(
        ctx.Model.modelName + '.rectifyChange(s) after delete failed:' + err);
    }
    next();
  }
}

function getIdFromWhereByModelId(Model, where) {
  var whereKeys = Object.keys(where);
  if (whereKeys.length != 1) return undefined;

  var idName = Model.getIdName();
  if (whereKeys[0] !== idName) return undefined;

  var id = where[idName];
  // TODO(bajtos) support object values that are not LB conditions
  if (typeof id === 'string' || typeof id === 'number') {
    return id;
  }
  return undefined;
}

PersistedModel._defineChangeModel = function() {
  var BaseChangeModel = registry.getModel('Change');
  assert(BaseChangeModel,
    'Change model must be defined before enabling change replication');

  this.Change = BaseChangeModel.extend(this.modelName + '-change',
    {},
    {
      trackModel: this
    }
  );

  return this.Change;
};

PersistedModel.rectifyAllChanges = function(callback) {
  this.getChangeModel().rectifyAll(callback);
};

/**
 * Handle a change error. Override this method in a subclassing model to customize
 * change error handling.
 *
 * @param {Error} err Error object; see [Error object](http://docs.strongloop.com/display/LB/Error+object).
 */

PersistedModel.handleChangeError = function(err) {
  if (err) {
    console.error(Model.modelName + ' Change Tracking Error:');
    console.error(err);
  }
};

/**
 * Specify that a change to the model with the given ID has occurred.
 *
 * @param {*} id The ID of the model that has changed.
 * @callback {Function} callback
 * @param {Error} err
 */

PersistedModel.rectifyChange = function(id, callback) {
  var Change = this.getChangeModel();
  Change.rectifyModelChanges(this.modelName, [id], callback);
};

PersistedModel.setup();
