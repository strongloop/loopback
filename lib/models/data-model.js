/*!
 * Module Dependencies.
 */
var Model = require('./model');
var DataAccess = require('loopback-datasource-juggler/lib/dao');

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
 * Configure the remoting attributes for a given function
 * @param {Function} fn The function
 * @param {Object} options The options
 * @private
 */

function setRemoting(fn, options) {
  options = options || {};
  for (var opt in options) {
    if (options.hasOwnProperty(opt)) {
      fn[opt] = options[opt];
    }
  }
  fn.shared = true;
  // allow connectors to override the function by marking as delegate
  fn._delegate = true;
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
  var msg = 'Unknown "' + modelName + '" id "' + id + '".';
  var error = new Error(msg);
  error.statusCode = error.status = 404;
  cb(error);
}

/**
 * Create new instance of Model class, saved in database.
 *
 * @param {Object} [data] Object containing model instance data.
 * @callback {Function} callback Callback function; see below.
 * @param {Error|null} err Error object
 * @param {Model|null} Model instance 
 */

DataModel.create = function (data, callback) {
  throwNotAttached(this.modelName, 'create');
};

setRemoting(DataModel.create, {
  description: 'Create a new instance of the model and persist it into the data source',
  accepts: {arg: 'data', type: 'object', description: 'Model instance data', http: {source: 'body'}},
  returns: {arg: 'data', type: 'object', root: true},
  http: {verb: 'post', path: '/'}
});

/**
 * Update or insert a model instance
 * @param {Object} data The model instance data
 * @param {Function} [callback] The callback function
 */

DataModel.upsert =  function upsert(data, callback) {
  throwNotAttached(this.modelName, 'updateOrCreate');
};

/**
 * Alias for upsert function.
 */
DataModel.updateOrCreate = DataModel.upsert;

// upsert ~ remoting attributes
setRemoting(DataModel.upsert, {
  description: 'Update an existing model instance or insert a new one into the data source',
  accepts: {arg: 'data', type: 'object', description: 'Model instance data', http: {source: 'body'}},
  returns: {arg: 'data', type: 'object', root: true},
  http: {verb: 'put', path: '/'}
});

/**
 * Find one record instance, same as `all`, limited by one and return object, not collection.
 * If not found, create the record using data provided as second argument.
 *
 * @param {Object} query - search conditions: {where: {test: 'me'}}.
 * @param {Object} data - object to create.
 * @param {Function} cb - callback called with (err, instance)
 */

DataModel.findOrCreate = function findOrCreate(query, data, callback) {
  throwNotAttached(this.modelName, 'findOrCreate');
};

/**
 * Check whether a model instance exists in database.
 *
 * @param {id} id - identifier of object (primary key value)
 * @param {Function} cb - callbacl called with (err, exists: Bool)
 */

DataModel.exists = function exists(id, cb) {
  throwNotAttached(this.modelName, 'exists');
};

// exists ~ remoting attributes
setRemoting(DataModel.exists, {
  description: 'Check whether a model instance exists in the data source',
  accepts: {arg: 'id', type: 'any', description: 'Model id', required: true},
  returns: {arg: 'exists', type: 'any'},
  http: {verb: 'get', path: '/:id/exists'}
});

/**
 * Find object by id
 *
 * @param {*} id - primary key value
 * @param {Function} cb - callback called with (err, instance)
 */

DataModel.findById = function find(id, cb) {
  throwNotAttached(this.modelName, 'find');
};

// find ~ remoting attributes
setRemoting(DataModel.findById, {
  description: 'Find a model instance by id from the data source',
  accepts: {arg: 'id', type: 'any', description: 'Model id', required: true},
  returns: {arg: 'data', type: 'any', root: true},
  http: {verb: 'get', path: '/:id'},
  rest: {after: convertNullToNotFoundError}
});

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

// all ~ remoting attributes
setRemoting(DataModel.find, {
  description: 'Find all instances of the model matched by filter from the data source',
  accepts: {arg: 'filter', type: 'object', description: 'Filter defining fields, where, orderBy, offset, and limit'},
  returns: {arg: 'data', type: 'array', root: true},
  http: {verb: 'get', path: '/'}
});

/**
 * Find one record, same as `all`, limited by 1 and return object, not collection
 *
 * @param {Object} params - search conditions: {where: {test: 'me'}}
 * @param {Function} cb - callback called with (err, instance)
 */

DataModel.findOne = function findOne(params, cb) {
  throwNotAttached(this.modelName, 'findOne');
};

setRemoting(DataModel.findOne, {
  description: 'Find first instance of the model matched by filter from the data source',
  accepts: {arg: 'filter', type: 'object', description: 'Filter defining fields, where, orderBy, offset, and limit'},
  returns: {arg: 'data', type: 'object', root: true},
  http: {verb: 'get', path: '/findOne'}
});

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

// deleteById ~ remoting attributes
setRemoting(DataModel.deleteById, {
  description: 'Delete a model instance by id from the data source',
  accepts: {arg: 'id', type: 'any', description: 'Model id', required: true},
  http: {verb: 'del', path: '/:id'}
});

/**
 * Return count of matched records
 *
 * @param {Object} where - search conditions (optional)
 * @param {Function} cb - callback, called with (err, count)
 */

DataModel.count = function (where, cb) {
  throwNotAttached(this.modelName, 'count');
};

// count ~ remoting attributes
setRemoting(DataModel.count, {
  description: 'Count instances of the model matched by where from the data source',
  accepts: {arg: 'where', type: 'object', description: 'Criteria to match model instances'},
  returns: {arg: 'count', type: 'number'},
  http: {verb: 'get', path: '/count'}
});

/**
 * Save instance. When instance does not have an ID, create method instead.
 * Triggers: validate, save, update or create.
 * 
 * @options [options] Options
 * @property {Boolean} validate Whether to validate.
 * @property {Boolean} throws 
 * @callback {Function} callback Callback function.
 * @param {Error} err Error object
 * @param {Object} 
 */

DataModel.prototype.save = function (options, callback) {
  var inst = this;
  var DataModel = inst.constructor;

  if(typeof options === 'function') {
    callback = options;
    options = {};
  }

  // delegates directly to DataAccess
  DataAccess.prototype.save.call(this, options, function(err, data) {
    if(err) return callback(data);
    var saved = new DataModel(data);
    inst.setId(saved.getId());
    callback(null, data);
  });
};


/**
 * Determine if the data model is new.
 * @returns {Boolean} True if data model is new.
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

/**
 * Update single attribute.
 * Equivalent to `updateAttributes({name: value}, cb)`
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
 * Performs validation before updating
 *
 * @trigger `validation`, `save` and `update` hooks
 * @param {Object} data - data to update
 * @param {Function} callback - callback called with (err, instance)
 */

DataModel.prototype.updateAttributes = function updateAttributes(data, cb) {
  throwNotAttached(this.modelName, 'updateAttributes');
};

// updateAttributes ~ remoting attributes
setRemoting(DataModel.prototype.updateAttributes, {
  description: 'Update attributes for a model instance and persist it into the data source',
  accepts: {arg: 'data', type: 'object', http: {source: 'body'}, description: 'An object of model property name/value pairs'},
  returns: {arg: 'data', type: 'object', root: true},
  http: {verb: 'put', path: '/'}
});

/**
 * Reload object from persistence
 *
 * @requires `id` member of `object` to be able to call `find`
 * @callback {Function} callback Callback function
 * @param {Error} err
 * @param {Object} instance 
 */

DataModel.prototype.reload = function reload(callback) {
  throwNotAttached(this.constructor.modelName, 'reload');
};

/**
 * Set the corret `id` property for the `DataModel`. If a `Connector` defines
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

DataModel.prototype.getId = function() {
  var data = this.toObject();
  if(!data) return;
  return data[this.getIdName()];
}

/**
 * Get the id property name of the constructor.
 */

DataModel.prototype.getIdName = function() {
  return this.constructor.getIdName();
}

/**
 * Get the id property name
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
