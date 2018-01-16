// Copyright IBM Corp. 2017,2018. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

const Promise = require('bluebird');

function waitForEvent(emitter, event) {
  return new Promise((resolve, reject) => {
    emitter.on(event, resolve);
  });
}

module.exports = waitForEvent;

