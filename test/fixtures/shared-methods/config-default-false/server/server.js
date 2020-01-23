// Copyright IBM Corp. 2015,2019. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
const boot = require('loopback-boot');
const loopback = require('../../../../../index');

const app = module.exports = loopback();
boot(app, __dirname);
app.use(loopback.rest());
