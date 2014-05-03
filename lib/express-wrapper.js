var express = require('express');
var expressVer = require('express/package.json').version;
var path = require('path');

express.version = expressVer;
var middlewares = express.middlewares = {};

function safeRequire(m) {
  try {
    return require(m);
  } catch (err) {
    return undefined;
  }
}

function createMiddlewareNotInstalled(memberName, moduleName) {
  return function() {
    throw new Error('The middleware loopback.' + memberName + ' is not installed.\n' +
      'Please run `npm install ' + moduleName + '` to fix the problem.');
  };
}

if (expressVer.indexOf('4.') === 0) {
  var middlewareModules = {
    "compress": "compression",
    "timeout": "connect-timeout",
    "cookieParser": "cookie-parser",
    "cookieSession": "cookie-session",
    "csrf": "csurf",
    "errorHandler": "errorhandler",
    "session": "express-session",
    "methodOverride": "method-override",
    "logger": "morgan",
    "responseTime": "response-time",
    "favicon": "serve-favicon",
    "directory": "serve-index",
    // "static": "serve-static",
    "vhost": "vhost"
  };

  middlewares.bodyParser = safeRequire('body-parser');
  middlewares.json = middlewares.bodyParser && middlewares.bodyParser.json;
  middlewares.urlencoded = middlewares.bodyParser && middlewares.bodyParser.urlencoded;

  for (var m in middlewareModules) {
    var moduleName = middlewareModules[m];
    middlewares[m] = safeRequire(moduleName) || createMiddlewareNotInstalled(m, moduleName);
  }

  // serve-favicon requires a path
  var favicon = middlewares.favicon;
  middlewares.favicon = function(icon, options) {
    icon = icon || path.join(__dirname, '../favicon.ico');
    return favicon(icon, options);
  };
}

module.exports = express;


