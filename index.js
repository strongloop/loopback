/**
 * asteroid ~ public api
 */
 
var asteroid = module.exports = require('./lib/asteroid');

/**
 * Connectors
 */

asteroid.Connector = require('./lib/connectors/base-connector');
asteroid.Memory = require('./lib/connectors/memory');