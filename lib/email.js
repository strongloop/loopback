/*
 * This file exports methods and objects for working with emails
 * and email templates
 *
 * It is an internal file that should not be used outside of loopback.
 * All exported entities can be accessed via the `loopback` object.
 * @private
 */

var debug = require('debug')('loopback:email');
var path = require('path');
var emailTemplates = require('email-templates');
var fs = require('fs');

// look in the developers directory before falling back to our own
var templatesDir = path.resolve(process.cwd(), 'templates');
fs.realpath(templatesDir, {}, function(err, resolvedPath) {
  if (err) {
    debug('Email templates directory not found', err.path);
    templatesDir = path.resolve(__dirname, '..', 'templates');
  } else {
    templatesDir = resolvedPath;
  }
  debug('Templates directory', templatesDir);
});

var email = exports;

/**
 * Lazy load a template helper
 *
 *     loopback.template('foo', {foo: 'bar'}, function (err, html, text) {
 *       Email.send({ to: 'clarkbw@example.com', html: html, text: text });
 *     });
 *
 * @param {String} view Name of the template directory, html.ejs is a required file within named directory.
 * @options {Object} options passed to the template for rendering
 * @property {Boolean} cache True instructs the rendering engine to cache the template, use in production
 * @param {Function} next Called after the template has been rendered.
 */

var _template = null;

email.template = function(view, options, next) {
  if (_template) {
    _template(view, options, next);
  } else {
    emailTemplates(templatesDir, function(err, template) {
      if (err || !template) { console.error(err); }
      _template = template;
      return email.template(view, options, next);
    });
  }
};
