// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

var g = require('../../lib/globalize');

module.exports = function() {
  throw new Error(g.f(
    '%s middleware was removed in version 3.0. See %s for more details.',
    'loopback#context',
    'https://docs.strongloop.com/display/APIC/Using%20current%20context'));
};
