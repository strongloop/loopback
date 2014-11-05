var ExpressRouter = require('express').Router;

/**
 * DecoratedRouter is a base class allowing descendants to decorate
 * express.Router methods and call the original implementation of the
 * decorated functions without the need to use `Function.prototype.apply`.
 * (`apply` incurs a significant performance penalty).
 *
 * **Example**
 *
 * ```js
 * var proto = Object.create(DecoratedRouter);
 *
 * module.exports = function MyRouter(options) {
 *   var router = new DecoratedRouter();
 *   router.__proto__ = proto;
 *   return router;
 * }
 *
 * proto.handle = function(req, res, next) {
 *   // do some custom stuff
 *   this._super.handle(req, res, next);
 * };
 * ```
 *
 * @param {object} options Router options
 * @class DecoratedRouter
 */
var proto = module.exports = function DecoratedRouter(options) {
  var router = function(req, res, next) {
    return router.handle(req, res, next);
  };

  /* jshint proto:true */
  // mixin DecoratedRouter class functions
  router.__proto__ = proto;

  router._super = new ExpressRouter(options);

  //TODO(bajtos) write a unit-test for this,
  // checking e.g. `router.strict` or `router.caseSensitive`
  Object.getOwnPropertyNames(router._super).forEach(function(name) {
    if (name[0] === '_' || name in router) return;
    Object.defineProperty(router, name, {
      get: function() { return this._super[name]; },
      set: function(value) { this._super[name] = value; }
    });
  });

  return router;
};

Object.keys(ExpressRouter).forEach(function(key) {
  if (typeof ExpressRouter[key] === 'function') {
    proto[key] = delegateFn(key);
  } else {
    Object.defineProperty(proto, key, {
      get: function() { return ExpressRouter[key]; },
      set: function(value) { ExpressRouter[key] = value; }
    });
  }
});

function delegateFn(name) {
  return function() {
    var args = arguments;
    switch (args.length) {
      // fast cases
      case 0:
        return this._super[name]();
      case 1:
        return this._super[name](args[0]);
      case 2:
        return this._super[name](args[0], args[1]);
      case 3:
        return this._super[name](args[0], args[1], args[2]);
      case 4:
        return this._super[name](args[0], args[1], args[2], args[4]);
      // slow default via `apply`
      default:
        return this._super[name].apply(this._super, args);
    }
  };
}

// This is the most performance-critical method,
// make sure V8 can optimize it as much as possible
proto.handle = function(req, res, next) {
  this._super.handle(req, res, next);
};
