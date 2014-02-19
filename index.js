/**
 * loopback ~ public api
 */
 
var loopback = module.exports = require('./lib/loopback');
var datasourceJuggler = require('loopback-datasource-juggler');

/**
 * Connectors
 */

loopback.Connector = require('./lib/connectors/base-connector');
loopback.Memory = require('./lib/connectors/memory');
loopback.Mail = require('./lib/connectors/mail');
loopback.Remote = require('./lib/connectors/remote');

/**
 * Types
 */

loopback.GeoPoint = require('loopback-datasource-juggler/lib/geo').GeoPoint;
loopback.ValidationError = datasourceJuggler.ValidationError;
