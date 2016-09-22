// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

var g = require('./globalize');
var juggler = require('loopback-datasource-juggler');
var remoting = require('strong-remoting');

module.exports = function(loopback) {
  juggler.getCurrentContext =
  remoting.getCurrentContext =
  loopback.getCurrentContext = function() {
    throw new Error(g.f(
      '%s was removed in version 3.0. See %s for more details.',
      'loopback.getCurrentContext()',
      'https://docs.strongloop.com/display/APIC/Using%20current%20context'));
  };

  loopback.runInContext = function(fn) {
    throw new Error(g.f(
      '%s was removed in version 3.0. See %s for more details.',
      'loopback.runInContext()',
      'https://docs.strongloop.com/display/APIC/Using%20current%20context'));
  };

  loopback.createContext = function(scopeName) {
    throw new Error(g.f(
      '%s was removed in version 3.0. See %s for more details.',
      'loopback.createContext()',
      'https://docs.strongloop.com/display/APIC/Using%20current%20context'));
  };
};
