// Copyright IBM Corp. 2014,2019. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

const isDocker = require('is-docker');
const which = require('which');

// Karma configuration
// http://karma-runner.github.io/0.12/config/configuration-file.html

module.exports = function(config) {
  // see https://github.com/docker/for-linux/issues/496
  const disableChromeSandbox = isDocker() && !process.env.TRAVIS;
  if (disableChromeSandbox) {
    console.log('!! Disabling Chrome sandbox to support un-privileged Docker !!');
  }

  const hasChromium =
    which.sync('chromium-browser', {nothrow: true}) ||
    which.sync('chromium', {nothrow: true});

  config.set({
    customLaunchers: {
      ChromeDocker: {
        // cis-jenkins build server does not provide Chrome, only Chromium
        base: hasChromium ? 'ChromiumHeadless' : 'ChromeHeadless',
        // We must disable the Chrome sandbox when running Chrome inside Docker
        // (Chrome's sandbox needs more permissions than Docker allows by default)
        // See https://github.com/docker/for-linux/issues/496
        flags: disableChromeSandbox ? ['--no-sandbox'] : [],
      },
    },

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // base path, that will be used to resolve files and exclude
    basePath: '../',

    // testing framework to use (jasmine/mocha/qunit/...)
    frameworks: ['es6-shim', 'browserify', 'mocha'],

    // list of files / patterns to load in the browser
    files: [
      'test/loopback.test.js',
      'test/model.test.js',
      // [rfeng] Browserified common/models/application.js
      // (crypto.randomBytes()) is not compatible with phantomjs. Skip
      // the karma test for now.
      // 'test/model.application.test.js',
      'test/geo-point.test.js',
      'test/replication.test.js',
      'test/change.test.js',
      'test/checkpoint.test.js',
      'test/app.test.js',
    ],

    // list of files / patterns to exclude
    exclude: [
    ],

    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: ['dots'],

    // web server port
    port: 9876,

    // cli runner port
    runnerPort: 9100,

    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers: [
      'Chrome',
    ],

    // Which plugins to enable
    plugins: [
      'karma-browserify',
      'karma-es6-shim',
      'karma-mocha',
      'karma-chrome-launcher',
      'karma-junit-reporter',
    ],

    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 60000,

    // to avoid DISCONNECTED messages
    browserDisconnectTimeout: 10000, // default 2000
    browserDisconnectTolerance: 1, // default 0
    browserNoActivityTimeout: 60000, // default 10000

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false,

    colors: true,

    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: config.LOG_INFO,

    // Uncomment the following lines if you are using grunt's server to run the tests
    // proxies: {
    //   '/': 'http://localhost:9000/'
    // },
    // URL root prevent conflicts with the site root
    // urlRoot: '_karma_'

    // Browserify config (all optional)
    browserify: {
      // extensions: ['.coffee'],
      ignore: [
        'nodemailer',
        'passport',
        'passport-local',
        'superagent',
        'supertest',
      ],
      packageFilter: function(pkg, dir) {
        // async@3 (used e.g. by loopback-connector) is specifying custom
        // browserify config, in particular it wants to apply transformation
        // `babelify`. We don't have `babelify` installed because we are
        // testing using latest Chrome and thus don't need any transpilation.
        // Let's remove the browserify config from the package and force
        // browserify to use our config instead.
        if (pkg.name === 'async') {
          delete pkg.browserify;
        }
        return pkg;
      },
      debug: true,
      // noParse: ['jquery'],
      watch: true,
    },

    // Add browserify to preprocessors
    preprocessors: {'test/**/*.js': ['browserify']},
  });
};
