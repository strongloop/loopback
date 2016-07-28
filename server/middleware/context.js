// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

var deprecated = require('depd')('loopback');
var perRequestContext = require('loopback-context').perRequest;

module.exports = function() {
  deprecated('loopback#context middleware is deprecated. See ' +
    'https://docs.strongloop.com/display/APIC/Using%20current%20context ' +
    'for more details.');
  return perRequestContext.apply(this, arguments);
};
