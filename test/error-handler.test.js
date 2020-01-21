// Copyright IBM Corp. 2015,2019. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
const loopback = require('../');
let app;
const assert = require('assert');
const request = require('supertest');
const expect = require('./helpers/expect');

describe('loopback.errorHandler(options)', function() {
  it('should throw a descriptive error', function() {
    expect(function() { loopback.errorHandler(); })
      .to.throw(/no longer available.*strong-error-handler/);
  });
});
