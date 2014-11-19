/*!
 * Module dependencies.
 */

var express = require('express');
var loopbackExpress = require('./server-app');
var proto = require('./application');
var fs = require('fs');
var ejs = require('ejs');
var path = require('path');
var merge = require('util')._extend;
var assert = require('assert');

/**
 * LoopBack core module. It provides static properties and
 * methods to create models and data sources. The module itself is a function
 * that creates loopback `app`. For example:
 *
 * ```js
 * var loopback = require('loopback');
 * var app = loopback();
 * ```
 *
 * @property {String} version Version of LoopBack framework.  Static read-only property.
 * @property {String} mime
 * @property {Boolean} isBrowser True if running in a browser environment; false otherwise.  Static read-only property.
 * @property {Boolean} isServer True if running in a server environment; false otherwise.  Static read-only property.
 * @property {String} faviconFile Path to a default favicon shipped with LoopBack.
 * Use as follows: `app.use(require('serve-favicon')(loopback.faviconFile));`
 * @class loopback
 * @header loopback
 */

var loopback = module.exports = createApplication;

/*!
 * Framework version.
 */

loopback.version = require('../package.json').version;

/*!
 * Expose mime.
 */

loopback.mime = express.mime;

/*!
 * Create an loopback application.
 *
 * @return {Function}
 * @api public
 */

function createApplication() {
  var app = loopbackExpress();

  merge(app, proto);

  app.loopback = loopback;

  // Create a new instance of models registry per each app instance
  app.models = function() {
    return proto.models.apply(this, arguments);
  };

  // Create a new instance of datasources registry per each app instance
  app.datasources = app.dataSources = {};

  // Create a new instance of connector registry per each app instance
  app.connectors = {};

  // Register built-in connectors. It's important to keep this code
  // hand-written, so that all require() calls are static
  // and thus browserify can process them (include connectors in the bundle)
  app.connector('memory', loopback.Memory);
  app.connector('remote', loopback.Remote);

  return app;
}

function mixin(source) {
  for (var key in source) {
    var desc = Object.getOwnPropertyDescriptor(source, key);

    // Fix for legacy (pre-ES5) browsers like PhantomJS
    if (!desc) continue;

    Object.defineProperty(loopback, key, desc);
  }
}

mixin(require('./runtime'));
mixin(require('./registry'));

/*!
 * Expose static express methods like `express.errorHandler`.
 */

mixin(express);

/*!
 * Expose additional middleware like session as loopback.*
 * This will keep the loopback API compatible with express 3.x
 *
 * ***only in node***
 */

if (loopback.isServer) {
  var middlewares = require('./express-middleware');
  mixin(middlewares);
}

/*!
 * Expose additional loopback middleware
 * for example `loopback.configure` etc.
 *
 * ***only in node***
 */

if (loopback.isServer) {
  fs
    .readdirSync(path.join(__dirname, '..', 'server', 'middleware'))
    .filter(function(file) {
      return file.match(/\.js$/);
    })
    .forEach(function(m) {
      loopback[m.replace(/\.js$/, '')] = require('../server/middleware/' + m);
    });

  loopback.urlNotFound = loopback['url-not-found'];
  delete loopback['url-not-found'];
}

/*
 * Expose path to the default favicon file
 *
 * ***only in node***
 */

if (loopback.isServer) {
  /*!
   * Path to a default favicon shipped with LoopBack.
   *
   * **Example**
   *
   * ```js
   * app.use(require('serve-favicon')(loopback.faviconFile));
   * ```
   */
  loopback.faviconFile = path.resolve(__dirname, '../favicon.ico');
}

/*!
 * Error handler title
 */

loopback.errorHandler.title = 'Loopback';

/**
 * Add a remote method to a model.
 * @param {Function} fn
 * @param {Object} options (optional)
 */

loopback.remoteMethod = function(fn, options) {
  fn.shared = true;
  if (typeof options === 'object') {
    Object.keys(options).forEach(function(key) {
      fn[key] = options[key];
    });
  }
  fn.http = fn.http || {verb: 'get'};
};

/**
 * Create a template helper.
 *
 *     var render = loopback.template('foo.ejs');
 *     var html = render({foo: 'bar'});
 *
 * @param {String} path Path to the template file.
 * @returns {Function}
 */

loopback.template = function(file) {
  var templates = this._templates || (this._templates = {});
  var str = templates[file] || (templates[file] = fs.readFileSync(file, 'utf8'));
  return ejs.compile(str);
};

loopback.getCurrentContext = function() {
  // A placeholder method, see lib/middleware/context.js for the real version
  return null;
};

/*!
 * Built in models / services
 */

require('./builtin-models')(loopback);
