'use strict';

var env = process.env;

// delete any user-provided language settings
delete env.LC_ALL;
delete env.LC_MESSAGES;
delete env.LANG;
delete env.LANGUAGE;
delete env.STRONGLOOP_GLOBALIZE_APP_LANGUAGE;
