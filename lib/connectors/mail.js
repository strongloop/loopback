/**
 * Dependencies.
 */

var mailer = require('nodemailer')
  , assert = require('assert');

/**
 * Export the MailConnector class.
 */

module.exports = MailConnector;

/**
 * Create an instance of the connector with the given `settings`.
 */

function MailConnector(settings) {
  assert(typeof settings === 'object', 'cannot initiaze MailConnector without a settings object');
  var transports = settings.transports || [];
  
  transports.forEach(this.setupTransport.bind(this));
}

MailConnector.initialize = function(dataSource, callback) {
  dataSource.connector = new MailConnector(dataSource.settings);
  callback();
}

MailConnector.prototype.DataAccessObject = Mailer;


/**
 * Add a transport to the available transports. See https://github.com/andris9/Nodemailer#setting-up-a-transport-method.
 *
 * Example:
 *
 *   Email.setupTransport({
 *       type: 'SMTP',
 *       host: "smtp.gmail.com", // hostname
 *       secureConnection: true, // use SSL
 *       port: 465, // port for secure SMTP
 *       auth: {
 *           user: "gmail.user@gmail.com",
 *           pass: "userpass"
 *       }
 *   });
 *
 */

MailConnector.prototype.setupTransport = function(setting) {
  var connector = this;
  connector.transports = connector.transports || [];
  connector.transportsIndex = connector.transportsIndex || {};
  var transport = mailer.createTransport(setting.type, setting);
  connector.transportsIndex[setting.type] = transport;
  connector.transports.push(transport);
}

function Mailer() {

}

/**
 * Send an email with the given `options`.
 *
 * Example Options:
 *
 * {
 *   from: "Fred Foo ✔ <foo@blurdybloop.com>", // sender address
 *   to: "bar@blurdybloop.com, baz@blurdybloop.com", // list of receivers
 *   subject: "Hello ✔", // Subject line
 *   text: "Hello world ✔", // plaintext body
 *   html: "<b>Hello world ✔</b>" // html body
 * }
 *
 * See https://github.com/andris9/Nodemailer for other supported options.
 *
 * @param {Object} options
 * @param {Function} callback Called after the e-mail is sent or the sending failed
 */

Mailer.send = function (options, fn) {
  var dataSource = this.dataSource;
  var settings = dataSource && dataSource.settings;
  var connector = dataSource.connector;
  var transportsIndex = connector.transportsIndex;
  var transport = transportsIndex[options.transport || 'SMTP'] || connector.transports[0];
  assert(transport, 'You must supply an Email.settings.transports array containing at least one transport');
  
  if(settings && settings.debug) {
    console.log('Sending Mail:');
    if(options.transport) {
      console.log('\t TRANSPORT:', options.transport);
    }
    console.log('\t TO:', options.to);
    console.log('\t FROM:', options.from);
    console.log('\t SUBJECT:', options.subject);
    console.log('\t TEXT:', options.text);
    console.log('\t HTML:', options.html);
  }

  transport.sendMail(options, fn);
}

/**
 * Send an email instance using `modelInstance.send()`.
 */

Mailer.prototype.send = function (fn) {
  this.constructor.send(this, fn);
}

/**
 * Access the node mailer object.
 */

MailConnector.mailer =
MailConnector.prototype.mailer =
Mailer.mailer =
Mailer.prototype.mailer = mailer;
