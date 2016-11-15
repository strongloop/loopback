// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var loopback = require('../../../../index');
var PersistedModel = loopback.PersistedModel;

exports.TestModel = PersistedModel.extend('TestModel', {}, {
  trackChanges: true,
});
