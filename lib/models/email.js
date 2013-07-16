/**
 * Module Dependencies.
 */

var Model = require('../loopback').Model
  , loopback = require('../loopback')
  , mailer = require("nodemailer"); 

/**
 * Default Email properties.
 */

var properties = {
  to: {type: String, required: true},
  from: {type: String, required: true},
  subject: {type: String, required: true},
  text: {type: String},
  html: {type: String}
};

/**
 * Extends from the built in `loopback.Model` type.
 */

var Email = module.exports = Model.extend('email', properties);

/*!
 * Setup the Email class after extension.
 */

Email.setup = function (settings) {
  settings = settings || this.settings;
  var transports = settings.transports || [];
  
  transports.forEach(this.setupTransport.bind(this));
}

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

Email.setupTransport = function (setting) {
  var Email = this;
  Email.transports = Email.transports || [];
  Email.transportsIndex = Email.transportsIndex || {};
  var transport = mailer.createTransport(setting.type, setting);
  Email.transportsIndex[setting.type] = transport;
  Email.transports.push(transport);
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

Email.send = function (options, fn) {
  var transport = this.transportsIndex[options.transport || 'SMTP'] || this.transports[0];
  assert(transport, 'You must supply an Email.settings.transports array containing at least one transport');
  
  transport.sendMail(options, fn);
}

/**
 * Access the node mailer object.
 *
 *     Email.mailer
 *     // or
 *     var email = new Email({to: 'foo@bar.com', from: 'bar@bat.com'}); 
 *     email.mailer
 */

Email.mailer =
Email.prototype.mailer = mailer;

/**
 * Send an email instance using `Email.send()`.
 */

Email.prototype.send = function (fn) {
  this.constructor.send(this, fn);
}