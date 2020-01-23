// Copyright IBM Corp. 2016,2019. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
const g = require('./globalize');
const juggler = require('loopback-datasource-juggler');
const remoting = require('strong-remoting');

module.exports = function(loopback) {
  juggler.getCurrentContext =
  remoting.getCurrentContext =
  loopback.getCurrentContext = function() {
    throw new Error(g.f(
      '%s was removed in version 3.0. See %s for more details.',
      'loopback.getCurrentContext()',
      'http://loopback.io/doc/en/lb2/Using-current-context.html',
    ));
  };

  loopback.runInContext = function(fn) {
    throw new Error(g.f(
      '%s was removed in version 3.0. See %s for more details.',
      'loopback.runInContext()',
      'http://loopback.io/doc/en/lb2/Using-current-context.html',
    ));
  };

  loopback.createContext = function(scopeName) {
    throw new Error(g.f(
      '%s was removed in version 3.0. See %s for more details.',
      'loopback.createContext()',
      'http://loopback.io/doc/en/lb2/Using-current-context.html',
    ));
  };
};
