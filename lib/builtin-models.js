module.exports = function(registry) {
  // NOTE(bajtos) we must use static require() due to browserify limitations

  registry.Email = createModel(
    require('../common/models/email.json'),
    require('../common/models/email.js'));

  registry.Application = createModel(
    require('../common/models/application.json'),
    require('../common/models/application.js'));

  registry.AccessToken = createModel(
    require('../common/models/access-token.json'),
    require('../common/models/access-token.js'));

  registry.RoleMapping = createModel(
    require('../common/models/role-mapping.json'),
    require('../common/models/role-mapping.js'));

  registry.Role = createModel(
    require('../common/models/role.json'),
    require('../common/models/role.js'));

  registry.ACL = createModel(
    require('../common/models/acl.json'),
    require('../common/models/acl.js'));

  registry.Scope = createModel(
    require('../common/models/scope.json'),
    require('../common/models/scope.js'));

  registry.User = createModel(
    require('../common/models/user.json'),
    require('../common/models/user.js'));

  registry.Change = createModel(
    require('../common/models/change.json'),
    require('../common/models/change.js'));

  registry.Checkpoint = createModel(
    require('../common/models/checkpoint.json'),
    require('../common/models/checkpoint.js'));

  /*!
   * Automatically attach these models to dataSources
   */

  var dataSourceTypes = {
    DB: 'db',
    MAIL: 'mail'
  };

  registry.Email.autoAttach = dataSourceTypes.MAIL;
  registry.getModel('PersistedModel').autoAttach = dataSourceTypes.DB;
  registry.User.autoAttach = dataSourceTypes.DB;
  registry.AccessToken.autoAttach = dataSourceTypes.DB;
  registry.Role.autoAttach = dataSourceTypes.DB;
  registry.RoleMapping.autoAttach = dataSourceTypes.DB;
  registry.ACL.autoAttach = dataSourceTypes.DB;
  registry.Scope.autoAttach = dataSourceTypes.DB;
  registry.Application.autoAttach = dataSourceTypes.DB;

  function createModel(definitionJson, customizeFn) {
    var Model = registry.createModel(definitionJson);
    customizeFn(Model);
    return Model;
  }
};
