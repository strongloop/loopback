/*!
 * Module Dependencies.
 */
var Model = require('./model');

/**
 * Extends Model with basic query and CRUD support.
 *
 * @class DataModel
 * @param {Object} data
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

DataModel.upsert = DataModel.updateOrCreate = function upsert(data, callback) {

};

// upsert ~ remoting attributes
setRemoting(DataModel.upsert, {
  description: 'Update an existing model instance or insert a new one into the data source',
  accepts: {arg: 'data', type: 'object', description: 'Model instance data', http: {source: 'body'}},
  returns: {arg: 'data', type: 'object', root: true},
  http: {verb: 'put', path: '/'}
});

/**
 * Find one record, same as `all`, limited by 1 and return object, not collection,
 * if not found, create using data provided as second argument
 *
 * @param {Object} query - search conditions: {where: {test: 'me'}}.
 * @param {Object} data - object to create.
 * @param {Function} cb - callback called with (err, instance)
 */

DataModel.findOrCreate = function findOrCreate(query, data, callback) {

};

/**
 * Check whether a model instance exists in database
 *
 * @param {id} id - identifier of object (primary key value)
 * @param {Function} cb - callbacl called with (err, exists: Bool)
 */

DataModel.exists = function exists(id, cb) {

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

};

/**
 * Destroy a record by id
 * @param {*} id The id value
 * @param {Function} cb - callback called with (err)
 */

DataModel.removeById =
DataModel.deleteById =
DataModel.destroyById = function deleteById(id, cb) {

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

};

// count ~ remoting attributes
setRemoting(DataModel.count, {
  description: 'Count instances of the model matched by where from the data source',
  accepts: {arg: 'where', type: 'object', description: 'Criteria to match model instances'},
  returns: {arg: 'count', type: 'number'},
  http: {verb: 'get', path: '/count'}
});

/**
 * Save instance. When instance haven't id, create method called instead.
 * Triggers: validate, save, update | create
 * @param options {validate: true, throws: false} [optional]
 * @param callback(err, obj)
 */

DataModel.prototype.save = function (options, callback) {

};


/**
 * Determine if the data model is new.
 * @returns {Boolean}
 */

DataModel.prototype.isNewRecord = function () {

};

/**
 * Delete object from persistence
 *
 * @triggers `destroy` hook (async) before and after destroying object
 */

DataModel.prototype.remove =
DataModel.prototype.delete =
DataModel.prototype.destroy = function (cb) {

};

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
 * @param {Function} callback - called with (err, instance) arguments
 */

DataModel.prototype.reload = function reload(callback) {

};
