// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var loopback = require('../../../..');
var boot = require('loopback-boot');
var app = module.exports = loopback({
  localRegistry: true,
  loadBuiltinModels: true,
});
var errorHandler = require('strong-error-handler');

boot(app, __dirname);

var apiPath = '/api';
app.use(loopback.token({model: app.models.accessToken}));
app.use(apiPath, loopback.rest());

app.use(loopback.urlNotFound());
app.use(errorHandler());
app.enableAuth();
