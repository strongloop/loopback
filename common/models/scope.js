// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

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
  Scope.resolveRelatedModels = function() {
    if (!this.aclModel) {
      var reg = this.registry;
      this.aclModel = reg.getModelByType(loopback.ACL);
    }
  };

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
    this.resolveRelatedModels();
    var aclModel = this.aclModel;
    assert(aclModel,
      'ACL model must be defined before Scope.checkPermission is called');

    this.findOne({where: {name: scope}}, function(err, scope) {
      if (err) {
        if (callback) callback(err);
      } else {
        aclModel.checkPermission(
          aclModel.SCOPE, scope.id, model, property, accessType, callback);
      }
    });
  };
};
