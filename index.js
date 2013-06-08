/**
 * asteroid ~ public api
 */
 
var asteroid = module.exports = require('./lib/asteroid');

/**
 * Connector
 */

asteroid.Connector = require('./lib/connector');

/**
 * JugglingDB Connector
 */

asteroid.JdbConnector = require('./lib/jdb-connector');