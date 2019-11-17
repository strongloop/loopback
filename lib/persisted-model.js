// Copyright IBM Corp. 2014,2019. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

/*!
 * Module Dependencies.
 */
'use strict';
const g = require('./globalize');
const runtime = require('./runtime');
const assert = require('assert');
const async = require('async');
const deprecated = require('depd')('loopback');
const debug = require('debug')('loopback:persisted-model');
const PassThrough = require('stream').PassThrough;
const utils = require('./utils');
const filterNodes = require('loopback-filters');

const REPLICATION_CHUNK_SIZE = -1;

module.exports = function(registry) {
  const Model = registry.getModel('Model');

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

  const PersistedModel = Model.extend('PersistedModel');

  /*!
   * Setup the `PersistedModel` constructor.
   */

  PersistedModel.setup = function setupPersistedModel() {
    // call Model.setup first
    Model.setup.call(this);

    const PersistedModel = this;

    // enable change tracking (usually for replication)
    if (this.settings.trackChanges) {
      PersistedModel._defineChangeModel();
      PersistedModel.once('dataSourceAttached', function() {
        PersistedModel.enableChangeTracking();
      });
    } else if (this.settings.enableRemoteReplication) {
      PersistedModel._defineChangeModel();
    }

    PersistedModel.setupRemoting();
  };

  /*!
   * Throw an error telling the user that the method is not available and why.
   */

  function throwNotAttached(modelName, methodName) {
    throw new Error(
      g.f('Cannot call %s.%s().' +
      ' The %s method has not been setup.' +
      ' The {{PersistedModel}} has not been correctly attached to a {{DataSource}}!',
      modelName, methodName, methodName),
    );
  }

  /*!
   * Convert null callbacks to 404 error objects.
   * @param  {HttpContext} ctx
   * @param  {Function} cb
   */

  function convertNullToNotFoundError(ctx, cb) {
    if (ctx.result !== null) return cb();

    const modelName = ctx.method.sharedClass.name;
    const id = ctx.getArgByName('id');
    const msg = g.f('Unknown "%s" {{id}} "%s".', modelName, id);
    const error = new Error(msg);
    error.statusCode = error.status = 404;
    error.code = 'MODEL_NOT_FOUND';
    cb(error);
  }

  /**
   * Create new instance of Model, and save to database.
   *
   * @param {Object|Object[]} [data] Optional data argument.  Can be either a single model instance or an array of instances.
   *
   * @callback {Function} callback Callback function called with `cb(err, obj)` signature.
   * @param {Error} err Error object; see [Error object](http://loopback.io/doc/en/lb2/Error-object.html).
   * @param {Object} models Model instances or null.
   */

  PersistedModel.create = function(data, callback) {
    throwNotAttached(this.modelName, 'create');
  };

  /**
   * Update or insert a model instance
   * @param {Object} data The model instance data to insert.
   * @callback {Function} callback Callback function called with `cb(err, obj)` signature.
   * @param {Error} err Error object; see [Error object](http://loopback.io/doc/en/lb2/Error-object.html).
   * @param {Object} model Updated model instance.
   */

  PersistedModel.upsert = PersistedModel.updateOrCreate = PersistedModel.patchOrCreate =
  function upsert(data, callback) {
    throwNotAttached(this.modelName, 'upsert');
  };

  /**
   * Update or insert a model instance based on the search criteria.
   * If there is a single instance retrieved, update the retrieved model.
   * Creates a new model if no model instances were found.
   * Returns an error if multiple instances are found.
   * @param {Object} [where]  `where` filter, like
   * ```
   * { key: val, key2: {gt: 'val2'}, ...}
   * ```
   * <br/>see
   * [Where filter](http://loopback.io/doc/en/lb2/Where-filter.html#where-clause-for-other-methods).
   * @param {Object} data The model instance data to insert.
   * @callback {Function} callback Callback function called with `cb(err, obj)` signature.
   * @param {Error} err Error object; see [Error object](http://loopback.io/doc/en/lb2/Error-object.html).
   * @param {Object} model Updated model instance.
   */

  PersistedModel.upsertWithWhere =
  PersistedModel.patchOrCreateWithWhere = function upsertWithWhere(where, data, callback) {
    throwNotAttached(this.modelName, 'upsertWithWhere');
  };

  /**
   * Replace or insert a model instance; replace existing record if one is found,
   * such that parameter `data.id` matches `id` of model instance; otherwise,
   * insert a new record.
   * @param {Object} data The model instance data.
   * @options {Object} [options] Options for replaceOrCreate
   * @property {Boolean} validate Perform validation before saving.  Default is true.
   * @callback {Function} callback Callback function called with `cb(err, obj)` signature.
   * @param {Error} err Error object; see [Error object](http://loopback.io/doc/en/lb2/Error-object.html).
   * @param {Object} model Replaced model instance.
   */

  PersistedModel.replaceOrCreate = function replaceOrCreate(data, callback) {
    throwNotAttached(this.modelName, 'replaceOrCreate');
  };

  /**
   * Finds one record matching the optional filter object. If not found, creates
   * the object using the data provided as second argument. In this sense it is
   * the same as `find`, but limited to one object. Returns an object, not
   * collection. If you don't provide the filter object argument, it tries to
   * locate an existing object that matches the `data` argument.
   *
   * @options {Object} [filter] Optional Filter object; see below.
   * @property {String|Object|Array} fields Identify fields to include in return result.
   * <br/>See [Fields filter](http://loopback.io/doc/en/lb2/Fields-filter.html).
   * @property {String|Object|Array} include  See PersistedModel.include documentation.
   * <br/>See [Include filter](http://loopback.io/doc/en/lb2/Include-filter.html).
   * @property {Number} limit Maximum number of instances to return.
   * <br/>See [Limit filter](http://loopback.io/doc/en/lb2/Limit-filter.html).
   * @property {String} order Sort order: either "ASC" for ascending or "DESC" for descending.
   * <br/>See [Order filter](http://loopback.io/doc/en/lb2/Order-filter.html).
   * @property {Number} skip Number of results to skip.
   * <br/>See [Skip filter](http://loopback.io/doc/en/lb2/Skip-filter.html).
   * @property {Object} where Where clause, like
   * ```
   * {where: {key: val, key2: {gt: val2}, ...}}
   * ```
   * <br/>See
   * [Where filter](http://loopback.io/doc/en/lb2/Where-filter.html#where-clause-for-queries).
   * @param {Object} data Data to insert if object matching the `where` filter is not found.
   * @callback {Function} callback Callback function called with `cb(err, instance, created)` arguments.  Required.
   * @param {Error} err Error object; see [Error object](http://loopback.io/doc/en/lb2/Error-object.html).
   * @param {Object} instance Model instance matching the `where` filter, if found.
   * @param {Boolean} created True if the instance does not exist and gets created.
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
   * @param {Error} err Error object; see [Error object](http://loopback.io/doc/en/lb2/Error-object.html).
   * @param {Boolean} exists True if the instance with the specified ID exists; false otherwise.
   */

  PersistedModel.exists = function exists(id, cb) {
    throwNotAttached(this.modelName, 'exists');
  };

  /**
   * Find object by ID with an optional filter for include/fields.
   *
   * @param {*} id Primary key value
   * @options {Object} [filter] Optional Filter JSON object; see below.
   * @property {String|Object|Array} fields Identify fields to include in return result.
   * <br/>See [Fields filter](http://loopback.io/doc/en/lb2/Fields-filter.html).
   * @property {String|Object|Array} include  See PersistedModel.include documentation.
   * <br/>See [Include filter](http://loopback.io/doc/en/lb2/Include-filter.html).
   * @callback {Function} callback Callback function called with `(err, instance)` arguments.  Required.
   * @param {Error} err Error object; see [Error object](http://loopback.io/doc/en/lb2/Error-object.html).
   * @param {Object} instance Model instance matching the specified ID or null if no instance matches.
   */

  PersistedModel.findById = function findById(id, filter, cb) {
    throwNotAttached(this.modelName, 'findById');
  };

  /**
   * Find all model instances that match `filter` specification.
   * See [Querying models](http://loopback.io/doc/en/lb2/Querying-data.html).
   *
   * @options {Object} [filter] Optional Filter JSON object; see below.
   * @property {String|Object|Array} fields Identify fields to include in return result.
   * <br/>See [Fields filter](http://loopback.io/doc/en/lb2/Fields-filter.html).
   * @property {String|Object|Array} include  See PersistedModel.include documentation.
   * <br/>See [Include filter](http://loopback.io/doc/en/lb2/Include-filter.html).
   * @property {Number} limit Maximum number of instances to return.
   * <br/>See [Limit filter](http://loopback.io/doc/en/lb2/Limit-filter.html).
   * @property {String} order Sort order: either "ASC" for ascending or "DESC" for descending.
   * <br/>See [Order filter](http://loopback.io/doc/en/lb2/Order-filter.html).
   * @property {Number} skip Number of results to skip.
   * <br/>See [Skip filter](http://loopback.io/doc/en/lb2/Skip-filter.html).
   * @property {Object} where Where clause, like
   * ```
   * { where: { key: val, key2: {gt: 'val2'}, ...} }
   * ```
   * <br/>See
   * [Where filter](http://loopback.io/doc/en/lb2/Where-filter.html#where-clause-for-queries).
   *
   * @callback {Function} callback Callback function called with `(err, returned-instances)` arguments.    Required.
   * @param {Error} err Error object; see [Error object](http://loopback.io/doc/en/lb2/Error-object.html).
   * @param {Array} models Model instances matching the filter, or null if none found.
   */

  PersistedModel.find = function find(filter, cb) {
    throwNotAttached(this.modelName, 'find');
  };

  /**
   * Find one model instance that matches `filter` specification.
   * Same as `find`, but limited to one result;
   * Returns object, not collection.
   *
   * @options {Object} [filter] Optional Filter JSON object; see below.
   * @property {String|Object|Array} fields Identify fields to include in return result.
   * <br/>See [Fields filter](http://loopback.io/doc/en/lb2/Fields-filter.html).
   * @property {String|Object|Array} include  See PersistedModel.include documentation.
   * <br/>See [Include filter](http://loopback.io/doc/en/lb2/Include-filter.html).
   * @property {String} order Sort order: either "ASC" for ascending or "DESC" for descending.
   * <br/>See [Order filter](http://loopback.io/doc/en/lb2/Order-filter.html).
   * @property {Number} skip Number of results to skip.
   * <br/>See [Skip filter](http://loopback.io/doc/en/lb2/Skip-filter.html).
   * @property {Object} where Where clause, like
   * ```
   * {where: { key: val, key2: {gt: 'val2'}, ...} }
   * ```
   * <br/>See
   * [Where filter](http://loopback.io/doc/en/lb2/Where-filter.html#where-clause-for-queries).
   *
   * @callback {Function} callback Callback function called with `(err, returned-instance)` arguments.  Required.
   * @param {Error} err Error object; see [Error object](http://loopback.io/doc/en/lb2/Error-object.html).
   * @param {Array} model First model instance that matches the filter or null if none found.
   */

  PersistedModel.findOne = function findOne(filter, cb) {
    throwNotAttached(this.modelName, 'findOne');
  };

  /**
   * Destroy all model instances that match the optional `where` specification.
   *
   * @param {Object} [where] Optional where filter, like:
   * ```
   * {key: val, key2: {gt: 'val2'}, ...}
   * ```
   * <br/>See
   * [Where filter](http://loopback.io/doc/en/lb2/Where-filter.html#where-clause-for-other-methods).
   *
   * @callback {Function} callback Optional callback function called with `(err, info)` arguments.
   * @param {Error} err Error object; see [Error object](http://loopback.io/doc/en/lb2/Error-object.html).
   * @param {Object} info Additional information about the command outcome.
   * @param {Number} info.count Number of instances (rows, documents) destroyed.
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
   * Employee.updateAll({managerId: 'x001'}, {managerId: 'x002'}, function(err, info) {
   *     ...
   * });
   * ```
   *
   * @param {Object} [where] Optional `where` filter, like
   * ```
   * { key: val, key2: {gt: 'val2'}, ...}
   * ```
   * <br/>see
   * [Where filter](http://loopback.io/doc/en/lb2/Where-filter.html#where-clause-for-other-methods).
   * @param {Object} data Object containing data to replace matching instances, if any.
   *
   * @callback {Function} callback Callback function called with `(err, info)` arguments.  Required.
   * @param {Error} err Error object; see [Error object](http://loopback.io/doc/en/lb2/Error-object.html).
   * @param {Object} info Additional information about the command outcome.
   * @param {Number} info.count Number of instances (rows, documents) updated.
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
   * @param {Error} err Error object; see [Error object](http://loopback.io/doc/en/lb2/Error-object.html).
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
   * @param {Object} [where] Optional where filter, like
   * ```
   * { key: val, key2: {gt: 'val2'}, ...}
   * ```
   * <br/>See
   * [Where filter](http://loopback.io/doc/en/lb2/Where-filter.html#where-clause-for-other-methods).
   * @callback {Function} callback Callback function called with `(err, count)` arguments.  Required.
   * @param {Error} err Error object; see [Error object](http://loopback.io/doc/en/lb2/Error-object.html).
   * @param {Number} count Number of instances.
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
   * @param {Error} err Error object; see [Error object](http://loopback.io/doc/en/lb2/Error-object.html).
   * @param {Object} instance Model instance saved or created.
   */

  PersistedModel.prototype.save = function(options, callback) {
    const Model = this.constructor;

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

    const inst = this;
    const data = inst.toObject(true);
    const id = this.getId();

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
        const err = new Model.ValidationError(inst);
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
   * @param {Error} err Error object; see [Error object](http://loopback.io/doc/en/lb2/Error-object.html).
   * @param {Object} instance Updated instance.
   */

  PersistedModel.prototype.updateAttribute = function updateAttribute(name, value, callback) {
    throwNotAttached(this.constructor.modelName, 'updateAttribute');
  };

  /**
   * Update set of attributes.  Performs validation before updating.
   *
   * Triggers: `validation`, `save` and `update` hooks
   * @param {Object} data Data to update.
   * @callback {Function} callback Callback function called with `(err, instance)` arguments.  Required.
   * @param {Error} err Error object; see [Error object](http://loopback.io/doc/en/lb2/Error-object.html).
   * @param {Object} instance Updated instance.
   */

  PersistedModel.prototype.updateAttributes = PersistedModel.prototype.patchAttributes =
  function updateAttributes(data, cb) {
    throwNotAttached(this.modelName, 'updateAttributes');
  };

  /**
   * Replace attributes for a model instance and persist it into the datasource.
   * Performs validation before replacing.
   *
   * @param {Object} data Data to replace.
   * @options {Object} [options] Options for replace
   * @property {Boolean} validate Perform validation before saving.  Default is true.
   * @callback {Function} callback Callback function called with `(err, instance)` arguments.
   * @param {Error} err Error object; see [Error object](http://loopback.io/doc/en/lb2/Error-object.html).
   * @param {Object} instance Replaced instance.
   */

  PersistedModel.prototype.replaceAttributes = function replaceAttributes(data, cb) {
    throwNotAttached(this.modelName, 'replaceAttributes');
  };

  /**
   * Replace attributes for a model instance whose id is the first input
   * argument and persist it into the datasource.
   * Performs validation before replacing.
   *
   * @param {*} id The ID value of model instance to replace.
   * @param {Object} data Data to replace.
   * @options {Object} [options] Options for replace
   * @property {Boolean} validate Perform validation before saving.  Default is true.
   * @callback {Function} callback Callback function called with `(err, instance)` arguments.
   * @param {Error} err Error object; see [Error object](http://loopback.io/doc/en/lb2/Error-object.html).
   * @param {Object} instance Replaced instance.
   */

  PersistedModel.replaceById = function replaceById(id, data, cb) {
    throwNotAttached(this.modelName, 'replaceById');
  };

  /**
   * Reload object from persistence.  Requires `id` member of `object` to be able to call `find`.
   * @callback {Function} callback Callback function called with `(err, instance)` arguments.  Required.
   * @param {Error} err Error object; see [Error object](http://loopback.io/doc/en/lb2/Error-object.html).
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
    const ds = this.getDataSource();
    this[this.getIdName()] = val;
  };

  /**
   * Get the `id` value for the `PersistedModel`.
   *
   * @returns {*} The `id` value
   */

  PersistedModel.prototype.getId = function() {
    const data = this.toObject();
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
    const Model = this;
    const ds = Model.getDataSource();

    if (ds.idName) {
      return ds.idName(Model.modelName);
    } else {
      return 'id';
    }
  };

  PersistedModel.setupRemoting = function() {
    const PersistedModel = this;
    const typeName = PersistedModel.modelName;
    const options = PersistedModel.settings;

    // if there is atleast one updateOnly property, then we set
    // createOnlyInstance flag in __create__ to indicate loopback-swagger
    // code to create a separate model instance for create operation only
    const updateOnlyProps = this.getUpdateOnlyProperties ?
      this.getUpdateOnlyProperties() : false;
    const hasUpdateOnlyProps = updateOnlyProps && updateOnlyProps.length > 0;

    // This is just for LB 3.x
    options.replaceOnPUT = options.replaceOnPUT !== false;

    function setRemoting(scope, name, options) {
      const fn = scope[name];
      fn._delegate = true;
      options.isStatic = scope === PersistedModel;
      PersistedModel.remoteMethod(name, options);
    }

    setRemoting(PersistedModel, 'create', {
      description: 'Create a new instance of the model and persist it into the data source.',
      accessType: 'WRITE',
      accepts: [
        {
          arg: 'data', type: 'object', model: typeName, allowArray: true,
          createOnlyInstance: hasUpdateOnlyProps,
          description: 'Model instance data',
          http: {source: 'body'},
        },
        {arg: 'options', type: 'object', http: 'optionsFromRequest'},
      ],
      returns: {arg: 'data', type: typeName, root: true},
      http: {verb: 'post', path: '/'},
    });

    const upsertOptions = {
      aliases: ['upsert', 'updateOrCreate'],
      description: 'Patch an existing model instance or insert a new one ' +
        'into the data source.',
      accessType: 'WRITE',
      accepts: [
        {
          arg: 'data', type: 'object', model: typeName, http: {source: 'body'},
          description: 'Model instance data',
        },
        {arg: 'options', type: 'object', http: 'optionsFromRequest'},
      ],
      returns: {arg: 'data', type: typeName, root: true},
      http: [{verb: 'patch', path: '/'}],
    };

    if (!options.replaceOnPUT) {
      upsertOptions.http.unshift({verb: 'put', path: '/'});
    }
    setRemoting(PersistedModel, 'patchOrCreate', upsertOptions);

    const replaceOrCreateOptions = {
      description: 'Replace an existing model instance or insert a new one into the data source.',
      accessType: 'WRITE',
      accepts: [
        {
          arg: 'data', type: 'object', model: typeName,
          http: {source: 'body'},
          description: 'Model instance data',
        },
        {arg: 'options', type: 'object', http: 'optionsFromRequest'},
      ],
      returns: {arg: 'data', type: typeName, root: true},
      http: [{verb: 'post', path: '/replaceOrCreate'}],
    };

    if (options.replaceOnPUT) {
      replaceOrCreateOptions.http.push({verb: 'put', path: '/'});
    }

    setRemoting(PersistedModel, 'replaceOrCreate', replaceOrCreateOptions);

    setRemoting(PersistedModel, 'upsertWithWhere', {
      aliases: ['patchOrCreateWithWhere'],
      description: 'Update an existing model instance or insert a new one into ' +
        'the data source based on the where criteria.',
      accessType: 'WRITE',
      accepts: [
        {arg: 'where', type: 'object', http: {source: 'query'},
          description: 'Criteria to match model instances'},
        {arg: 'data', type: 'object', model: typeName, http: {source: 'body'},
          description: 'An object of model property name/value pairs'},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'},
      ],
      returns: {arg: 'data', type: typeName, root: true},
      http: {verb: 'post', path: '/upsertWithWhere'},
    });

    setRemoting(PersistedModel, 'exists', {
      description: 'Check whether a model instance exists in the data source.',
      accessType: 'READ',
      accepts: [
        {arg: 'id', type: 'any', description: 'Model id', required: true,
          http: {source: 'path'}},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'},
      ],
      returns: {arg: 'exists', type: 'boolean'},
      http: [
        {verb: 'get', path: '/:id/exists'},
        {verb: 'head', path: '/:id'},
      ],
      rest: {
        // After hook to map exists to 200/404 for HEAD
        after: function(ctx, cb) {
          if (ctx.req.method === 'GET') {
            // For GET, return {exists: true|false} as is
            return cb();
          }
          if (!ctx.result.exists) {
            const modelName = ctx.method.sharedClass.name;
            const id = ctx.getArgByName('id');
            const msg = 'Unknown "' + modelName + '" id "' + id + '".';
            const error = new Error(msg);
            error.statusCode = error.status = 404;
            error.code = 'MODEL_NOT_FOUND';
            cb(error);
          } else {
            cb();
          }
        },
      },
    });

    setRemoting(PersistedModel, 'findById', {
      description: 'Find a model instance by {{id}} from the data source.',
      accessType: 'READ',
      accepts: [
        {arg: 'id', type: 'any', description: 'Model id', required: true,
          http: {source: 'path'}},
        {arg: 'filter', type: 'object',
          description:
          'Filter defining fields and include - must be a JSON-encoded string (' +
          '{"something":"value"})'},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'},
      ],
      returns: {arg: 'data', type: typeName, root: true},
      http: {verb: 'get', path: '/:id'},
      rest: {after: convertNullToNotFoundError},
    });

    const replaceByIdOptions = {
      description: 'Replace attributes for a model instance and persist it into the data source.',
      accessType: 'WRITE',
      accepts: [
        {arg: 'id', type: 'any', description: 'Model id', required: true,
          http: {source: 'path'}},
        {arg: 'data', type: 'object', model: typeName, http: {source: 'body'}, description:
          'Model instance data'},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'},
      ],
      returns: {arg: 'data', type: typeName, root: true},
      http: [{verb: 'post', path: '/:id/replace'}],
    };

    if (options.replaceOnPUT) {
      replaceByIdOptions.http.push({verb: 'put', path: '/:id'});
    }

    setRemoting(PersistedModel, 'replaceById', replaceByIdOptions);

    setRemoting(PersistedModel, 'find', {
      description: 'Find all instances of the model matched by filter from the data source.',
      accessType: 'READ',
      accepts: [
        {arg: 'filter', type: 'object', description:
        'Filter defining fields, where, include, order, offset, and limit - must be a ' +
        'JSON-encoded string (`{"where":{"something":"value"}}`).  ' +
        'See https://loopback.io/doc/en/lb3/Querying-data.html#using-stringified-json-in-rest-queries ' +
        'for more details.'},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'},
      ],
      returns: {arg: 'data', type: [typeName], root: true},
      http: {verb: 'get', path: '/'},
    });

    setRemoting(PersistedModel, 'findOne', {
      description: 'Find first instance of the model matched by filter from the data source.',
      accessType: 'READ',
      accepts: [
        {arg: 'filter', type: 'object', description:
        'Filter defining fields, where, include, order, offset, and limit - must be a ' +
        'JSON-encoded string (`{"where":{"something":"value"}}`).  ' +
        'See https://loopback.io/doc/en/lb3/Querying-data.html#using-stringified-json-in-rest-queries ' +
        'for more details.'},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'},
      ],
      returns: {arg: 'data', type: typeName, root: true},
      http: {verb: 'get', path: '/findOne'},
      rest: {after: convertNullToNotFoundError},
    });

    setRemoting(PersistedModel, 'destroyAll', {
      description: 'Delete all matching records.',
      accessType: 'WRITE',
      accepts: [
        {arg: 'where', type: 'object', description: 'filter.where object'},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'},
      ],
      returns: {
        arg: 'count',
        type: 'object',
        description: 'The number of instances deleted',
        root: true,
      },
      http: {verb: 'del', path: '/'},
      shared: false,
    });

    setRemoting(PersistedModel, 'updateAll', {
      aliases: ['update'],
      description: 'Update instances of the model matched by {{where}} from the data source.',
      accessType: 'WRITE',
      accepts: [
        {arg: 'where', type: 'object', http: {source: 'query'},
          description: 'Criteria to match model instances'},
        {arg: 'data', type: 'object', model: typeName, http: {source: 'body'},
          description: 'An object of model property name/value pairs'},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'},
      ],
      returns: {
        arg: 'info',
        description: 'Information related to the outcome of the operation',
        type: {
          count: {
            type: 'number',
            description: 'The number of instances updated',
          },
        },
        root: true,
      },
      http: {verb: 'post', path: '/update'},
    });

    setRemoting(PersistedModel, 'deleteById', {
      aliases: ['destroyById', 'removeById'],
      description: 'Delete a model instance by {{id}} from the data source.',
      accessType: 'WRITE',
      accepts: [
        {arg: 'id', type: 'any', description: 'Model id', required: true,
          http: {source: 'path'}},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'},
      ],
      http: {verb: 'del', path: '/:id'},
      returns: {arg: 'count', type: 'object', root: true},
    });

    setRemoting(PersistedModel, 'count', {
      description: 'Count instances of the model matched by where from the data source.',
      accessType: 'READ',
      accepts: [
        {arg: 'where', type: 'object', description: 'Criteria to match model instances'},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'},
      ],
      returns: {arg: 'count', type: 'number'},
      http: {verb: 'get', path: '/count'},
    });

    const updateAttributesOptions = {
      aliases: ['updateAttributes'],
      description: 'Patch attributes for a model instance and persist it into ' +
        'the data source.',
      accessType: 'WRITE',
      accepts: [
        {
          arg: 'data', type: 'object', model: typeName,
          http: {source: 'body'},
          description: 'An object of model property name/value pairs',
        },
        {arg: 'options', type: 'object', http: 'optionsFromRequest'},
      ],
      returns: {arg: 'data', type: typeName, root: true},
      http: [{verb: 'patch', path: '/'}],
    };

    setRemoting(PersistedModel.prototype, 'patchAttributes', updateAttributesOptions);

    if (!options.replaceOnPUT) {
      updateAttributesOptions.http.unshift({verb: 'put', path: '/'});
    }

    if (options.trackChanges || options.enableRemoteReplication) {
      setRemoting(PersistedModel, 'diff', {
        description: 'Get a set of deltas and conflicts since the given checkpoint.',
        accessType: 'READ',
        accepts: [
          {arg: 'since', type: 'number', description: 'Find deltas since this checkpoint'},
          {arg: 'remoteChanges', type: 'array', description: 'an array of change objects',
            http: {source: 'body'}},
        ],
        returns: {arg: 'result', type: 'object', root: true},
        http: {verb: 'post', path: '/diff'},
      });

      setRemoting(PersistedModel, 'changes', {
        description: 'Get the changes to a model since a given checkpoint.' +
          'Provide a filter object to reduce the number of results returned.',
        accessType: 'READ',
        accepts: [
          {arg: 'since', type: 'number', description:
            'Only return changes since this checkpoint'},
          {arg: 'filter', type: 'object', description:
            'Only include changes that match this filter'},
        ],
        returns: {arg: 'changes', type: 'array', root: true},
        http: {verb: 'get', path: '/changes'},
      });

      setRemoting(PersistedModel, 'checkpoint', {
        description: 'Create a checkpoint.',
        // The replication algorithm needs to create a source checkpoint,
        // even though it is otherwise not making any source changes.
        // We need to allow this method for users that don't have full
        // WRITE permissions.
        accessType: 'REPLICATE',
        returns: {arg: 'checkpoint', type: 'object', root: true},
        http: {verb: 'post', path: '/checkpoint'},
      });

      setRemoting(PersistedModel, 'currentCheckpoint', {
        description: 'Get the current checkpoint.',
        accessType: 'READ',
        returns: {arg: 'checkpoint', type: 'object', root: true},
        http: {verb: 'get', path: '/checkpoint'},
      });

      setRemoting(PersistedModel, 'createUpdates', {
        description: 'Create an update list from a delta list.',
        // This operation is read-only, it does not change any local data.
        // It is called by the replication algorithm to compile a list
        // of changes to apply on the target.
        accessType: 'READ',
        accepts: {arg: 'deltas', type: 'array', http: {source: 'body'}},
        returns: {arg: 'updates', type: 'array', root: true},
        http: {verb: 'post', path: '/create-updates'},
      });

      setRemoting(PersistedModel, 'bulkUpdate', {
        description: 'Run multiple updates at once. Note: this is not atomic.',
        accessType: 'WRITE',
        accepts: {arg: 'updates', type: 'array'},
        http: {verb: 'post', path: '/bulk-update'},
      });

      setRemoting(PersistedModel, 'findLastChange', {
        description: 'Get the most recent change record for this instance.',
        accessType: 'READ',
        accepts: {
          arg: 'id', type: 'any', required: true, http: {source: 'path'},
          description: 'Model id',
        },
        returns: {arg: 'result', type: this.Change.modelName, root: true},
        http: {verb: 'get', path: '/:id/changes/last'},
      });

      setRemoting(PersistedModel, 'updateLastChange', {
        description:
          'Update the properties of the most recent change record ' +
          'kept for this instance.',
        accessType: 'WRITE',
        accepts: [
          {
            arg: 'id', type: 'any', required: true, http: {source: 'path'},
            description: 'Model id',
          },
          {
            arg: 'data', type: 'object', model: typeName, http: {source: 'body'},
            description: 'An object of Change property name/value pairs',
          },
        ],
        returns: {arg: 'result', type: this.Change.modelName, root: true},
        http: {verb: 'put', path: '/:id/changes/last'},
      });
    }

    setRemoting(PersistedModel, 'createChangeStream', {
      description: 'Create a change stream.',
      accessType: 'READ',
      http: [
        {verb: 'post', path: '/change-stream'},
        {verb: 'get', path: '/change-stream'},
      ],
      accepts: {
        arg: 'options',
        type: 'object',
      },
      returns: {
        arg: 'changes',
        type: 'ReadableStream',
        json: true,
      },
    });
  };

  /**
   * Get a set of deltas and conflicts since the given checkpoint.
   *
   * See [Change.diff()](#change-diff) for details.
   *
   * @param  {Number}  since  Find deltas since this checkpoint.
   * @param  {Array}  remoteChanges  An array of change objects.
   * @callback {Function} callback Callback function called with `(err, result)` arguments.  Required.
   * @param {Error} err Error object; see [Error object](http://loopback.io/doc/en/lb2/Error-object.html).
   * @param {Object} result Object with `deltas` and `conflicts` properties; see [Change.diff()](#change-diff) for details.
   */

  PersistedModel.diff = function(since, remoteChanges, callback) {
    const Change = this.getChangeModel();
    Change.diff(this.modelName, since, remoteChanges, callback);
  };

  /**
   * Get the changes to a model since the specified checkpoint. Provide a filter object
   * to reduce the number of results returned.
   * @param  {Number}   since    Return only changes since this checkpoint.
   * @param  {Object}   filter   Include only changes that match this filter, the same as for [#persistedmodel-find](find()).
   * @callback {Function} callback Callback function called with `(err, changes)` arguments.  Required.
   * @param {Error} err Error object; see [Error object](http://loopback.io/doc/en/lb2/Error-object.html).
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

    const idName = this.dataSource.idName(this.modelName);
    const Change = this.getChangeModel();
    const model = this;
    const changeFilter = this.createChangeFilter(since, filter);

    filter = filter || {};
    filter.fields = {};
    filter.where = filter.where || {};
    filter.fields[idName] = true;

    // TODO(ritch) this whole thing could be optimized a bit more
    Change.find(changeFilter, function(err, changes) {
      if (err) return callback(err);
      if (!Array.isArray(changes) || changes.length === 0) return callback(null, []);
      const ids = changes.map(function(change) {
        return change.getModelId();
      });
      filter.where[idName] = {inq: ids};
      model.find(filter, function(err, models) {
        if (err) return callback(err);
        const modelIds = models.map(function(m) {
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
    const Checkpoint = this.getChangeModel().getCheckpointModel();
    Checkpoint.bumpLastSeq(cb);
  };

  /**
   * Get the current checkpoint ID.
   *
   * @callback {Function} callback Callback function called with `(err, currentCheckpointId)` arguments.  Required.
   * @param {Error} err Error object; see [Error object](http://loopback.io/doc/en/lb2/Error-object.html).
   * @param {Number} currentCheckpointId Current checkpoint ID.
   */

  PersistedModel.currentCheckpoint = function(cb) {
    const Checkpoint = this.getChangeModel().getCheckpointModel();
    Checkpoint.current(cb);
  };

  /**
   * Replicate changes since the given checkpoint to the given target model.
   *
   * @param  {Number}   [since]  Since this checkpoint
   * @param  {Model}    targetModel  Target this model class
   * @param  {Object} [options] An optional options object to pass to underlying data-access calls.
   * @param {Object} [options.filter] Replicate models that match this filter
   * @callback {Function} [callback] Callback function called with `(err, conflicts)` arguments.
   * @param {Error} err Error object; see [Error object](http://loopback.io/doc/en/lb2/Error-object.html).
   * @param {Conflict[]} conflicts A list of changes that could not be replicated due to conflicts.
   * @param {Object} checkpoints The new checkpoints to use as the "since"
   * argument for the next replication.
   *
   * @promise
   */

  PersistedModel.replicate = function(since, targetModel, options, callback) {
    const lastArg = arguments[arguments.length - 1];

    if (typeof lastArg === 'function' && arguments.length > 1) {
      callback = lastArg;
    }

    if (typeof since === 'function' && since.modelName) {
      targetModel = since;
      since = -1;
    }

    if (typeof since !== 'object') {
      since = {source: since, target: since};
    }

    if (typeof options === 'function') {
      options = {};
    }

    options = options || {};

    const sourceModel = this;
    callback = callback || utils.createPromiseCallback();

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
    const MAX_ATTEMPTS = 3;

    run(1, since);
    return callback.promise;

    function run(attempt, since) {
      debug('\titeration #%s', attempt);
      tryReplicate(sourceModel, targetModel, since, options, next);

      function next(err, conflicts, cps, updates) {
        const finished = err || conflicts.length ||
          !updates || updates.length === 0 ||
          attempt >= MAX_ATTEMPTS;

        if (finished)
          return callback(err, conflicts, cps);
        run(attempt + 1, cps);
      }
    }
  };

  function tryReplicate(sourceModel, targetModel, since, options, callback) {
    const Change = sourceModel.getChangeModel();
    const TargetChange = targetModel.getChangeModel();
    const changeTrackingEnabled = Change && TargetChange;
    let replicationChunkSize = REPLICATION_CHUNK_SIZE;

    if (sourceModel.settings && sourceModel.settings.replicationChunkSize) {
      replicationChunkSize = sourceModel.settings.replicationChunkSize;
    }

    assert(
      changeTrackingEnabled,
      'You must enable change tracking before replicating',
    );

    let diff, updates, newSourceCp, newTargetCp;

    const tasks = [
      checkpoints,
      getSourceChanges,
      getDiffFromTarget,
      createSourceUpdates,
      bulkUpdate,
    ];

    async.waterfall(tasks, done);

    function getSourceChanges(cb) {
      utils.downloadInChunks(
        options.filter,
        replicationChunkSize,
        function(filter, pagingCallback) {
          sourceModel.changes(since.source, filter, pagingCallback);
        },
        debug.enabled ? log : cb,
      );

      function log(err, result) {
        if (err) return cb(err);
        debug('\tusing source changes');
        result.forEach(function(it) { debug('\t\t%j', it); });
        cb(err, result);
      }
    }

    function getDiffFromTarget(sourceChanges, cb) {
      utils.uploadInChunks(
        sourceChanges,
        replicationChunkSize,
        function(smallArray, chunkCallback) {
          return targetModel.diff(since.target, smallArray, chunkCallback);
        },
        debug.enabled ? log : cb,
      );

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
        utils.uploadInChunks(
          diff.deltas,
          replicationChunkSize,
          function(smallArray, chunkCallback) {
            return sourceModel.createUpdates(smallArray, chunkCallback);
          },
          cb,
        );
      } else {
        // nothing to replicate
        done();
      }
    }

    function bulkUpdate(_updates, cb) {
      debug('\tstarting bulk update');
      updates = _updates;
      utils.uploadInChunks(
        updates,
        replicationChunkSize,
        function(smallArray, chunkCallback) {
          return targetModel.bulkUpdate(smallArray, options, function(err) {
            // bulk update is a special case where we want to process all chunks and aggregate all errors
            chunkCallback(null, err);
          });
        },
        function(notUsed, err) {
          const conflicts = err && err.details && err.details.conflicts;
          if (conflicts && err.statusCode == 409) {
            diff.conflicts = conflicts;
            // filter out updates that were not applied
            updates = updates.filter(function(u) {
              return conflicts
                .filter(function(d) { return d.modelId === u.change.modelId; })
                .length === 0;
            });
            return cb();
          }
          cb(err);
        },
      );
    }

    function checkpoints() {
      const cb = arguments[arguments.length - 1];
      sourceModel.checkpoint(function(err, source) {
        if (err) return cb(err);
        newSourceCp = source.seq;
        targetModel.checkpoint(function(err, target) {
          if (err) return cb(err);
          newTargetCp = target.seq;
          debug('\tcreated checkpoints');
          debug('\t\t%s for source model %s', newSourceCp, sourceModel.modelName);
          debug('\t\t%s for target model %s', newTargetCp, targetModel.modelName);
          cb();
        });
      });
    }

    function done(err) {
      if (err) return callback(err);

      debug('\treplication finished');
      debug('\t\t%s conflict(s) detected', diff.conflicts.length);
      debug('\t\t%s change(s) applied', updates ? updates.length : 0);
      debug('\t\tnew checkpoints: { source: %j, target: %j }',
        newSourceCp, newTargetCp);

      const conflicts = diff.conflicts.map(function(change) {
        return new Change.Conflict(
          change.modelId, sourceModel, targetModel,
        );
      });

      if (conflicts.length) {
        sourceModel.emit('conflicts', conflicts);
      }

      if (callback) {
        const newCheckpoints = {source: newSourceCp, target: newTargetCp};
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
    const Change = this.getChangeModel();
    const updates = [];
    const Model = this;
    const tasks = [];

    deltas.forEach(function(change) {
      change = new Change(change);
      const type = change.type();
      const update = {type: type, change: change};
      switch (type) {
        case Change.CREATE:
        case Change.UPDATE:
          tasks.push(function(cb) {
            Model.findById(change.modelId, function(err, inst) {
              if (err) return cb(err);
              if (!inst) {
                return cb &&
                  cb(new Error(g.f('Missing data for change: %s', change.modelId)));
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
   * @param  {Object} [options] An optional options object to pass to underlying data-access calls.
   * @param  {Function} callback Callback function.
   */

  PersistedModel.bulkUpdate = function(updates, options, callback) {
    const tasks = [];
    const Model = this;
    const Change = this.getChangeModel();
    const conflicts = [];

    const lastArg = arguments[arguments.length - 1];

    if (typeof lastArg === 'function' && arguments.length > 1) {
      callback = lastArg;
    }

    if (typeof options === 'function') {
      options = {};
    }

    options = options || {};

    buildLookupOfAffectedModelData(Model, updates, function(err, currentMap) {
      if (err) return callback(err);

      updates.forEach(function(update) {
        const id = update.change.modelId;
        const current = currentMap[id];
        switch (update.type) {
          case Change.UPDATE:
            tasks.push(function(cb) {
              applyUpdate(Model, id, current, update.data, update.change, conflicts, options, cb);
            });
            break;

          case Change.CREATE:
            tasks.push(function(cb) {
              applyCreate(Model, id, current, update.data, update.change, conflicts, options, cb);
            });
            break;
          case Change.DELETE:
            tasks.push(function(cb) {
              applyDelete(Model, id, current, update.change, conflicts, options, cb);
            });
            break;
        }
      });

      async.parallel(tasks, function(err) {
        if (err) return callback(err);
        if (conflicts.length) {
          err = new Error(g.f('Conflict'));
          err.statusCode = 409;
          err.details = {conflicts: conflicts};
          return callback(err);
        }
        callback();
      });
    });
  };

  function buildLookupOfAffectedModelData(Model, updates, callback) {
    const idName = Model.dataSource.idName(Model.modelName);
    const affectedIds = updates.map(function(u) { return u.change.modelId; });
    const whereAffected = {};
    whereAffected[idName] = {inq: affectedIds};
    Model.find({where: whereAffected}, function(err, affectedList) {
      if (err) return callback(err);
      const dataLookup = {};
      affectedList.forEach(function(it) {
        dataLookup[it[idName]] = it;
      });
      callback(null, dataLookup);
    });
  }

  function applyUpdate(Model, id, current, data, change, conflicts, options, cb) {
    const Change = Model.getChangeModel();
    const rev = current ? Change.revisionForInst(current) : null;

    if (rev !== change.prev) {
      debug('Detected non-rectified change of %s %j',
        Model.modelName, id);
      debug('\tExpected revision: %s', change.rev);
      debug('\tActual revision:   %s', rev);
      conflicts.push(change);
      return Change.rectifyModelChanges(Model.modelName, [id], cb);
    }

    // TODO(bajtos) modify `data` so that it instructs
    // the connector to remove any properties included in "inst"
    // but not included in `data`
    // See https://github.com/strongloop/loopback/issues/1215

    Model.updateAll(current.toObject(), data, options, function(err, result) {
      if (err) return cb(err);

      const count = result && result.count;
      switch (count) {
        case 1:
          // The happy path, exactly one record was updated
          return cb();

        case 0:
          debug('UpdateAll detected non-rectified change of %s %j',
            Model.modelName, id);
          conflicts.push(change);
          // NOTE(bajtos) updateAll triggers change rectification
          // for all model instances, even when no records were updated,
          // thus we don't need to rectify explicitly ourselves
          return cb();

        case undefined:
        case null:
          return cb(new Error(
            g.f('Cannot apply bulk updates, ' +
            'the connector does not correctly report ' +
            'the number of updated records.'),
          ));

        default:
          debug('%s.updateAll modified unexpected number of instances: %j',
            Model.modelName, count);
          return cb(new Error(
            g.f('Bulk update failed, the connector has modified unexpected ' +
            'number of records: %s', JSON.stringify(count)),
          ));
      }
    });
  }

  function applyCreate(Model, id, current, data, change, conflicts, options, cb) {
    Model.create(data, options, function(createErr) {
      if (!createErr) return cb();

      // We don't have a reliable way how to detect the situation
      // where he model was not create because of a duplicate id
      // The workaround is to query the DB to check if the model already exists
      Model.findById(id, function(findErr, inst) {
        if (findErr || !inst) {
          // There isn't any instance with the same id, thus there isn't
          // any conflict and we just report back the original error.
          return cb(createErr);
        }

        return conflict();
      });
    });

    function conflict() {
      // The instance already exists - report a conflict
      debug('Detected non-rectified new instance of %s %j',
        Model.modelName, id);
      conflicts.push(change);

      const Change = Model.getChangeModel();
      return Change.rectifyModelChanges(Model.modelName, [id], cb);
    }
  }

  function applyDelete(Model, id, current, change, conflicts, options, cb) {
    if (!current) {
      // The instance was either already deleted or not created at all,
      // we are done.
      return cb();
    }

    const Change = Model.getChangeModel();
    const rev = Change.revisionForInst(current);
    if (rev !== change.prev) {
      debug('Detected non-rectified change of %s %j',
        Model.modelName, id);
      debug('\tExpected revision: %s', change.rev);
      debug('\tActual revision:   %s', rev);
      conflicts.push(change);
      return Change.rectifyModelChanges(Model.modelName, [id], cb);
    }

    Model.deleteAll(current.toObject(), options, function(err, result) {
      if (err) return cb(err);

      const count = result && result.count;
      switch (count) {
        case 1:
          // The happy path, exactly one record was updated
          return cb();

        case 0:
          debug('DeleteAll detected non-rectified change of %s %j',
            Model.modelName, id);
          conflicts.push(change);
          // NOTE(bajtos) deleteAll triggers change rectification
          // for all model instances, even when no records were updated,
          // thus we don't need to rectify explicitly ourselves
          return cb();

        case undefined:
        case null:
          return cb(new Error(
            g.f('Cannot apply bulk updates, ' +
            'the connector does not correctly report ' +
            'the number of deleted records.'),
          ));

        default:
          debug('%s.deleteAll modified unexpected number of instances: %j',
            Model.modelName, count);
          return cb(new Error(
            g.f('Bulk update failed, the connector has deleted unexpected ' +
            'number of records: %s', JSON.stringify(count)),
          ));
      }
    });
  }

  /**
   * Get the `Change` model.
   * Throws an error if the change model is not correctly setup.
   * @return {Change}
   */

  PersistedModel.getChangeModel = function() {
    const changeModel = this.Change;
    const isSetup = changeModel && changeModel.dataSource;

    assert(isSetup, 'Cannot get a setup Change model for ' + this.modelName);

    return changeModel;
  };

  /**
   * Get the source identifier for this model or dataSource.
   *
   * @callback {Function} callback Callback function called with `(err, id)` arguments.
   * @param {Error} err Error object; see [Error object](http://loopback.io/doc/en/lb2/Error-object.html).
   * @param {String} sourceId Source identifier for the model or dataSource.
   */

  PersistedModel.getSourceId = function(cb) {
    const dataSource = this.dataSource;
    if (!dataSource) {
      this.once('dataSourceAttached', this.getSourceId.bind(this, cb));
    }
    assert(
      dataSource.connector.name,
      'Model.getSourceId: cannot get id without dataSource.connector.name',
    );
    const id = [dataSource.connector.name, this.modelName].join('-');
    cb(null, id);
  };

  /**
   * Enable the tracking of changes made to the model. Usually for replication.
   */

  PersistedModel.enableChangeTracking = function() {
    const Model = this;
    const Change = this.Change || this._defineChangeModel();
    const cleanupInterval = Model.settings.changeCleanupInterval || 30000;

    assert(this.dataSource, 'Cannot enableChangeTracking(): ' + this.modelName +
      ' is not attached to a dataSource');

    const idName = this.getIdName();
    const idProp = this.definition.properties[idName];
    const idType = idProp && idProp.type;
    const idDefn = idProp && idProp.defaultFn;
    if (idType !== String || !(idDefn === 'uuid' || idDefn === 'guid')) {
      deprecated('The model ' + this.modelName + ' is tracking changes, ' +
        'which requires a string id with GUID/UUID default value.');
    }

    Model.observe('after save', rectifyOnSave);

    Model.observe('after delete', rectifyOnDelete);

    // Only run if the run time is server
    // Can switch off cleanup by setting the interval to -1
    if (runtime.isServer && cleanupInterval > 0) {
      // initial cleanup
      cleanup();

      // cleanup
      setInterval(cleanup, cleanupInterval);
    }

    function cleanup() {
      Model.rectifyAllChanges(function(err) {
        if (err) {
          Model.handleChangeError(err, 'cleanup');
        }
      });
    }
  };

  function rectifyOnSave(ctx, next) {
    const instance = ctx.instance || ctx.currentInstance;
    const id = instance ? instance.getId() :
      getIdFromWhereByModelId(ctx.Model, ctx.where);

    if (debug.enabled) {
      debug('rectifyOnSave %s -> ' + (id ? 'id %j' : '%s'),
        ctx.Model.modelName, id ? id : 'ALL');
      debug('context instance:%j currentInstance:%j where:%j data %j',
        ctx.instance, ctx.currentInstance, ctx.where, ctx.data);
    }

    if (id != null) {
      ctx.Model.rectifyChange(id, reportErrorAndNext);
    } else {
      ctx.Model.rectifyAllChanges(reportErrorAndNext);
    }

    function reportErrorAndNext(err) {
      if (err) {
        ctx.Model.handleChangeError(err, 'after save');
      }
      next();
    }
  }

  function rectifyOnDelete(ctx, next) {
    const id = ctx.instance ? ctx.instance.getId() :
      getIdFromWhereByModelId(ctx.Model, ctx.where);

    if (debug.enabled) {
      debug('rectifyOnDelete %s -> ' + (id ? 'id %j' : '%s'),
        ctx.Model.modelName, id ? id : 'ALL');
      debug('context instance:%j where:%j', ctx.instance, ctx.where);
    }

    if (id != null) {
      ctx.Model.rectifyChange(id, reportErrorAndNext);
    } else {
      ctx.Model.rectifyAllChanges(reportErrorAndNext);
    }

    function reportErrorAndNext(err) {
      if (err) {
        ctx.Model.handleChangeError(err, 'after delete');
      }
      next();
    }
  }

  function getIdFromWhereByModelId(Model, where) {
    const idName = Model.getIdName();
    if (!(idName in where)) return undefined;

    const id = where[idName];
    // TODO(bajtos) support object values that are not LB conditions
    if (typeof id === 'string' || typeof id === 'number') {
      return id;
    }
    return undefined;
  }

  PersistedModel._defineChangeModel = function() {
    const BaseChangeModel = this.registry.getModel('Change');
    assert(BaseChangeModel,
      'Change model must be defined before enabling change replication');

    const additionalChangeModelProperties =
      this.settings.additionalChangeModelProperties || {};

    this.Change = BaseChangeModel.extend(
      this.modelName + '-change',
      additionalChangeModelProperties,
      {trackModel: this},
    );

    if (this.dataSource) {
      attachRelatedModels(this);
    }

    // Re-attach related models whenever our datasource is changed.
    const self = this;
    this.on('dataSourceAttached', function() {
      attachRelatedModels(self);
    });

    return this.Change;

    function attachRelatedModels(self) {
      self.Change.attachTo(self.dataSource);
      self.Change.getCheckpointModel().attachTo(self.dataSource);
    }
  };

  PersistedModel.rectifyAllChanges = function(callback) {
    this.getChangeModel().rectifyAll(callback);
  };

  /**
   * Handle a change error. Override this method in a subclassing model to customize
   * change error handling.
   *
   * @param {Error} err Error object; see [Error object](http://loopback.io/doc/en/lb2/Error-object.html).
   */

  PersistedModel.handleChangeError = function(err, operationName) {
    if (!err) return;
    this.emit('error', err, operationName);
  };

  /**
   * Specify that a change to the model with the given ID has occurred.
   *
   * @param {*} id The ID of the model that has changed.
   * @callback {Function} callback
   * @param {Error} err
   */

  PersistedModel.rectifyChange = function(id, callback) {
    const Change = this.getChangeModel();
    Change.rectifyModelChanges(this.modelName, [id], callback);
  };

  PersistedModel.findLastChange = function(id, cb) {
    const Change = this.getChangeModel();
    Change.findOne({where: {modelId: id}}, cb);
  };

  PersistedModel.updateLastChange = function(id, data, cb) {
    const self = this;
    this.findLastChange(id, function(err, inst) {
      if (err) return cb(err);
      if (!inst) {
        err = new Error(g.f('No change record found for %s with id %s',
          self.modelName, id));
        err.statusCode = 404;
        return cb(err);
      }

      inst.updateAttributes(data, cb);
    });
  };

  /**
   * Create a change stream. [See here for more info](http://loopback.io/doc/en/lb2/Realtime-server-sent-events.html)
   *
   * @param {Object} options
   * @param {Object} options.where Only changes to models matching this where filter will be included in the `ChangeStream`.
   * @callback {Function} callback
   * @param {Error} err
   * @param {ChangeStream} changes
   */

  PersistedModel.createChangeStream = function(options, cb) {
    if (typeof options === 'function') {
      cb = options;
      options = undefined;
    }
    cb = cb || utils.createPromiseCallback();

    const idName = this.getIdName();
    const Model = this;
    const changes = new PassThrough({objectMode: true});

    changes._destroy = function() {
      changes.end();
      changes.emit('end');
      changes.emit('close');
    };

    changes.destroy = changes.destroy || changes._destroy; // node 8 compability

    changes.on('error', removeHandlers);
    changes.on('close', removeHandlers);
    changes.on('finish', removeHandlers);
    changes.on('end', removeHandlers);

    process.nextTick(function() {
      cb(null, changes);
    });

    Model.observe('after save', changeHandler);
    Model.observe('after delete', deleteHandler);

    return cb.promise;

    function changeHandler(ctx, next) {
      const change = createChangeObject(ctx, 'save');
      if (change) {
        changes.write(change);
      }

      next();
    }

    function deleteHandler(ctx, next) {
      const change = createChangeObject(ctx, 'delete');
      if (change) {
        changes.write(change);
      }

      next();
    }

    function createChangeObject(ctx, type) {
      const where = ctx.where;
      let data = ctx.instance || ctx.data;
      const whereId = where && where[idName];

      // the data includes the id
      // or the where includes the id
      let target;

      if (data && (data[idName] || data[idName] === 0)) {
        target = data[idName];
      } else if (where && (where[idName] || where[idName] === 0)) {
        target = where[idName];
      }

      const hasTarget = target === 0 || !!target;

      // apply filtering if options is set
      if (options) {
        const filtered = filterNodes([data], options);
        if (filtered.length !== 1) {
          return null;
        }
        data = filtered[0];
      }

      const change = {
        target: target,
        where: where,
        data: data,
      };

      switch (type) {
        case 'save':
          if (ctx.isNewInstance === undefined) {
            change.type = hasTarget ? 'update' : 'create';
          } else {
            change.type = ctx.isNewInstance ? 'create' : 'update';
          }

          break;
        case 'delete':
          change.type = 'remove';
          break;
      }

      return change;
    }

    function removeHandlers() {
      Model.removeObserver('after save', changeHandler);
      Model.removeObserver('after delete', deleteHandler);
    }
  };

  /**
   * Get the filter for searching related changes.
   *
   * Models should override this function to copy properties
   * from the model instance filter into the change search filter.
   *
   * ```js
   * module.exports = (TargetModel, config) => {
   *   TargetModel.createChangeFilter = function(since, modelFilter) {
   *     const filter = this.base.createChangeFilter.apply(this, arguments);
   *     if (modelFilter && modelFilter.where && modelFilter.where.tenantId) {
   *       filter.where.tenantId = modelFilter.where.tenantId;
   *     }
   *     return filter;
   *   };
   * };
   * ```
   *
   * @param {Number} since Return only changes since this checkpoint.
   * @param {Object} modelFilter Filter describing which model instances to
   * include in the list of changes.
   * @returns {Object} The filter object to pass to `Change.find()`. Default:
   * ```
   * {where: {checkpoint: {gte: since}, modelName: this.modelName}}
   * ```
   */
  PersistedModel.createChangeFilter = function(since, modelFilter) {
    return {
      where: {
        checkpoint: {gte: since},
        modelName: this.modelName,
      },
    };
  };

  /**
   * Add custom data to the Change instance.
   *
   * Models should override this function to duplicate model instance properties
   * to the Change instance properties, typically to allow the changes() method
   * to filter the changes using these duplicated properties directly while
   * querying the Change model.
   *
   * ```js
   * module.exports = (TargetModel, config) => {
   *   TargetModel.prototype.fillCustomChangeProperties = function(change, cb) {
   *     var inst = this;
   *     const base = this.constructor.base;
   *     base.prototype.fillCustomChangeProperties.call(this, change, err => {
   *       if (err) return cb(err);
   *
   *       if (inst && inst.tenantId) {
   *         change.tenantId = inst.tenantId;
   *       } else {
   *         change.tenantId = null;
   *       }
   *
   *       cb();
   *     });
   *   };
   * };
   * ```
   *
   * @callback {Function} callback
   * @param {Error} err Error object; see [Error object](http://loopback.io/doc/en/lb3/Error-object.html).
   */
  PersistedModel.prototype.fillCustomChangeProperties = function(change, cb) {
    // no-op by default
    cb();
  };

  PersistedModel.setup();

  return PersistedModel;
};
