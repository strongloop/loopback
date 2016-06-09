// Copyright IBM Corp. 2014,2015. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

var bunyan = require('bunyan');
var loopback = require('../../lib/loopback');
var util = require('util');

module.exports = logger;

function logger(options) {
  //console.log('typeof this mdidleware', this.get('restApiRoot'));
  console.log('log-middleware options: ', options);
  var defaultOptions = {
    name: 'Loopback',
    // decides what to log
    log: {
      request: true,
    },
    streams: [],
  };
  var options = util._extend(defaultOptions, options);
  var logger = bunyan.createLogger({name: 'app'});


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
    var data = {
      action: options.log.request.action || 'request',
      verb: req.method,
      path: req.url,
      statusCode: res.statusCode,
    };
    logger.info(data);
  }
};
