// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

var path = require('path');
var deprecated = require('depd')('loopback');

var middlewares = exports;

function safeRequire(m) {
  try {
    return require(m);
  } catch (err) {
    return undefined;
  }
}

function createMiddlewareNotInstalled(memberName, moduleName) {
  return function() {
    var msg = 'The middleware loopback.' + memberName + ' is not installed.\n' +
      'Run `npm install --save ' + moduleName + '` to fix the problem.';
    throw new Error(msg);
  };
}

var middlewareModules = {
  'compress': 'compression',
  'timeout': 'connect-timeout',
  'cookieParser': 'cookie-parser',
  'cookieSession': 'cookie-session',
  'csrf': 'csurf',
  'session': 'express-session',
  'methodOverride': 'method-override',
  'logger': 'morgan',
  'responseTime': 'response-time',
  'directory': 'serve-index',
  // 'static': 'serve-static',
  'vhost': 'vhost'
};

middlewares.bodyParser = safeRequire('body-parser');
middlewares.json = middlewares.bodyParser && middlewares.bodyParser.json;
middlewares.urlencoded = middlewares.bodyParser && middlewares.bodyParser.urlencoded;

['bodyParser', 'json', 'urlencoded'].forEach(function(name) {
  if (!middlewares[name]) return;
  middlewares[name] = deprecated.function(
    middlewares[name],
    deprecationMessage(name, 'body-parser'));
});

for (var m in middlewareModules) {
  var moduleName = middlewareModules[m];
  middlewares[m] = safeRequire(moduleName) || createMiddlewareNotInstalled(m, moduleName);
  deprecated.property(middlewares, m, deprecationMessage(m, moduleName));
}

function deprecationMessage(accessor, moduleName) {
  return 'loopback.' + accessor + ' is deprecated. ' +
    'Use `require(\'' + moduleName + '\');` instead.';
}
