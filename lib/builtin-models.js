module.exports = function(loopback) {
  loopback.Email = require('../common/models/email');
  loopback.User = require('../common/models/user');
  loopback.Application = require('../common/models/application');
  loopback.AccessToken = require('../common/models/access-token');
  loopback.Role = require('../common/models/role').Role;
  loopback.RoleMapping = require('../common/models/role').RoleMapping;
  loopback.ACL = require('../common/models/acl').ACL;
  loopback.Scope = require('../common/models/acl').Scope;
  loopback.Change = require('../common/models/change');

  /*!
   * Automatically attach these models to dataSources
   */

  var dataSourceTypes = {
    DB: 'db',
    MAIL: 'mail'
  };

  loopback.Email.autoAttach = dataSourceTypes.MAIL;
  loopback.PersistedModel.autoAttach = dataSourceTypes.DB;
  loopback.User.autoAttach = dataSourceTypes.DB;
  loopback.AccessToken.autoAttach = dataSourceTypes.DB;
  loopback.Role.autoAttach = dataSourceTypes.DB;
  loopback.RoleMapping.autoAttach = dataSourceTypes.DB;
  loopback.ACL.autoAttach = dataSourceTypes.DB;
  loopback.Scope.autoAttach = dataSourceTypes.DB;
  loopback.Application.autoAttach = dataSourceTypes.DB;
};
