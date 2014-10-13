module.exports = function(loopback) {
  // NOTE(bajtos) we must use static require() due to browserify limitations

  loopback.Email = createModel(
    require('../common/models/email.json'),
    require('../common/models/email.js'));

  loopback.Application = createModel(
    require('../common/models/application.json'),
    require('../common/models/application.js'));

  loopback.AccessToken = createModel(
    require('../common/models/access-token.json'),
    require('../common/models/access-token.js'));

  loopback.Role = require('../common/models/role').Role;
  loopback.RoleMapping = require('../common/models/role').RoleMapping;
  loopback.ACL = require('../common/models/acl').ACL;

  loopback.Scope = createModel(
    require('../common/models/scope.json'),
    require('../common/models/scope.js'));

  loopback.User = createModel(
    require('../common/models/user.json'),
    require('../common/models/user.js'));

  loopback.Change = require('../common/models/change');
  loopback.Checkpoint = require('../common/models/checkpoint');

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

  function createModel(definitionJson, customizeFn) {
    var Model = loopback.createModel(definitionJson);
    customizeFn(Model);
    return Model;
  }
};
