var loopback = require('../');
var MailConnector = loopback.Mail;
var MyEmail = loopback.Email.extend('my-email');
var assert = require('assert');

describe('Email and SMTP', function () {
  var mail = loopback.createDataSource({
    connector: MailConnector,
    transports: [
      {type: 'STUB'}
    ]
  });

  MyEmail.attachTo(mail);

  it('should have a send method', function () {
    assert(typeof MyEmail.send === 'function');
    assert(typeof MyEmail.prototype.send === 'function');
  });

  describe('MyEmail', function () {
    it('MyEmail.send(options, callback)', function (done) {
      var options = {
        to: 'to@to.com',
        from: 'from@from.com',
        subject: 'subject',
        text: 'text',
        html: '<h1>html</h1>'
      };

      MyEmail.send(options, function(err, mail) {
        assert(mail.message);
        assert(mail.envelope);
        assert(mail.messageId);
        done(err);
      });
    });

    it('myEmail.send(callback)', function (done) {
      var message = new MyEmail({
        to: 'to@to.com',
        from: 'from@from.com',
        subject: 'subject',
        text: 'text',
        html: '<h1>html</h1>'
      });

      message.send(function (err, mail) {
        assert(mail.message);
        assert(mail.envelope);
        assert(mail.messageId);
        done(err);
      });
    });      
  }); 
});
