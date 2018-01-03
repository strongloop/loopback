// Copyright IBM Corp. 2014,2018. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var loopback = require('../../lib/loopback');
var utils = require('../../lib/utils');

/**
 * The `RoleMapping` model extends from the built in `loopback.Model` type.
 *
 * @property {String} id Generated ID.
 * @property {String} name Name of the role.
 * @property {String} Description Text description.
 *
 * @class RoleMapping
 * @inherits {PersistedModel}
 */

module.exports = function(RoleMapping) {
  // Principal types
  RoleMapping.USER = 'USER';
  RoleMapping.APP = RoleMapping.APPLICATION = 'APP';
  RoleMapping.ROLE = 'ROLE';

  RoleMapping.resolveRelatedModels = function() {
    if (!this.userModel) {
      var reg = this.registry;
      this.roleModel = reg.getModelByType('Role');
      this.userModel = reg.getModelByType('User');
      this.applicationModel = reg.getModelByType('Application');
    }
  };

  /**
   * Get the application principal
   * @callback {Function} callback
   * @param {Error} err
   * @param {Application} application
   */
  RoleMapping.prototype.application = function(callback) {
    callback = callback || utils.createPromiseCallback();
    this.constructor.resolveRelatedModels();

    if (this.principalType === RoleMapping.APPLICATION) {
      var applicationModel = this.constructor.applicationModel;
      applicationModel.findById(this.principalId, callback);
    } else {
      process.nextTick(function() {
        callback(null, null);
      });
    }
    return callback.promise;
  };

  /**
   * Get the user principal
   * @callback {Function} callback
   * @param {Error} err
   * @param {User} user
   */
  RoleMapping.prototype.user = function(callback) {
    callback = callback || utils.createPromiseCallback();
    this.constructor.resolveRelatedModels();
    var userModel;

    if (this.principalType === RoleMapping.USER) {
      userModel = this.constructor.userModel;
      userModel.findById(this.principalId, callback);
      return callback.promise;
    }

    // try resolving a user model that matches principalType
    userModel = this.constructor.registry.findModel(this.principalType);
    if (userModel) {
      userModel.findById(this.principalId, callback);
    } else {
      process.nextTick(function() {
        callback(null, null);
      });
    }
    return callback.promise;
  };

  /**
   * Get the child role principal
   * @callback {Function} callback
   * @param {Error} err
   * @param {User} childUser
   */
  RoleMapping.prototype.childRole = function(callback) {
    callback = callback || utils.createPromiseCallback();
    this.constructor.resolveRelatedModels();

    if (this.principalType === RoleMapping.ROLE) {
      var roleModel = this.constructor.roleModel;
      roleModel.findById(this.principalId, callback);
    } else {
      process.nextTick(function() {
        callback(null, null);
      });
    }
    return callback.promise;
  };
};
