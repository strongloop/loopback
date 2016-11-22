// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var boot = require('loopback-boot');
var loopback = require('../../../../../index');

var app = module.exports = loopback();
boot(app, __dirname);
app.use(loopback.rest());
