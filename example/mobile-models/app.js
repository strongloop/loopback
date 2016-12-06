// Copyright IBM Corp. 2013,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var g = require('../../lib/globalize');
var models = require('../../lib/models');
var loopback = require('../../');
var app = loopback();

app.use(loopback.rest());

var dataSource = loopback.createDataSource('db', {connector: loopback.Memory});

var Application = models.Application(dataSource);

app.model(Application);

var data = {
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
