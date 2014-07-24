/*!
 * Module Dependencies.
 */
var registry = require('../registry');
var assert = require('assert');
var SharedClass = require('strong-remoting').SharedClass;

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

var Model = module.exports = registry.modelBuilder.define('Model');

/*!
 * Called when a model is extended.
 */

Model.setup = function () {
  var ModelCtor = this;
  var options = this.settings;

  // create a sharedClass
  var sharedClass = ModelCtor.sharedClass = new SharedClass(
    ModelCtor.modelName,
    ModelCtor,
    options.remoting
  );

  // support remoting prototype methods
  ModelCtor.sharedCtor = function (data, id, fn) {
    var ModelCtor = this;

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

  var idDesc = ModelCtor.modelName + ' id';
  ModelCtor.sharedCtor.accepts = [
    {arg: 'id', type: 'any', required: true, http: {source: 'path'},
      description: idDesc}
    // {arg: 'instance', type: 'object', http: {source: 'body'}}
  ];

  ModelCtor.sharedCtor.http = [
    {path: '/:id'}
  ];
  
  ModelCtor.sharedCtor.returns = {root: true};

  // before remote hook
  ModelCtor.beforeRemote = function (name, fn) {
    var self = this;
    if(this.app) {
      var remotes = this.app.remotes();
      var className = self.modelName;
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
      var className = self.modelName;
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

  // resolve relation functions
  sharedClass.resolve(function resolver(define) {
    var relations = ModelCtor.relations;
    if (!relations) {
      return;
    }
    // get the relations
    for (var relationName in relations) {
      var relation = relations[relationName];
      if (relation.type === 'belongsTo') {
        ModelCtor.belongsToRemoting(relationName, relation, define)
      } else if (relation.type === 'hasMany') {
        ModelCtor.hasManyRemoting(relationName, relation, define);
        ModelCtor.scopeRemoting(relationName, relation, define);
      } else {
        ModelCtor.scopeRemoting(relationName, relation, define);
      }
    }
  });

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
  _aclModel = registry.getModelByType(aclModel);
  return _aclModel;
};

/**
 * Check if the given access token can invoke the method
 *
 * @param {AccessToken} token The access token
 * @param {*} modelId The model ID.
 * @param {SharedMethod} sharedMethod The method in question
 * @callback {Function} callback The callback function
 * @param {String|Error} err The error object
 * @param {Boolean} allowed True if the request is allowed; false otherwise.
 */

Model.checkAccess = function(token, modelId, sharedMethod, callback) {
  var ANONYMOUS = require('./access-token').ANONYMOUS;
  token = token || ANONYMOUS;
  var aclModel = Model._ACL();
  
  aclModel.checkAccessForContext({
    accessToken: token,
    model: this,
    property: sharedMethod.name,
    method: sharedMethod.name,
    sharedMethod: sharedMethod,
    modelId: modelId,
    accessType: this._getAccessTypeForMethod(sharedMethod)
  }, function(err, accessRequest) {
    if(err) return callback(err);
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
    default:
      return ACL.EXECUTE;
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

/**
 * Enable remote invocation for the method with the given name.
 * 
 * @param {String} name The name of the method.
 * ```js
 * // static method example (eg. Model.myMethod())
 * Model.remoteMethod('myMethod');
 * @param {Object} options The remoting options.
 * See [loopback.remoteMethod()](http://docs.strongloop.com/display/DOC/Remote+methods+and+hooks#Remotemethodsandhooks-loopback.remoteMethod(fn,[options])) for details.
 */

Model.remoteMethod = function(name, options) {
  if(options.isStatic === undefined) {
    options.isStatic = true;
  }
  this.sharedClass.defineMethod(name, options);
}

Model.belongsToRemoting = function(relationName, relation, define) {
  var fn = this.prototype[relationName];
  define('__get__' + relationName, {
    isStatic: false,
    http: {verb: 'get', path: '/' + relationName},
    accepts: {arg: 'refresh', type: 'boolean', http: {source: 'query'}},
    description: 'Fetches belongsTo relation ' + relationName,
    returns: {arg: relationName, type: relation.modelTo.modelName, root: true}
  }, fn);
}

Model.hasManyRemoting = function (relationName, relation, define) {
  var toModelName = relation.modelTo.modelName;
  var findByIdFunc = this.prototype['__findById__' + relationName];
  define('__findById__' + relationName, {
    isStatic: false,
    http: {verb: 'get', path: '/' + relationName + '/:fk'},
    accepts: {arg: 'fk', type: 'any',
      description: 'Foreign key for ' + relationName, required: true,
      http: {source: 'path'}},
    description: 'Find a related item by id for ' + relationName,
    returns: {arg: 'result', type: toModelName, root: true}
  }, findByIdFunc);

  var destroyByIdFunc = this.prototype['__destroyById__' + relationName];
  define('__destroyById__' + relationName, {
    isStatic: false,
    http: {verb: 'delete', path: '/' + relationName + '/:fk'},
    accepts: {arg: 'fk', type: 'any',
      description: 'Foreign key for ' + relationName, required: true,
      http: {source: 'path'}},
    description: 'Delete a related item by id for ' + relationName,
    returns: {}
  }, destroyByIdFunc);

  var updateByIdFunc = this.prototype['__updateById__' + relationName];
  define('__updateById__' + relationName, {
    isStatic: false,
    http: {verb: 'put', path: '/' + relationName + '/:fk'},
    accepts: [
      {arg: 'fk', type: 'any',
        description: 'Foreign key for ' + relationName, required: true,
        http: {source: 'path'}},
      {arg: 'data', type: toModelName, http: {source: 'body'}}
    ],
    description: 'Update a related item by id for ' + relationName,
    returns: {arg: 'result', type: toModelName, root: true}
  }, updateByIdFunc);

  if (relation.modelThrough) {
    var addFunc = this.prototype['__link__' + relationName];
    define('__link__' + relationName, {
      isStatic: false,
      http: {verb: 'put', path: '/' + relationName + '/rel/:fk'},
      accepts: {arg: 'fk', type: 'any',
        description: 'Foreign key for ' + relationName, required: true,
        http: {source: 'path'}},
      description: 'Add a related item by id for ' + relationName,
      returns: {arg: relationName, type: relation.modelThrough.modelName, root: true}
    }, addFunc);

    var removeFunc = this.prototype['__unlink__' + relationName];
    define('__unlink__' + relationName, {
      isStatic: false,
      http: {verb: 'delete', path: '/' + relationName + '/rel/:fk'},
      accepts: {arg: 'fk', type: 'any',
        description: 'Foreign key for ' + relationName, required: true,
        http: {source: 'path'}},
      description: 'Remove the ' + relationName + ' relation to an item by id',
      returns: {}
    }, removeFunc);

    // FIXME: [rfeng] How to map a function with callback(err, true|false) to HEAD?
    // true --> 200 and false --> 404?
    var existsFunc = this.prototype['__exists__' + relationName];
    define('__exists__' + relationName, {
      isStatic: false,
      http: {verb: 'head', path: '/' + relationName + '/rel/:fk'},
      accepts: {arg: 'fk', type: 'any',
        description: 'Foreign key for ' + relationName, required: true,
        http: {source: 'path'}},
      description: 'Check the existence of ' + relationName + ' relation to an item by id',
      returns: {}
    }, existsFunc);
  }
};

Model.scopeRemoting = function(relationName, relation, define) {
  var toModelName = relation.modelTo.modelName;

  define('__get__' + relationName, {
    isStatic: false,
    http: {verb: 'get', path: '/' + relationName},
    accepts: {arg: 'filter', type: 'object'},
    description: 'Queries ' + relationName + ' of ' + this.modelName + '.',
    returns: {arg: relationName, type: [toModelName], root: true}
  });

  define('__create__' + relationName, {
    isStatic: false,
    http: {verb: 'post', path: '/' + relationName},
    accepts: {arg: 'data', type: toModelName, http: {source: 'body'}},
    description: 'Creates a new instance in ' + relationName + ' of this model.',
    returns: {arg: 'data', type: toModelName, root: true}
  });

  define('__delete__' + relationName, {
    isStatic: false,
    http: {verb: 'delete', path: '/' + relationName},
    description: 'Deletes all ' + relationName + ' of this model.'
  });
}

// setup the initial model
Model.setup();

