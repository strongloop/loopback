// Copyright IBM Corp. 2013,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var loopback = require('../');
var MyEmail;
var assert = require('assert');
var MailConnector = require('../lib/connectors/mail');

describe('Email connector', function() {
  it('should set up SMTP', function() {
    var connector = new MailConnector({transports: [
      {type: 'smtp', service: 'gmail'},
    ]});
    assert(connector.transportForName('smtp'));
  });

  it('should set up DIRECT', function() {
    var connector = new MailConnector({transports: [
      {type: 'direct', name: 'localhost'},
    ]});
    assert(connector.transportForName('direct'));
  });

  it('should set up STUB', function() {
    var connector = new MailConnector({transports: [
      {type: 'stub', service: 'gmail'},
    ]});
    assert(connector.transportForName('stub'));
  });

  it('should set up a single transport for SMTP', function() {
    var connector = new MailConnector({transport:
      {type: 'smtp', service: 'gmail'},
    });

    assert(connector.transportForName('smtp'));
  });

  it('should set up a aliased transport for SMTP', function() {
    var connector = new MailConnector({transport:
      {type: 'smtp', service: 'ses-us-east-1', alias: 'ses-smtp'},
    });

    assert(connector.transportForName('ses-smtp'));
  });
});

describe('Email and SMTP', function() {
  beforeEach(function() {
    MyEmail = loopback.Email.extend('my-email');
    var ds = loopback.createDataSource('email', {
      connector: loopback.Mail,
      transports: [{type: 'STUB'}],
    });
    MyEmail.attachTo(ds);
  });

  it('should have a send method', function() {
    assert(typeof MyEmail.send === 'function');
    assert(typeof MyEmail.prototype.send === 'function');
  });

  describe('MyEmail', function() {
    it('MyEmail.send(options, callback)', function(done) {
      var options = {
        to: 'to@to.com',
        from: 'from@from.com',
        subject: 'subject',
        text: 'text',
        html: '<h1>html</h1>',
      };

      MyEmail.send(options, function(err, mail) {
        assert(!err);
        assert(mail.response);
        assert(mail.envelope);
        assert(mail.messageId);

        done(err);
      });
    });

    it('myEmail.send(callback)', function(done) {
      var message = new MyEmail({
        to: 'to@to.com',
        from: 'from@from.com',
        subject: 'subject',
        text: 'text',
        html: '<h1>html</h1>',
      });

      message.send(function(err, mail) {
        assert(mail.response);
        assert(mail.envelope);
        assert(mail.messageId);

        done(err);
      });
    });
  });
});
