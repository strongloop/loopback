// Copyright IBM Corp. 2014,2019. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

// Karma configuration
// http://karma-runner.github.io/0.12/config/configuration-file.html

'use strict';
module.exports = function(config) {
  config.set({
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
      'karma-phantomjs-launcher',
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
      transform: [
        ['babelify', {
          presets: [
            ['es2015', {
              // Disable transform-es2015-modules-commonjs which adds
              // "use strict" to all files, even those that don't work
              // in strict mode
              // (e.g. chai, loopback-datasource-juggler, etc.)
              modules: false,
            }],
          ],
          // By default, browserify does not transform node_modules
          // As a result, our dependencies like strong-remoting and juggler
          // are kept in original ES6 form that does not work in PhantomJS
          global: true,
          // Prevent SyntaxError in strong-task-emitter:
          //   strong-task-emitter/lib/task.js (83:4):
          //   arguments is a reserved word in strict mode
          ignore: /node_modules\/(strong-task-emitter)\//,
        }],
      ],
      debug: true,
      // noParse: ['jquery'],
      watch: true,
    },

    // Add browserify to preprocessors
    preprocessors: {'test/**/*.js': ['browserify']},
  });
};
