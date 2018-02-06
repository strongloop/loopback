// Copyright IBM Corp. 2014,2018. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

/*!
 * Module Dependencies.
 */
'use strict';
var g = require('./globalize');
var assert = require('assert');
var debug = require('debug')('loopback:model');
var RemoteObjects = require('strong-remoting');
var SharedClass = require('strong-remoting').SharedClass;
var extend = require('util')._extend;
var format = require('util').format;

var deprecated = require('depd')('loopback');

module.exports = function(registry) {
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
   * Argument: `inst`, model instance, object
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
   * Argument: `id`, model ID (number).
   *
   * ```js
   * MyModel.on('deleted', function(id) {
   *   console.log('model with id %s has been deleted', id);
   *   // => model with id 1 has been deleted
   * });
   * ```
   *
   * #### Event: `deletedAll`
   *
   * Emitted after all models have been deleted.
   * Argument: `where` (optional), where filter, JSON object.
   *
   * ```js
   * MyModel.on('deletedAll', function(where) {
   *   if (where) {
   *     console.log('all models where ', where, ' have been deleted');
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
   * #### Event: set
   *
   * Emitted when model property is set.
   * Argument: `inst`, model instance, object
   *
   * ```js
   * MyModel.on('set', function(inst) {
   *   console.log('model with id %s has been changed', inst.id);
   *   // => model with id 1 has been changed
   * });
   * ```
   *
   * @param {Object} data
   * @property {String} Model.modelName The name of the model. Static property.
   * @property {DataSource} Model.dataSource Data source to which the model is connected, if any. Static property.
   * @property {SharedClass} Model.sharedMethod The `strong-remoting` [SharedClass](http://apidocs.strongloop.com/strong-remoting/#sharedclass) that contains remoting (and http) metadata. Static property.
   * @property {Object} settings Contains additional model settings.
   * @property {string} settings.http.path Base URL of the model HTTP route.
   * @property {Array.<Object>} settings.acls Array of ACLs for the model.
   * @class
   */
  var Model = registry.modelBuilder.define('Model');

  Model.registry = registry;

  /**
   * The `loopback.Model.extend()` method calls this when you create a model that extends another model.
   * Add any setup or configuration code you want executed when the model is created.
   * See  [Setting up a custom model](http://loopback.io/doc/en/lb2/Extending-built-in-models.html#setting-up-a-custom-model).
   */

  Model.setup = function() {
    var ModelCtor = this;
    var Parent = this.super_;

    if (!ModelCtor.registry && Parent && Parent.registry) {
      ModelCtor.registry = Parent.registry;
    }

    var options = this.settings;
    var typeName = this.modelName;

    // support remoting prototype methods
    // it's important to setup this function *before* calling `new SharedClass`
    // otherwise remoting metadata from our base model is picked up
    ModelCtor.sharedCtor = function(data, id, options, fn) {
      var ModelCtor = this;

      var isRemoteInvocationWithOptions = typeof data !== 'object' &&
        typeof id === 'object' &&
        typeof options === 'function';
      if (isRemoteInvocationWithOptions) {
        // sharedCtor(id, options, fn)
        fn = options;
        options = id;
        id = data;
        data = null;
      } else if (typeof data === 'function') {
        // sharedCtor(fn)
        fn = data;
        data = null;
        id = null;
        options = null;
      } else if (typeof id === 'function') {
        // sharedCtor(data, fn)
        // sharedCtor(id, fn)
        fn = id;
        options = null;

        if (typeof data !== 'object') {
          id = data;
          data = null;
        } else {
          id = null;
        }
      }

      if (id != null && data) {
        var model = new ModelCtor(data);
        model.id = id;
        fn(null, model);
      } else if (data) {
        fn(null, new ModelCtor(data));
      } else if (id != null) {
        var filter = {};
        ModelCtor.findById(id, filter, options, function(err, model) {
          if (err) {
            fn(err);
          } else if (model) {
            fn(null, model);
          } else {
            err = new Error(g.f('could not find a model with {{id}} %s', id));
            err.statusCode = 404;
            err.code = 'MODEL_NOT_FOUND';
            fn(err);
          }
        });
      } else {
        fn(new Error(g.f('must specify an {{id}} or {{data}}')));
      }
    };

    var idDesc = ModelCtor.modelName + ' id';
    ModelCtor.sharedCtor.accepts = [
      {arg: 'id', type: 'any', required: true, http: {source: 'path'},
        description: idDesc},
      // {arg: 'instance', type: 'object', http: {source: 'body'}}
      {arg: 'options', type: 'object', http: createOptionsViaModelMethod},
    ];

    ModelCtor.sharedCtor.http = [
      {path: '/:id'},
    ];

    ModelCtor.sharedCtor.returns = {root: true};

    var remotingOptions = {};
    extend(remotingOptions, options.remoting || {});

    // create a sharedClass
    var sharedClass = ModelCtor.sharedClass = new SharedClass(
      ModelCtor.modelName,
      ModelCtor,
      remotingOptions
    );

    // before remote hook
    ModelCtor.beforeRemote = function(name, fn) {
      var className = this.modelName;
      this._runWhenAttachedToApp(function(app) {
        var remotes = app.remotes();
        remotes.before(className + '.' + name, function(ctx, next) {
          return fn(ctx, ctx.result, next);
        });
      });
    };

    // after remote hook
    ModelCtor.afterRemote = function(name, fn) {
      var className = this.modelName;
      this._runWhenAttachedToApp(function(app) {
        var remotes = app.remotes();
        remotes.after(className + '.' + name, function(ctx, next) {
          return fn(ctx, ctx.result, next);
        });
      });
    };

    ModelCtor.afterRemoteError = function(name, fn) {
      var className = this.modelName;
      this._runWhenAttachedToApp(function(app) {
        var remotes = app.remotes();
        remotes.afterError(className + '.' + name, fn);
      });
    };

    ModelCtor._runWhenAttachedToApp = function(fn) {
      if (this.app) return fn(this.app);
      var self = this;
      self.once('attached', function() {
        fn(self.app);
      });
    };

    if ('injectOptionsFromRemoteContext' in options) {
      console.warn(g.f(
        '%s is using model setting %s which is no longer available.',
        typeName, 'injectOptionsFromRemoteContext'));
      console.warn(g.f(
        'Please rework your app to use the offical solution for injecting ' +
          '"options" argument from request context,\nsee %s',
        'http://loopback.io/doc/en/lb3/Using-current-context.html'));
    }

    // resolve relation functions
    sharedClass.resolve(function resolver(define) {
      var relations = ModelCtor.relations || {};
      var defineRaw = define;
      define = function(name, options, fn) {
        if (options.accepts) {
          options = extend({}, options);
          options.accepts = setupOptionsArgs(options.accepts);
        }
        defineRaw(name, options, fn);
      };

      // get the relations
      for (var relationName in relations) {
        var relation = relations[relationName];
        if (relation.type === 'belongsTo') {
          ModelCtor.belongsToRemoting(relationName, relation, define);
        } else if (
          relation.type === 'hasOne' ||
          relation.type === 'embedsOne'
        ) {
          ModelCtor.hasOneRemoting(relationName, relation, define);
        } else if (
          relation.type === 'hasMany' ||
          relation.type === 'embedsMany' ||
          relation.type === 'referencesMany') {
          ModelCtor.hasManyRemoting(relationName, relation, define);
        }
        // Automatically enable nestRemoting if the flag is set to true in the
        // relation options
        if (relation.options && relation.options.nestRemoting) {
          ModelCtor.nestRemoting(relationName);
        }
      }

      // handle scopes
      var scopes = ModelCtor.scopes || {};
      for (var scopeName in scopes) {
        ModelCtor.scopeRemoting(scopeName, scopes[scopeName], define);
      }
    });

    return ModelCtor;
  };

  /*!
   * Get the reference to ACL in a lazy fashion to avoid race condition in require
   */
  var _aclModel = null;
  Model._ACL = function getACL(ACL) {
    var registry = this.registry;
    if (ACL !== undefined) {
      // The function is used as a setter
      _aclModel = ACL;
    }
    if (_aclModel) {
      return _aclModel;
    }
    var aclModel = registry.getModel('ACL');
    _aclModel = registry.getModelByType(aclModel);
    return _aclModel;
  };

  /**
   * Check if the given access token can invoke the specified method.
   *
   * @param {AccessToken} token The access token.
   * @param {*} modelId The model ID.
   * @param {SharedMethod} sharedMethod The method in question.
   * @param {Object} ctx The remote invocation context.
   * @callback {Function} callback The callback function.
   * @param {String|Error} err The error object.
   * @param {Boolean} allowed True if the request is allowed; false otherwise.
   */

  Model.checkAccess = function(token, modelId, sharedMethod, ctx, callback) {
    var ANONYMOUS = registry.getModel('AccessToken').ANONYMOUS;
    token = token || ANONYMOUS;
    var aclModel = Model._ACL();

    ctx = ctx || {};
    if (typeof ctx === 'function' && callback === undefined) {
      callback = ctx;
      ctx = {};
    }

    aclModel.checkAccessForContext({
      accessToken: token,
      model: this,
      property: sharedMethod.name,
      method: sharedMethod.name,
      sharedMethod: sharedMethod,
      modelId: modelId,
      accessType: this._getAccessTypeForMethod(sharedMethod),
      remotingContext: ctx,
    }, function(err, accessRequest) {
      if (err) return callback(err);
      callback(null, accessRequest.isAllowed());
    });
  };

  /*!
   * Determine the access type for the given `RemoteMethod`.
   *
   * @api private
   * @param {RemoteMethod} method
   */

  Model._getAccessTypeForMethod = function(method) {
    if (typeof method === 'string') {
      method = {name: method};
    }
    assert(
      typeof method === 'object',
      'method is a required argument and must be a RemoteMethod object'
    );

    var ACL = Model._ACL();

    // Check the explicit setting of accessType
    if (method.accessType) {
      assert(method.accessType === ACL.READ ||
        method.accessType === ACL.REPLICATE ||
        method.accessType === ACL.WRITE ||
        method.accessType === ACL.EXECUTE, 'invalid accessType ' +
        method.accessType +
        '. It must be "READ", "REPLICATE", "WRITE", or "EXECUTE"');
      return method.accessType;
    }

    // Default GET requests to READ
    var verb = method.http && method.http.verb;
    if (typeof verb === 'string') {
      verb = verb.toUpperCase();
    }
    if (verb === 'GET' || verb === 'HEAD') {
      return ACL.READ;
    }

    switch (method.name) {
      case 'create':
        return ACL.WRITE;
      case 'updateOrCreate':
        return ACL.WRITE;
      case 'upsertWithWhere':
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
      default:
        return ACL.EXECUTE;
    }
  };

  /**
   * Get the `Application` object to which the Model is attached.
   *
   * @callback {Function} callback Callback function called with `(err, app)` arguments.
   * @param {Error} err Error object; see [Error object](http://loopback.io/doc/en/lb2/Error-object.html).
   * @param {Application} app Attached application object.
   * @end
   */

  Model.getApp = function(callback) {
    var self = this;
    self._runWhenAttachedToApp(function(app) {
      assert(self.app);
      assert.equal(app, self.app);
      callback(null, app);
    });
  };

  /**
   * Enable remote invocation for the specified method.
   * See [Remote methods](http://loopback.io/doc/en/lb2/Remote-methods.html) for more information.
   *
   * Static method example:
   * ```js
   * Model.myMethod();
   * Model.remoteMethod('myMethod');
   * ```
   *
   * @param {String} name The name of the method.
   * @param {Object} options The remoting options.
   * See [Remote methods - Options](http://loopback.io/doc/en/lb2/Remote-methods.html#options).
   */

  Model.remoteMethod = function(name, options) {
    if (options.isStatic === undefined) {
      var m = name.match(/^prototype\.(.*)$/);
      options.isStatic = !m;
      name = options.isStatic ? name : m[1];
    }

    if (options.accepts) {
      options = extend({}, options);
      options.accepts = setupOptionsArgs(options.accepts);
    }

    this.sharedClass.defineMethod(name, options);
    this.emit('remoteMethodAdded', this.sharedClass);
  };

  function setupOptionsArgs(accepts) {
    if (!Array.isArray(accepts))
      accepts = [accepts];

    return accepts.map(function(arg) {
      if (arg.http && arg.http === 'optionsFromRequest') {
        // clone to preserve the input value
        arg = extend({}, arg);
        arg.http = createOptionsViaModelMethod;
      }
      return arg;
    });
  }

  function createOptionsViaModelMethod(ctx) {
    var EMPTY_OPTIONS = {};
    var ModelCtor = ctx.method && ctx.method.ctor;
    if (!ModelCtor)
      return EMPTY_OPTIONS;
    if (typeof ModelCtor.createOptionsFromRemotingContext !== 'function')
      return EMPTY_OPTIONS;
    debug('createOptionsFromRemotingContext for %s', ctx.method.stringName);
    return ModelCtor.createOptionsFromRemotingContext(ctx);
  }

  /**
   * Disable remote invocation for the method with the given name.
   *
   * @param {String} name The name of the method.
   * @param {Boolean} isStatic Is the method static (eg. `MyModel.myMethod`)? Pass
   * `false` if the method defined on the prototype (eg.
   * `MyModel.prototype.myMethod`).
   */

  Model.disableRemoteMethod = function(name, isStatic) {
    deprecated('Model.disableRemoteMethod is deprecated. ' +
      'Use Model.disableRemoteMethodByName instead.');
    var key = this.sharedClass.getKeyFromMethodNameAndTarget(name, isStatic);
    this.sharedClass.disableMethodByName(key);
    this.emit('remoteMethodDisabled', this.sharedClass, key);
  };

  /**
   * Disable remote invocation for the method with the given name.
   *
   * @param {String} name The name of the method (include "prototype." if the method is defined on the prototype).
   *
   */

  Model.disableRemoteMethodByName = function(name) {
    this.sharedClass.disableMethodByName(name);
    this.emit('remoteMethodDisabled', this.sharedClass, name);
  };

  Model.belongsToRemoting = function(relationName, relation, define) {
    var modelName = relation.modelTo && relation.modelTo.modelName;
    modelName = modelName || 'PersistedModel';
    var fn = this.prototype[relationName];
    var pathName = (relation.options.http && relation.options.http.path) || relationName;
    define('__get__' + relationName, {
      isStatic: false,
      http: {verb: 'get', path: '/' + pathName},
      accepts: [
        {arg: 'refresh', type: 'boolean', http: {source: 'query'}},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'},
      ],
      accessType: 'READ',
      description: format('Fetches belongsTo relation %s.', relationName),
      returns: {arg: relationName, type: modelName, root: true},
    }, fn);
  };

  function convertNullToNotFoundError(toModelName, ctx, cb) {
    if (ctx.result !== null) return cb();

    var fk = ctx.getArgByName('fk');
    var msg = g.f('Unknown "%s" id "%s".', toModelName, fk);
    var error = new Error(msg);
    error.statusCode = error.status = 404;
    error.code = 'MODEL_NOT_FOUND';
    cb(error);
  }

  Model.hasOneRemoting = function(relationName, relation, define) {
    var pathName = (relation.options.http && relation.options.http.path) || relationName;
    var toModelName = relation.modelTo.modelName;

    define('__get__' + relationName, {
      isStatic: false,
      http: {verb: 'get', path: '/' + pathName},
      accepts: [
        {arg: 'refresh', type: 'boolean', http: {source: 'query'}},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'},
      ],
      description: format('Fetches hasOne relation %s.', relationName),
      accessType: 'READ',
      returns: {arg: relationName, type: relation.modelTo.modelName, root: true},
      rest: {after: convertNullToNotFoundError.bind(null, toModelName)},
    });

    define('__create__' + relationName, {
      isStatic: false,
      http: {verb: 'post', path: '/' + pathName},
      accepts: [
        {
          arg: 'data', type: 'object', model: toModelName,
          http: {source: 'body'},
        },
        {arg: 'options', type: 'object', http: 'optionsFromRequest'},
      ],
      description: format('Creates a new instance in %s of this model.', relationName),
      accessType: 'WRITE',
      returns: {arg: 'data', type: toModelName, root: true},
    });

    define('__update__' + relationName, {
      isStatic: false,
      http: {verb: 'put', path: '/' + pathName},
      accepts: [
        {
          arg: 'data', type: 'object', model: toModelName,
          http: {source: 'body'},
        },
        {arg: 'options', type: 'object', http: 'optionsFromRequest'},
      ],
      description: format('Update %s of this model.', relationName),
      accessType: 'WRITE',
      returns: {arg: 'data', type: toModelName, root: true},
    });

    define('__destroy__' + relationName, {
      isStatic: false,
      http: {verb: 'delete', path: '/' + pathName},
      accepts: [
        {arg: 'options', type: 'object', http: 'optionsFromRequest'},
      ],
      description: format('Deletes %s of this model.', relationName),
      accessType: 'WRITE',
    });
  };

  Model.hasManyRemoting = function(relationName, relation, define) {
    var pathName = (relation.options.http && relation.options.http.path) || relationName;
    var toModelName = relation.modelTo.modelName;

    var findByIdFunc = this.prototype['__findById__' + relationName];
    define('__findById__' + relationName, {
      isStatic: false,
      http: {verb: 'get', path: '/' + pathName + '/:fk'},
      accepts: [
        {
          arg: 'fk', type: 'any',
          description: format('Foreign key for %s', relationName),
          required: true,
          http: {source: 'path'},
        },
        {arg: 'options', type: 'object', http: 'optionsFromRequest'},
      ],
      description: format('Find a related item by id for %s.', relationName),
      accessType: 'READ',
      returns: {arg: 'result', type: toModelName, root: true},
      rest: {after: convertNullToNotFoundError.bind(null, toModelName)},
    }, findByIdFunc);

    var destroyByIdFunc = this.prototype['__destroyById__' + relationName];
    define('__destroyById__' + relationName, {
      isStatic: false,
      http: {verb: 'delete', path: '/' + pathName + '/:fk'},
      accepts: [
        {
          arg: 'fk', type: 'any',
          description: format('Foreign key for %s', relationName),
          required: true,
          http: {source: 'path'},
        },
        {arg: 'options', type: 'object', http: 'optionsFromRequest'},
      ],
      description: format('Delete a related item by id for %s.', relationName),
      accessType: 'WRITE',
      returns: [],
    }, destroyByIdFunc);

    var updateByIdFunc = this.prototype['__updateById__' + relationName];
    define('__updateById__' + relationName, {
      isStatic: false,
      http: {verb: 'put', path: '/' + pathName + '/:fk'},
      accepts: [
        {arg: 'fk', type: 'any',
          description: format('Foreign key for %s', relationName),
          required: true,
          http: {source: 'path'}},
        {arg: 'data', type: 'object', model: toModelName, http: {source: 'body'}},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'},
      ],
      description: format('Update a related item by id for %s.', relationName),
      accessType: 'WRITE',
      returns: {arg: 'result', type: toModelName, root: true},
    }, updateByIdFunc);

    if (relation.modelThrough || relation.type === 'referencesMany') {
      var modelThrough = relation.modelThrough || relation.modelTo;

      var accepts = [];
      if (relation.type === 'hasMany' && relation.modelThrough) {
        // Restrict: only hasManyThrough relation can have additional properties
        accepts.push({
          arg: 'data', type: 'object', model: modelThrough.modelName,
          http: {source: 'body'},
        });
      }

      var addFunc = this.prototype['__link__' + relationName];
      define('__link__' + relationName, {
        isStatic: false,
        http: {verb: 'put', path: '/' + pathName + '/rel/:fk'},
        accepts: [{arg: 'fk', type: 'any',
          description: format('Foreign key for %s', relationName),
          required: true,
          http: {source: 'path'}},
        ].concat(accepts).concat([
          {arg: 'options', type: 'object', http: 'optionsFromRequest'},
        ]),
        description: format('Add a related item by id for %s.', relationName),
        accessType: 'WRITE',
        returns: {arg: relationName, type: modelThrough.modelName, root: true},
      }, addFunc);

      var removeFunc = this.prototype['__unlink__' + relationName];
      define('__unlink__' + relationName, {
        isStatic: false,
        http: {verb: 'delete', path: '/' + pathName + '/rel/:fk'},
        accepts: [
          {
            arg: 'fk', type: 'any',
            description: format('Foreign key for %s', relationName),
            required: true,
            http: {source: 'path'},
          },
          {arg: 'options', type: 'object', http: 'optionsFromRequest'},
        ],
        description: format('Remove the %s relation to an item by id.', relationName),
        accessType: 'WRITE',
        returns: [],
      }, removeFunc);

      // FIXME: [rfeng] How to map a function with callback(err, true|false) to HEAD?
      // true --> 200 and false --> 404?
      var existsFunc = this.prototype['__exists__' + relationName];
      define('__exists__' + relationName, {
        isStatic: false,
        http: {verb: 'head', path: '/' + pathName + '/rel/:fk'},
        accepts: [
          {
            arg: 'fk', type: 'any',
            description: format('Foreign key for %s', relationName),
            required: true,
            http: {source: 'path'},
          },
          {arg: 'options', type: 'object', http: 'optionsFromRequest'},
        ],
        description: format('Check the existence of %s relation to an item by id.', relationName),
        accessType: 'READ',
        returns: {arg: 'exists', type: 'boolean', root: true},
        rest: {
          // After hook to map exists to 200/404 for HEAD
          after: function(ctx, cb) {
            if (ctx.result === false) {
              var modelName = ctx.method.sharedClass.name;
              var id = ctx.getArgByName('id');
              var msg = g.f('Unknown "%s" {{id}} "%s".', modelName, id);
              var error = new Error(msg);
              error.statusCode = error.status = 404;
              error.code = 'MODEL_NOT_FOUND';
              cb(error);
            } else {
              cb();
            }
          },
        },
      }, existsFunc);
    }
  };

  Model.scopeRemoting = function(scopeName, scope, define) {
    var pathName =
      (scope.options && scope.options.http && scope.options.http.path) || scopeName;

    var modelTo = scope.modelTo;

    var isStatic = scope.isStatic;
    var toModelName = scope.modelTo.modelName;

    // https://github.com/strongloop/loopback/issues/811
    // Check if the scope is for a hasMany relation
    var relation = this.relations[scopeName];
    if (relation && relation.modelTo) {
      // For a relation with through model, the toModelName should be the one
      // from the target model
      toModelName = relation.modelTo.modelName;
      modelTo = relation.modelTo;
    }

    // if there is atleast one updateOnly property, then we set
    // createOnlyInstance flag in __create__ to indicate loopback-swagger
    // code to create a separate model instance for create operation only
    const updateOnlyProps = modelTo.getUpdateOnlyProperties ?
      modelTo.getUpdateOnlyProperties() : false;
    const hasUpdateOnlyProps = updateOnlyProps && updateOnlyProps.length > 0;

    define('__get__' + scopeName, {
      isStatic: isStatic,
      http: {verb: 'get', path: '/' + pathName},
      accepts: [
        {arg: 'filter', type: 'object'},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'},
      ],
      description: format('Queries %s of %s.', scopeName, this.modelName),
      accessType: 'READ',
      returns: {arg: scopeName, type: [toModelName], root: true},
    });

    define('__create__' + scopeName, {
      isStatic: isStatic,
      http: {verb: 'post', path: '/' + pathName},
      accepts: [
        {
          arg: 'data',
          type: 'object',
          allowArray: true,
          model: toModelName,
          createOnlyInstance: hasUpdateOnlyProps,
          http: {source: 'body'},
        },
        {arg: 'options', type: 'object', http: 'optionsFromRequest'},
      ],
      description: format('Creates a new instance in %s of this model.', scopeName),
      accessType: 'WRITE',
      returns: {arg: 'data', type: toModelName, root: true},
    });

    define('__delete__' + scopeName, {
      isStatic: isStatic,
      http: {verb: 'delete', path: '/' + pathName},
      accepts: [
        {
          arg: 'where', type: 'object',
          // The "where" argument is not exposed in the REST API
          // but we need to provide a value so that we can pass "options"
          // as the third argument.
          http: function(ctx) { return undefined; },
        },
        {arg: 'options', type: 'object', http: 'optionsFromRequest'},
      ],
      description: format('Deletes all %s of this model.', scopeName),
      accessType: 'WRITE',
    });

    define('__count__' + scopeName, {
      isStatic: isStatic,
      http: {verb: 'get', path: '/' + pathName + '/count'},
      accepts: [
        {
          arg: 'where', type: 'object',
          description: 'Criteria to match model instances',
        },
        {arg: 'options', type: 'object', http: 'optionsFromRequest'},
      ],
      description: format('Counts %s of %s.', scopeName, this.modelName),
      accessType: 'READ',
      returns: {arg: 'count', type: 'number'},
    });
  };

  /**
  * Enabled deeply-nested queries of related models via REST API.
  *
  * @param {String} relationName Name of the nested relation.
  * @options {Object} [options] It is optional. See below.
  * @param {String} pathName The HTTP path (relative to the model) at which your remote method is exposed.
  * @param {String} filterMethod The filter name.
  * @param {String} paramName The argument name that the remote method accepts.
  * @param {String} getterName The getter name.
  * @param {Boolean} hooks Whether to inherit before/after hooks.
  * @callback {Function} filterCallback The Optional filter function.
  * @param {Object} SharedMethod object. See [here](https://apidocs.strongloop.com/strong-remoting/#sharedmethod).
  * @param {Object} RelationDefinition object which includes relation `type`, `ModelConstructor` of `modelFrom`, `modelTo`, `keyFrom`, `keyTo` and more relation definitions.
   */

  Model.nestRemoting = function(relationName, options, filterCallback) {
    if (typeof options === 'function' && !filterCallback) {
      filterCallback = options;
      options = {};
    }
    options = options || {};

    var regExp = /^__([^_]+)__([^_]+)$/;
    var relation = this.relations[relationName];
    if (relation && relation._nestRemotingProcessed) {
      return; // Prevent unwanted circular traversals!
    } else if (relation && relation.modelTo && relation.modelTo.sharedClass) {
      relation._nestRemotingProcessed = true;
      var self = this;
      var sharedClass = this.sharedClass;
      var sharedToClass = relation.modelTo.sharedClass;
      var toModelName = relation.modelTo.modelName;

      var pathName = options.pathName || relation.options.path || relationName;
      var paramName = options.paramName || 'nk';

      var http = [].concat(sharedToClass.http || [])[0];
      var httpPath, acceptArgs;

      if (relation.multiple) {
        httpPath = pathName + '/:' + paramName;
        acceptArgs = [
          {
            arg: paramName, type: 'any', http: {source: 'path'},
            description: format('Foreign key for %s.', relation.name),
            required: true,
          },
        ];
      } else {
        httpPath = pathName;
        acceptArgs = [];
      }

      if (httpPath[0] !== '/') {
        httpPath = '/' + httpPath;
      }

      // A method should return the method name to use, if it is to be
      // included as a nested method - a falsy return value will skip.
      var filter = filterCallback || options.filterMethod || function(method, relation) {
        var matches = method.name.match(regExp);
        if (matches) {
          return '__' + matches[1] + '__' + relation.name + '__' + matches[2];
        }
      };

      sharedToClass.methods().forEach(function(method) {
        var methodName;
        if (!method.isStatic && (methodName = filter(method, relation))) {
          var prefix = relation.multiple ? '__findById__' : '__get__';
          var getterName = options.getterName || (prefix + relationName);

          var getterFn = relation.modelFrom.prototype[getterName];
          if (typeof getterFn !== 'function') {
            throw new Error(g.f('Invalid remote method: `%s`', getterName));
          }

          var nestedFn = relation.modelTo.prototype[method.name];
          if (typeof nestedFn !== 'function') {
            throw new Error(g.f('Invalid remote method: `%s`', method.name));
          }

          var opts = {};

          opts.accepts = acceptArgs.concat(method.accepts || []);
          opts.returns = [].concat(method.returns || []);
          opts.description = method.description;
          opts.accessType = method.accessType;
          opts.rest = extend({}, method.rest || {});
          opts.rest.delegateTo = method;

          opts.http = [];
          var routes = [].concat(method.http || []);
          routes.forEach(function(route) {
            if (route.path) {
              var copy = extend({}, route);
              copy.path = httpPath + route.path;
              opts.http.push(copy);
            }
          });

          const lastArg = opts.accepts[opts.accepts.length - 1] || {};
          const hasOptionsFromContext =
            (lastArg.arg || lastArg.name) === 'options' &&
            lastArg.type === 'object' && lastArg.http;

          if (relation.multiple) {
            sharedClass.defineMethod(methodName, opts, function(fkId) {
              const args = Array.prototype.slice.call(arguments, 1);
              const cb = args[args.length - 1];
              const contextOptions =
                hasOptionsFromContext && args[args.length - 2] || {};
              this[getterName](fkId, contextOptions, function(err, inst) {
                if (err) return cb(err);
                if (inst instanceof relation.modelTo) {
                  try {
                    nestedFn.apply(inst, args);
                  } catch (err) {
                    return cb(err);
                  }
                } else {
                  cb(err, null);
                }
              });
            }, method.isStatic);
          } else {
            sharedClass.defineMethod(methodName, opts, function() {
              const args = Array.prototype.slice.call(arguments);
              const cb = args[args.length - 1];
              const contextOptions =
                hasOptionsFromContext && args[args.length - 2] || {};
              this[getterName](contextOptions, function(err, inst) {
                if (err) return cb(err);
                if (inst instanceof relation.modelTo) {
                  try {
                    nestedFn.apply(inst, args);
                  } catch (err) {
                    return cb(err);
                  }
                } else {
                  cb(err, null);
                }
              });
            }, method.isStatic);
          }
        }
      });

      this.emit('remoteMethodAdded', this.sharedClass);

      if (options.hooks === false) return; // don't inherit before/after hooks

      self.once('mounted', function(app, sc, remotes) {
        var listenerTree = extend({}, remotes.listenerTree || {});
        listenerTree.before = listenerTree.before || {};
        listenerTree.after = listenerTree.after || {};

        var beforeListeners = listenerTree.before[toModelName] || {};
        var afterListeners = listenerTree.after[toModelName] || {};

        sharedClass.methods().forEach(function(method) {
          var delegateTo = method.rest && method.rest.delegateTo;
          if (delegateTo && delegateTo.ctor == relation.modelTo) {
            var before = method.isStatic ? beforeListeners : beforeListeners['prototype'];
            var after = method.isStatic ? afterListeners : afterListeners['prototype'];
            var m = method.isStatic ? method.name : 'prototype.' + method.name;
            if (before && before[delegateTo.name]) {
              self.beforeRemote(m, function(ctx, result, next) {
                before[delegateTo.name]._listeners.call(null, ctx, next);
              });
            }
            if (after && after[delegateTo.name]) {
              self.afterRemote(m, function(ctx, result, next) {
                after[delegateTo.name]._listeners.call(null, ctx, next);
              });
            }
          }
        });
      });
    } else {
      var msg = g.f('Relation `%s` does not exist for model `%s`', relationName, this.modelName);
      throw new Error(msg);
    }
  };

  Model.ValidationError = require('loopback-datasource-juggler').ValidationError;

  /**
   * Create "options" value to use when invoking model methods
   * via strong-remoting (e.g. REST).
   *
   * Example
   *
   * ```js
   * MyModel.myMethod = function(options, cb) {
   *   // by default, options contains only one property "accessToken"
   *   var accessToken = options && options.accessToken;
   *   var userId = accessToken && accessToken.userId;
   *   var message = 'Hello ' + (userId ? 'user #' + userId : 'anonymous');
   *   cb(null, message);
   * });
   *
   * MyModel.remoteMethod('myMethod', {
   *   accepts: {
   *     arg: 'options',
   *     type: 'object',
   *     // "optionsFromRequest" is a loopback-specific HTTP mapping that
   *     // calls Model's createOptionsFromRemotingContext
   *     // to build the argument value
   *     http: 'optionsFromRequest'
   *    },
   *    returns: {
   *      arg: 'message',
   *      type: 'string'
   *    }
   * });
   * ```
   *
   * @param {Object} ctx A strong-remoting Context instance
   * @returns {Object} The value to pass to "options" argument.
   */
  Model.createOptionsFromRemotingContext = function(ctx) {
    return {
      accessToken: ctx.req ? ctx.req.accessToken : null,
    };
  };

  // setup the initial model
  Model.setup();

  return Model;
};
