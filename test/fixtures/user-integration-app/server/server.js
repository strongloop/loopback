// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var loopback = require('../../../../index');
var boot = require('loopback-boot');
var app = module.exports = loopback({
  localRegistry: true,
  loadBuiltinModels: true,
});
var errorHandler = require('strong-error-handler');

app.enableAuth();
boot(app, __dirname);
app.use(loopback.token({model: app.models.AccessToken}));
var apiPath = '/api';
app.use(apiPath, loopback.rest());
app.use(loopback.urlNotFound());
app.use(errorHandler());
