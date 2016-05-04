// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

var expressErrorHandler = require('errorhandler');
expressErrorHandler.title = 'Loopback';

module.exports = errorHandler;

function errorHandler(options) {
  if (!options || options.includeStack !== false) {
    return expressErrorHandler(options);
  } else {
    var baseHandler = expressErrorHandler(options);
    return function errorHandler(err, req, res, next) {
      delete err.stack;
      return baseHandler(err, req, res, next);
    };
  }
}
