// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';
var path = require('path');
var SG = require('strong-globalize');

if (process.env.NODE_ENV === 'test') {
  module.exports = SG({language: 'en'});
} else {
  module.exports = SG();
}

SG.SetRootDir(path.join(__dirname, '..'), {autonomousMsgLoading: 'all'});
