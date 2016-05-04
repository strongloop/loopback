// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

var loopback = require('../../lib/loopback');

module.exports = context;

var name = 'loopback';

/**
 * Context middleware.
 * ```js
 * var app = loopback();
 * app.use(loopback.context(options);
 * app.use(loopback.rest());
 * app.listen();
 * ```
 * @options {Object} [options] Options for context
 * @property {String} name Context scope name.
 * @property {Boolean} enableHttpContext Whether HTTP context is enabled.  Default is false.
 * @header loopback.context([options])
 */

function context(options) {
  options = options || {};
  var scope = options.name || name;
  var enableHttpContext = options.enableHttpContext || false;
  var ns = loopback.createContext(scope);

  // Return the middleware
  return function contextHandler(req, res, next) {
    if (req.loopbackContext) {
      return next();
    }

    loopback.runInContext(function processRequestInContext(ns, domain) {
      req.loopbackContext = ns;

      // Bind req/res event emitters to the given namespace
      ns.bindEmitter(req);
      ns.bindEmitter(res);

      // Add req/res event emitters to the current domain
      domain.add(req);
      domain.add(res);

      // Run the code in the context of the namespace
      if (enableHttpContext) {
        // Set up the transport context
        ns.set('http', {req: req, res: res});
      }
      next();
    });
  };
}
