// Copyright IBM Corp. 2017,2018. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

var util = require('util');
var extend = require('util')._extend;
var g = require('./globalize');

module.exports = function(modelCtor, remotingConfig, modelConfig) {
  var settings = {};

  // apply config.json settings
  var configHasSharedMethodsSettings = remotingConfig &&
      remotingConfig.sharedMethods &&
      typeof remotingConfig.sharedMethods === 'object';
  if (configHasSharedMethodsSettings)
    util._extend(settings, remotingConfig.sharedMethods);

  // apply model-config.json settings
  const options = modelConfig.options;
  var modelConfigHasSharedMethodsSettings = options &&
      options.remoting &&
      options.remoting.sharedMethods &&
      typeof options.remoting.sharedMethods === 'object';
  if (modelConfigHasSharedMethodsSettings)
    util._extend(settings, options.remoting.sharedMethods);

  // validate setting values
  Object.keys(settings).forEach(function(setting) {
    var settingValue = settings[setting];
    var settingValueType = typeof settingValue;
    if (settingValueType !== 'boolean')
      throw new TypeError(g.f('Expected boolean, got %s', settingValueType));
  });

  // set sharedMethod.shared using the merged settings
  var sharedMethods = modelCtor.sharedClass.methods({includeDisabled: true});

  // re-map glob style values to regular expressions
  var tests = Object
    .keys(settings)
    .filter(function(setting) {
      return settings.hasOwnProperty(setting) && setting.indexOf('*') >= 0;
    })
    .map(function(setting) {
      // Turn * into an testable regexp string
      var glob = escapeRegExp(setting).replace(/\*/g, '(.)*');
      return {regex: new RegExp(glob), setting: settings[setting]};
    }) || [];
  sharedMethods.forEach(function(sharedMethod) {
    // use the specific setting if it exists
    var methodName = sharedMethod.isStatic ? sharedMethod.name : 'prototype.' + sharedMethod.name;
    var hasSpecificSetting = settings.hasOwnProperty(methodName);
    if (hasSpecificSetting) {
      if (settings[methodName] === false) {
        sharedMethod.sharedClass.disableMethodByName(methodName);
      } else {
        sharedMethod.shared = true;
      }
    } else {
      tests.forEach(function(glob) {
        if (glob.regex.test(methodName)) {
          if (glob.setting === false) {
            sharedMethod.sharedClass.disableMethodByName(methodName);
          } else {
            sharedMethod.shared = true;
          }
        }
      });
    }
  });
};

// Sanitize all RegExp reserved characters except * for pattern gobbing
function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\+\?\.\\\^\$\|]/g, '\\$&');
}
