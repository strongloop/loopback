// Copyright IBM Corp. 2014. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var loopback = require('../../');

module.exports = describe;

describe.onServer = function describeOnServer(name, fn) {
  if (loopback.isServer) {
    describe(name, fn);
  } else {
    describe.skip(name, fn);
  }
};

describe.inBrowser = function describeInBrowser(name, fn) {
  if (loopback.isBrowser) {
    describe(name, fn);
  } else {
    describe.skip(name, fn);
  }
};
