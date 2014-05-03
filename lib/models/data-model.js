/*!
 * Module Dependencies.
 */

var Model = require('./model');
var RemoteObjects = require('strong-remoting');
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

  DataModel.setupRemoting();
}

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
  throwNotAttached(this.modelName, 'updateOrCreate');
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
  throwNotAttached(this.modelName, 'find');
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

// disable remoting by default
DataModel.destroyAll.shared = false;

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
  throwNotAttached(this.constructor.modelName, 'save');
};
DataModel.prototype.save._delegate = true;

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

  setRemoting(DataModel.create, {
    description: 'Create a new instance of the model and persist it into the data source',
    accepts: {arg: 'data', type: 'object', description: 'Model instance data', http: {source: 'body'}},
    returns: {arg: 'data', type: typeName, root: true},
    http: {verb: 'post', path: '/'}
  });

  setRemoting(DataModel.upsert, {
    description: 'Update an existing model instance or insert a new one into the data source',
    accepts: {arg: 'data', type: 'object', description: 'Model instance data', http: {source: 'body'}},
    returns: {arg: 'data', type: typeName, root: true},
    http: {verb: 'put', path: '/'}
  });

  setRemoting(DataModel.exists, {
    description: 'Check whether a model instance exists in the data source',
    accepts: {arg: 'id', type: 'any', description: 'Model id', required: true},
    returns: {arg: 'exists', type: 'boolean'},
    http: {verb: 'get', path: '/:id/exists'}
  });

  setRemoting(DataModel.findById, {
    description: 'Find a model instance by id from the data source',
    accepts: {
      arg: 'id', type: 'any', description: 'Model id', required: true,
      http: {source: 'path'}
    },
    returns: {arg: 'data', type: typeName, root: true},
    http: {verb: 'get', path: '/:id'},
    rest: {after: convertNullToNotFoundError}
  });

  setRemoting(DataModel.find, {
    description: 'Find all instances of the model matched by filter from the data source',
    accepts: {arg: 'filter', type: 'object', description: 'Filter defining fields, where, orderBy, offset, and limit'},
    returns: {arg: 'data', type: [typeName], root: true},
    http: {verb: 'get', path: '/'}
  });

  setRemoting(DataModel.findOne, {
    description: 'Find first instance of the model matched by filter from the data source',
    accepts: {arg: 'filter', type: 'object', description: 'Filter defining fields, where, orderBy, offset, and limit'},
    returns: {arg: 'data', type: typeName, root: true},
    http: {verb: 'get', path: '/findOne'}
  });

  setRemoting(DataModel.destroyAll, {
    description: 'Delete all matching records',
    accepts: {arg: 'where', type: 'object', description: 'filter.where object'},
    http: {verb: 'del', path: '/'}
  });
  DataModel.destroyAll.shared = false;

  setRemoting(DataModel.deleteById, {
    description: 'Delete a model instance by id from the data source',
    accepts: {arg: 'id', type: 'any', description: 'Model id', required: true,
              http: {source: 'path'}},
    http: {verb: 'del', path: '/:id'}
  });

  setRemoting(DataModel.count, {
    description: 'Count instances of the model matched by where from the data source',
    accepts: {arg: 'where', type: 'object', description: 'Criteria to match model instances'},
    returns: {arg: 'count', type: 'number'},
    http: {verb: 'get', path: '/count'}
  });

  setRemoting(DataModel.prototype.updateAttributes, {
    description: 'Update attributes for a model instance and persist it into the data source',
    accepts: {arg: 'data', type: 'object', http: {source: 'body'}, description: 'An object of model property name/value pairs'},
    returns: {arg: 'data', type: typeName, root: true},
    http: {verb: 'put', path: '/'}
  });
}

DataModel.setup();
