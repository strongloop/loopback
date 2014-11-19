var path = require('path');

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
  'errorHandler': 'errorhandler',
  'session': 'express-session',
  'methodOverride': 'method-override',
  'logger': 'morgan',
  'responseTime': 'response-time',
  'favicon': 'serve-favicon',
  'directory': 'serve-index',
  // 'static': 'serve-static',
  'vhost': 'vhost'
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
