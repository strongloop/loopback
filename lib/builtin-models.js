module.exports = function(loopback) {
  loopback.Email = require('./models/email');
  loopback.User = require('./models/user');
  loopback.Application = require('./models/application');
  loopback.AccessToken = require('./models/access-token');
  loopback.Role = require('./models/role').Role;
  loopback.RoleMapping = require('./models/role').RoleMapping;
  loopback.ACL = require('./models/acl').ACL;
  loopback.Scope = require('./models/acl').Scope;
  loopback.Change = require('./models/change');

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
