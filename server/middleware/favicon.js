// Copyright IBM Corp. 2014,2019. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
const favicon = require('serve-favicon');
const path = require('path');

/**
 * Serve the LoopBack favicon.
 * @header loopback.favicon()
 */
module.exports = function(icon, options) {
  icon = icon || path.join(__dirname, '../../favicon.ico');
  return favicon(icon, options);
};
