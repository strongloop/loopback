// Copyright IBM Corp. 2014. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var loopback = require('../../');

module.exports = it;

it.onServer = function itOnServer(name, fn) {
  if (loopback.isServer) {
    it(name, fn);
  } else {
    it.skip(name, fn);
  }
};

it.inBrowser = function itInBrowser(name, fn) {
  if (loopback.isBrowser) {
    it(name, fn);
  } else {
    it.skip(name, fn);
  }
};
