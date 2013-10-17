/**
 * loopback ~ public api
 */
 
var loopback = module.exports = require('./lib/loopback');

/**
 * Connectors
 */

loopback.Connector = require('./lib/connectors/base-connector');
loopback.Memory = require('./lib/connectors/memory');
loopback.Mail = require('./lib/connectors/mail');

/**
 * Types
 */

loopback.GeoPoint = require('loopback-datasource-juggler/lib/geo').GeoPoint;
