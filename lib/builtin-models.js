// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

var fs = require('fs');
var merge = require('util')._extend;

module.exports = function(registry, pathToRedefinedSystemModels) {
  // NOTE(bajtos) we must use static () due to browserify limitations

  registry.Email = createModel(
      ('../common/models/email.json'),
      ('../common/models/email.js'));

  registry.Application = createModel(
      ('../common/models/application.json'),
      ('../common/models/application.js'));

  registry.AccessToken = createModel(
      ('../common/models/access-token.json'),
      ('../common/models/access-token.js'));

  registry.User = createModel(
      ('../common/models/user.json'),
      ('../common/models/user.js'));

  registry.RoleMapping = createModel(
      ('../common/models/role-mapping.json'),
      ('../common/models/role-mapping.js'));

  registry.Role = createModel(
      ('../common/models/role.json'),
      ('../common/models/role.js'));

  registry.ACL = createModel(
      ('../common/models/acl.json'),
      ('../common/models/acl.js'));

  registry.Scope = createModel(
      ('../common/models/scope.json'),
      ('../common/models/scope.js'));

  registry.Change = createModel(
      ('../common/models/change.json'),
      ('../common/models/change.js'));

  registry.Checkpoint = createModel(
      ('../common/models/checkpoint.json'),
      ('../common/models/checkpoint.js'));

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


  function createModel(definitionJsonFile, customizeFn) {
    var filename = definitionJsonFile.split('/').pop();
    var modelname = filename.split('.')[0];

    var definitionJson = require(definitionJsonFile);

    if(pathToRedefinedSystemModels && fs.existsSync(pathToRedefinedSystemModels + '/' + modelname + '.json')){
      merge(definitionJson, require(pathToRedefinedSystemModels + '/' + modelname + '.json'));
    }

    var Model = registry.createModel(definitionJson);

    require(customizeFn)(Model);

    if(pathToRedefinedSystemModels && fs.existsSync(pathToRedefinedSystemModels + '/' + modelname + '.js')){
      require(pathToRedefinedSystemModels + '/' + modelname)(Model);
    }

    return Model;
  }
};
