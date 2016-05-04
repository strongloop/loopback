// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

/**
 * Email model.  Extends LoopBack base [Model](#model-new-model).
 * @property {String} to Email addressee.  Required.
 * @property {String} from Email sender address.  Required.
 * @property {String} subject Email subject string.  Required.
 * @property {String} text Text body of email.
 * @property {String} html HTML body of email.
 *
 * @class Email
 * @inherits {Model}
 */

module.exports = function(Email) {

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

  Email.send = function() {
    throw new Error('You must connect the Email Model to a Mail connector');
  };

  /**
   * A shortcut for Email.send(this).
   */
  Email.prototype.send = function() {
    throw new Error('You must connect the Email Model to a Mail connector');
  };
};
