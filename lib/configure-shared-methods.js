// Copyright IBM Corp. 2017,2019. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

const util = require('util');
const extend = require('util')._extend;
const g = require('./globalize');

module.exports = function(modelCtor, remotingConfig, modelConfig) {
  const settings = {};

  // apply config.json settings
  const configHasSharedMethodsSettings = remotingConfig &&
      remotingConfig.sharedMethods &&
      typeof remotingConfig.sharedMethods === 'object';
  if (configHasSharedMethodsSettings)
    util._extend(settings, remotingConfig.sharedMethods);

  // apply model-config.json settings
  const options = modelConfig.options;
  const modelConfigHasSharedMethodsSettings = options &&
      options.remoting &&
      options.remoting.sharedMethods &&
      typeof options.remoting.sharedMethods === 'object';
  if (modelConfigHasSharedMethodsSettings)
    util._extend(settings, options.remoting.sharedMethods);

  // validate setting values
  Object.keys(settings).forEach(function(setting) {
    const settingValue = settings[setting];
    const settingValueType = typeof settingValue;
    if (settingValueType !== 'boolean')
      throw new TypeError(g.f('Expected boolean, got %s', settingValueType));
  });

  // set sharedMethod.shared using the merged settings
  const sharedMethods = modelCtor.sharedClass.methods({includeDisabled: true});

  // re-map glob style values to regular expressions
  const tests = Object
    .keys(settings)
    .filter(function(setting) {
      return settings.hasOwnProperty(setting) && setting.indexOf('*') >= 0;
    })
    .map(function(setting) {
      // Turn * into an testable regexp string
      const glob = escapeRegExp(setting).replace(/\*/g, '(.)*');
      return {regex: new RegExp(glob), setting: settings[setting]};
    }) || [];
  sharedMethods.forEach(function(sharedMethod) {
    // use the specific setting if it exists
    const methodName = sharedMethod.isStatic ? sharedMethod.name : 'prototype.' + sharedMethod.name;
    const hasSpecificSetting = settings.hasOwnProperty(methodName);
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
