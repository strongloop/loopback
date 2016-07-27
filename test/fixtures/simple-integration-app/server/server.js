// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

var loopback = require('../../../../index');
var boot = require('loopback-boot');
var app = module.exports = loopback({ localRegistry: true });

boot(app, __dirname);
var apiPath = '/api';
app.use(apiPath, loopback.rest());
app.use(loopback.urlNotFound());
app.use(loopback.errorHandler());
