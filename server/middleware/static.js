// Copyright IBM Corp. 2014. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

/**
 * Serve static assets of a LoopBack application.
 *
 * @param {string} root The root directory from which the static assets are to
 * be served.
 * @param {object} options Refer to
 *   [express documentation](http://expressjs.com/4x/api.html#express.static)
 *   for the full list of available options.
 * @header loopback.static(root, [options])
 */
'use strict';
module.exports = require('express').static;
