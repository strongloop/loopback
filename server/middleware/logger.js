// Copyright IBM Corp. 2014,2015. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

var bunyan = require('bunyan');
var loopback = require('../../lib/loopback');
var util = require('util');
var path = require('path');

module.exports = loggerMiddleware;

function loggerMiddleware(options) {
  var logPath = options.path || path.resolve('logs', 'info.log');
  var defaultLogLevel = process.env.LOG_LEVEL || 'info';
  var defaultOptions = {
    name: 'Loopback',
    // decides what to log
    log: {
      request: true,
    },
    streams: [
      {
        level: defaultLogLevel,
        stream: process.stdout,
      },
      {
        level: defaultLogLevel,
        type: 'file',
        path: logPath,
      },
    ],
  };
  var options = util._extend(defaultOptions, options);
  var logger = bunyan.createLogger(options);


  return function(req, res, next) {
    var app = req.app;

    // use singleton instance of logger?
    if (!app.get('logger')) {
      app.set('logger', logger);
    }

    if (options.log.request) {
      bindMethod(req, res, logRequest);
    }

    next();
  };

  function bindMethod(req, res, method) {
    res.on('finish', function() { method(req, res); });
  }

  function logRequest(req, res) {
    var remoteMethod = req.remotingContext.methodString;
    var data = {
      action: options.log.request.action || 'request',
      verb: req.method,
      path: req.url,
      statusCode: res.statusCode,
      remoteMethod: remoteMethod,
    };
    //log data
    if (res.statusCode >= 200 && res.statusCode < 300)
      logger.info(data);
    else if (res.statusCode < 400)
      logger.warn(data);
    else
      logger.error(data);
  }
};
