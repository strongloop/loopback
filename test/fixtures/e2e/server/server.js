// Copyright IBM Corp. 2015,2019. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
const loopback = require('../../../../index');
const app = module.exports = loopback({localRegistry: true});
const models = require('./models');
const TestModel = models.TestModel;

const apiPath = '/api';
app.use(apiPath, loopback.rest());

TestModel.attachTo(loopback.memory());
app.model(TestModel);
app.model(TestModel.getChangeModel());

// app.use(loopback.static(path.join(__dirname, 'public')));
app.use(loopback.urlNotFound());
app.use(loopback.errorHandler());
