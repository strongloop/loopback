// Copyright IBM Corp. 2014. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var favicon = require('serve-favicon');
var path = require('path');

/**
 * Serve the LoopBack favicon.
 * @header loopback.favicon()
 */
module.exports = function(icon, options) {
  icon = icon || path.join(__dirname, '../../favicon.ico');
  return favicon(icon, options);
};
