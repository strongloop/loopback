/*!
 * Module Dependencies.
 */

var Model = require('../loopback').Model
  , loopback = require('../loopback');

var properties = {
  to: {type: String, required: true},
  from: {type: String, required: true},
  subject: {type: String, required: true},
  text: {type: String},
  html: {type: String}
};

/**
 * The Email Model.
 * 
 * **Properties**
 * 
 * - `to` - String (required)
 * - `from` - String (required)
 * - `subject` - String (required)
 * - `text` - String
 * - `html` - String
 *
 * @class
 * @inherits {Model}
 */

var Email = module.exports = Model.extend('Email', properties);

/**
 * Send an email with the given `options`.
 *
 * Example Options:
 *
 * ```js
 * {
 *   from: "Fred Foo <foo@blurdybloop.com>", // sender address
 *   to: "bar@blurdybloop.com, baz@blurdybloop.com", // list of receivers
 *   subject: "Hello", // Subject line
 *   text: "Hello world", // plaintext body
 *   html: "<b>Hello world</b>" // html body
 * }
 * ```
 *
 * See https://github.com/andris9/Nodemailer for other supported options.
 *
 * @options {Object} options See below
 * @prop {String} from Senders's email address
 * @prop {String} to List of one or more recipient email addresses (comma-delimited)
 * @prop {String} subject Subject line
 * @prop {String} text Body text
 * @prop {String} html Body HTML (optional)
 * @param {Function} callback Called after the e-mail is sent or the sending failed
 */

Email.prototype.send = function() {
  throw new Error('You must connect the Email Model to a Mail connector');
}