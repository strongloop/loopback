// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

var juggler = require('loopback-datasource-juggler');
var remoting = require('strong-remoting');

module.exports = function(loopback) {
  juggler.getCurrentContext =
  remoting.getCurrentContext =
  loopback.getCurrentContext = function() {
    throw new Error(
      'loopback.getCurrentContext() was removed in version 3.0. See ' +
      'https://docs.strongloop.com/display/APIC/Using%20current%20context ' +
      'for more details.');
  };

  loopback.runInContext = function(fn) {
    throw new Error(
      'loopback.runInContext() was removed in version 3.0. See ' +
      'https://docs.strongloop.com/display/APIC/Using%20current%20context ' +
      'for more details.');
  };

  loopback.createContext = function(scopeName) {
    throw new Error(
      'loopback.createContext() was removed in version 3.0. See ' +
      'https://docs.strongloop.com/display/APIC/Using%20current%20context ' +
      'for more details.');
  };
};
