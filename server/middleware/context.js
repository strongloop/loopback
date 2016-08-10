// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

var deprecated = require('depd')('loopback');
var g = require('strong-globalize')();
var perRequestContext = require('loopback-context').perRequest;

module.exports = function() {
  deprecated(g.f('%s middleware is deprecated. See %s for more details.',
    'loopback#context',
    'https://docs.strongloop.com/display/APIC/Using%20current%20context'));
  return perRequestContext.apply(this, arguments);
};
