var loopback = require('../');
var MyEmail;
var assert = require('assert');

describe('Email and SMTP', function () {
  beforeEach(function() {
    MyEmail = loopback.Email.extend('my-email');
    loopback.autoAttach();
  });
  
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
