var assert = require('assert');
var loopback = require('../../lib/loopback');

/**
 * Resource owner grants/delegates permissions to client applications
 *
 * For a protected resource, does the client application have the authorization
 * from the resource owner (user or system)?
 *
 * Scope has many resource access entries
 *
 * @class Scope
 */

module.exports = function(Scope) {
  /**
   * Check if the given scope is allowed to access the model/property
   * @param {String} scope The scope name
   * @param {String} model The model name
   * @param {String} property The property/method/relation name
   * @param {String} accessType The access type
   * @callback {Function} callback
   * @param {String|Error} err The error object
   * @param {AccessRequest} result The access permission
   */
  Scope.checkPermission = function(scope, model, property, accessType, callback) {
    var ACL = loopback.ACL;
    assert(ACL,
      'ACL model must be defined before Scope.checkPermission is called');

    this.findOne({where: {name: scope}}, function(err, scope) {
      if (err) {
        if (callback) callback(err);
      } else {
        var aclModel = loopback.getModelByType(ACL);
        aclModel.checkPermission(ACL.SCOPE, scope.id, model, property, accessType, callback);
      }
    });
  };
};
