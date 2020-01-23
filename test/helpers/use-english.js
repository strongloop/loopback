// Copyright IBM Corp. 2017,2019. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

const env = process.env;

// delete any user-provided language settings
delete env.LC_ALL;
delete env.LC_MESSAGES;
delete env.LANG;
delete env.LANGUAGE;
delete env.STRONGLOOP_GLOBALIZE_APP_LANGUAGE;
