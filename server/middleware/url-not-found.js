// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

/*!
 * Export the middleware.
 * See discussion in Connect pull request #954 for more details
 * https://github.com/senchalabs/connect/pull/954.
 */
module.exports = urlNotFound;

/**
 * Convert any request not handled so far to a 404 error
 * to be handled by error-handling middleware.
 * @header loopback.urlNotFound()
 */
function urlNotFound() {
  return function raiseUrlNotFoundError(req, res, next) {
    var error = new Error('Cannot ' + req.method + ' ' + req.url);
    error.status = 404;
    next(error);
  };
}
