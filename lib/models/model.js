/**
 * Module Dependencies.
 */

var ModelBuilder = require('jugglingdb').ModelBuilder
var modeler = new ModelBuilder();

/**
 * Extends from the built in `asteroid.Model` type.
 */

var Model = module.exports = modeler.define('model');

Model.shared = true;
Model.sharedCtor = function (data, id, fn) {
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
    ModelCtor.find(id, function (err, model) {
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
Model.beforeRemote = function (name, fn) {
  var self = this;
  if(this.app) {
    var remotes = this.app.remotes();
    remotes.before(self.pluralModelName + '.' + name, function (ctx, next) {
      fn(ctx, ctx.result, next);
    });
  } else {
    var args = arguments;
    this.once('attached', function () {
      self.beforeRemote.apply(self, args);
    });
  }
}

// after remote hook
Model.afterRemote = function (name, fn) {
  var self = this;
  if(this.app) {
    var remotes = this.app.remotes();
    remotes.after(self.pluralModelName + '.' + name, function (ctx, next) {
      fn(ctx, ctx.result, next);
    });
  } else {
    var args = arguments;
    this.once('attached', function () {
      self.afterRemote.apply(self, args);
    });
  }
}

/*!
 * Setup extended models.
 */

Model.setup = function () {
  var ModelCtor = this;
  
  ModelCtor.sharedCtor.accepts = [
    {arg: 'data', type: 'object', http: {source: 'body'}},
    {arg: 'id', type: 'any', http: {source: 'url'}}
  ];

  ModelCtor.sharedCtor.http = [
    {path: '/'},
    {path: '/:id'}
  ];
  
  return ModelCtor;
}

// setup the initial model
Model.setup();