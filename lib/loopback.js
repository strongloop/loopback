/*!
 * Module dependencies.
 */

var express = require('express')
  , proto = require('./application')
  , fs = require('fs')
  , ejs = require('ejs')
  , EventEmitter = require('events').EventEmitter
  , path = require('path')
  , DataSource = require('loopback-datasource-juggler').DataSource
  , ModelBuilder = require('loopback-datasource-juggler').ModelBuilder
  , i8n = require('inflection')
  , merge = require('util')._extend
  , assert = require('assert');

/**
 * Main entry for LoopBack core module. It provides static properties and
 * methods to create models and data sources. The module itself is a function
 * that creates loopback `app`. For example,
 *
 * ```js
 * var loopback = require('loopback');
 * var app = loopback();
 * ```
 *
 * @class loopback
 * @header loopback
 */

var loopback = exports = module.exports = createApplication;

/**
 * Framework version.
 */

loopback.version = require('../package.json').version;

/**
 * Expose mime.
 */

loopback.mime = express.mime;

/*!
 * Compatibility layer, intentionally left undocumented.
 */
loopback.compat = require('./compat');

/*!
 * Create an loopback application.
 *
 * @return {Function}
 * @api public
 */

function createApplication() {
  var app = express();

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
    Object.defineProperty(loopback, key, desc);
  }
}

mixin(require('./runtime'));
mixin(require('./registry'));

/*!
 * Expose express.middleware as loopback.*
 * for example `loopback.errorHandler` etc.
 */

mixin(express);


/*!
 * Expose additional loopback middleware
 * for example `loopback.configure` etc.
 *
 * ***only in node***
 */

if (loopback.isServer) {
  fs
    .readdirSync(path.join(__dirname, 'middleware'))
    .filter(function (file) {
      return file.match(/\.js$/);
    })
    .forEach(function (m) {
      loopback[m.replace(/\.js$/, '')] = require('./middleware/' + m);
    });
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

loopback.remoteMethod = function (fn, options) {
  fn.shared = true;
  if(typeof options === 'object') {
    Object.keys(options).forEach(function (key) {
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

loopback.template = function (file) {
  var templates = this._templates || (this._templates = {});
  var str = templates[file] || (templates[file] = fs.readFileSync(file, 'utf8'));
  return ejs.compile(str);
};


/*!
 * Built in models / services
 */

loopback.Email = require('./models/email');
loopback.User = require('./models/user');
loopback.Application = require('./models/application');
loopback.AccessToken = require('./models/access-token');
loopback.Role = require('./models/role').Role;
loopback.RoleMapping = require('./models/role').RoleMapping;
loopback.ACL = require('./models/acl').ACL;
loopback.Scope = require('./models/acl').Scope;

/*!
 * Automatically attach these models to dataSources
 */

var dataSourceTypes = {
  DB: 'db',
  MAIL: 'mail'
};

loopback.Email.autoAttach = dataSourceTypes.MAIL;
loopback.DataModel.autoAttach = dataSourceTypes.DB;
loopback.User.autoAttach = dataSourceTypes.DB;
loopback.AccessToken.autoAttach = dataSourceTypes.DB;
loopback.Role.autoAttach = dataSourceTypes.DB;
loopback.RoleMapping.autoAttach = dataSourceTypes.DB;
loopback.ACL.autoAttach = dataSourceTypes.DB;
loopback.Scope.autoAttach = dataSourceTypes.DB;
loopback.Application.autoAttach = dataSourceTypes.DB;
