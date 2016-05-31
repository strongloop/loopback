// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

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
