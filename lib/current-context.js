// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

var juggler = require('loopback-datasource-juggler');
var remoting = require('strong-remoting');
var LoopBackContext = require('loopback-context');
var deprecated = require('depd')('loopback');
var g = require('strong-globalize')();

module.exports = function(loopback) {

  /**
   * Get the current context object. The context is preserved
   * across async calls, it behaves like a thread-local storage.
   *
   * @returns {ChainedContext} The context object or null.
   */
  loopback.getCurrentContext = function() {
    // NOTE(bajtos) LoopBackContext.getCurrentContext is overriden whenever
    // the context changes, therefore we cannot simply assign
    // LoopBackContext.getCurrentContext() to loopback.getCurrentContext()
    deprecated(g.f('%s is deprecated. See %s for more details.',
      'loopback.getCurrentContext()',
      'https://docs.strongloop.com/display/APIC/Using%20current%20context'));
    return LoopBackContext.getCurrentContext();
  };

  juggler.getCurrentContext =
  remoting.getCurrentContext = loopback.getCurrentContext;

  /**
   * Run the given function in such way that
   * `loopback.getCurrentContext` returns the
   * provided context object.
   *
   * **NOTE**
   *
   * The method is supported on the server only, it does not work
   * in the browser at the moment.
   *
   * @param {Function} fn The function to run, it will receive arguments
   * (currentContext, currentDomain).
   * @param {ChainedContext} context An optional context object.
   *   When no value is provided, then the default global context is used.
   */
  loopback.runInContext = function(fn, ctx) {
    deprecated(g.f('%s is deprecated. See %s for more details.',
      'loopback.runInContext()',
      'https://docs.strongloop.com/display/APIC/Using%20current%20context'));
    return LoopBackContext.runInContext(fn, ctx);
  };

  /**
   * Create a new LoopBackContext instance that can be used
   * for `loopback.runInContext`.
   *
   * **NOTES**
   *
   * At the moment, `loopback.getCurrentContext` supports
   * a single global context instance only. If you call `createContext()`
   * multiple times, `getCurrentContext` will return the last context
   * created.
   *
   * The method is supported on the server only, it does not work
   * in the browser at the moment.
   *
   * @param {String} scopeName An optional scope name.
   * @return {ChainedContext} The new context object.
   */
  loopback.createContext = function(scopeName) {
    deprecated(g.f('%s is deprecated. See %s for more details.',
      'loopback.createContext()',
      'https://docs.strongloop.com/display/APIC/Using%20current%20context'));
    return LoopBackContext.createContext(scopeName);
  };
};
