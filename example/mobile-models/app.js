// Copyright IBM Corp. 2013,2019. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
const g = require('../../lib/globalize');
const models = require('../../lib/models');
const loopback = require('../../');
const app = loopback();

app.use(loopback.rest());

const dataSource = loopback.createDataSource('db', {connector: loopback.Memory});

const Application = models.Application(dataSource);

app.model(Application);

const data = {
  pushSettings: [{
    'platform': 'apns',
    'apns': {
      'pushOptions': {
        'gateway': 'gateway.sandbox.push.apple.com',
        'cert': 'credentials/apns_cert_dev.pem',
        'key': 'credentials/apns_key_dev.pem',
      },

      'feedbackOptions': {
        'gateway': 'feedback.sandbox.push.apple.com',
        'cert': 'credentials/apns_cert_dev.pem',
        'key': 'credentials/apns_key_dev.pem',
        'batchFeedback': true,
        'interval': 300,
      },
    },
  }],
};

Application.create(data, function(err, data) {
  g.log('Created: %s', data.toObject());
});

Application.register('rfeng', 'MyApp', {description: g.f('My first mobile application')},
  function(err, result) {
    console.log(result.toObject());

    result.resetKeys(function(err, result) {
      console.log(result.toObject());
    });
  });
