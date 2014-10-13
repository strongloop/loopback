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

  loopback.RoleMapping = createModel(
    require('../common/models/role-mapping.json'),
    require('../common/models/role-mapping.js'));

  loopback.Role = createModel(
    require('../common/models/role.json'),
    require('../common/models/role.js'));

  loopback.ACL = createModel(
    require('../common/models/acl.json'),
    require('../common/models/acl.js'));

  loopback.Scope = createModel(
    require('../common/models/scope.json'),
    require('../common/models/scope.js'));

  loopback.User = createModel(
    require('../common/models/user.json'),
    require('../common/models/user.js'));

  loopback.Change = createModel(
    require('../common/models/change.json'),
    require('../common/models/change.js'));

  loopback.Checkpoint = createModel(
    require('../common/models/checkpoint.json'),
    require('../common/models/checkpoint.js'));

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
