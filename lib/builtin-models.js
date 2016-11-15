// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
module.exports = function(registry) {
  // NOTE(bajtos) we must use static require() due to browserify limitations

  registry.KeyValueModel = createModel(
    require('../common/models/key-value-model.json'),
    require('../common/models/key-value-model.js'));

  registry.Email = createModel(
    require('../common/models/email.json'),
    require('../common/models/email.js'));

  registry.Application = createModel(
    require('../common/models/application.json'),
    require('../common/models/application.js'));

  registry.AccessToken = createModel(
    require('../common/models/access-token.json'),
    require('../common/models/access-token.js'));

  registry.User = createModel(
    require('../common/models/user.json'),
    require('../common/models/user.js'));

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

  registry.Change = createModel(
    require('../common/models/change.json'),
    require('../common/models/change.js'));

  registry.Checkpoint = createModel(
    require('../common/models/checkpoint.json'),
    require('../common/models/checkpoint.js'));

  function createModel(definitionJson, customizeFn) {
    var Model = registry.createModel(definitionJson);
    customizeFn(Model);
    return Model;
  }
};
