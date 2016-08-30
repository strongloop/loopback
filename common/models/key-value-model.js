var g = require('strong-globalize')();

module.exports = function(KeyValueModel) {
  // TODO add api docs
  KeyValueModel.get = function(key, options, callback) {
    throwNotAttached(this.modelName, 'get');
  };

  // TODO add api docs
  KeyValueModel.set = function(key, value, options, callback) {
    throwNotAttached(this.modelName, 'set');
  };

  // TODO add api docs
  KeyValueModel.expire = function(key, ttl, options, callback) {
    throwNotAttached(this.modelName, 'expire');
  };

  // TODO add api docs
  KeyValueModel.ttl = function(key, options, callback) {
    throwNotAttached(this.modelName, 'ttl');
  };

  // TODO add api docs
  KeyValueModel.keys = function(filter, options, callback) {
    throwNotAttached(this.modelName, 'keys');
  };

  // TODO add api docs
  KeyValueModel.iterateKeys = function(filter, options) {
    throwNotAttached(this.modelName, 'iterateKeys');
  };

  KeyValueModel.setup = function() {
    KeyValueModel.base.setup.apply(this, arguments);

    this.remoteMethod('get', {
      accepts: {
        arg: 'key', type: 'string', required: true,
        http: { source: 'path' },
      },
      returns: { arg: 'value', type: 'any', root: true },
      http: { path: '/:key', verb: 'get' },
      rest: { after: convertNullToNotFoundError },
    });

    this.remoteMethod('set', {
      accepts: [
        { arg: 'key', type: 'string', required: true,
          http: { source: 'path' }},
        { arg: 'value', type: 'any', required: true,
          http: { source: 'body' }},
        { arg: 'ttl', type: 'number',
          http: { source: 'query' },
          description: 'time to live in milliseconds' },
      ],
      http: { path: '/:key', verb: 'put' },
    });

    this.remoteMethod('expire', {
      accepts: [
        { arg: 'key', type: 'string', required: true,
          http: { source: 'path' }},
        { arg: 'ttl', type: 'number', required: true,
          http: { source: 'form' }},
      ],
      http: { path: '/:key/expire', verb: 'put' },
    });

    this.remoteMethod('ttl', {
      accepts: {
        arg: 'key', type: 'string', required: true,
        http: { source: 'path' },
      },
      returns: { arg: 'value', type: 'any', root: true },
      http: { path: '/:key/ttl', verb: 'get' },
    });

    this.remoteMethod('keys', {
      accepts: {
        arg: 'filter', type: 'object', required: false,
        http: { source: 'query' },
      },
      returns: { arg: 'keys', type: ['string'], root: true },
      http: { path: '/keys', verb: 'get' },
    });
  };
};

function throwNotAttached(modelName, methodName) {
  throw new Error(g.f(
    'Cannot call %s.%s(). ' +
      'The %s method has not been setup. '  +
      'The {{KeyValueModel}} has not been correctly attached ' +
      'to a {{DataSource}}!',
    modelName, methodName, methodName));
}

function convertNullToNotFoundError(ctx, cb) {
  if (ctx.result !== null) return cb();

  var modelName = ctx.method.sharedClass.name;
  var id = ctx.getArgByName('id');
  var msg = g.f('Unknown "%s" {{key}} "%s".', modelName, id);
  var error = new Error(msg);
  error.statusCode = error.status = 404;
  error.code = 'KEY_NOT_FOUND';
  cb(error);
}
