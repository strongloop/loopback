// Copyright IBM Corp. 2014,2019. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

module.exports = function(grunt) {
  // Do not report warnings from unit-tests exercising deprecated paths
  process.env.NO_DEPRECATION = 'loopback';

  grunt.loadNpmTasks('grunt-mocha-test');

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
    // Task configuration.
    uglify: {
      options: {
        banner: '<%= banner %>',
      },
      dist: {
        files: {
          'dist/loopback.min.js': ['dist/loopback.js'],
        },
      },
    },
    eslint: {
      gruntfile: {
        src: 'Gruntfile.js',
      },
      lib: {
        src: ['lib/**/*.js'],
      },
      common: {
        src: ['common/**/*.js'],
      },
      server: {
        src: ['server/**/*.js'],
      },
      test: {
        src: ['test/**/*.js'],
      },
    },
    watch: {
      gruntfile: {
        files: '<%= eslint.gruntfile.src %>',
        tasks: ['eslint:gruntfile'],
      },
      browser: {
        files: ['<%= eslint.browser.src %>'],
        tasks: ['eslint:browser'],
      },
      common: {
        files: ['<%= eslint.common.src %>'],
        tasks: ['eslint:common'],
      },
      lib: {
        files: ['<%= eslint.lib.src %>'],
        tasks: ['eslint:lib'],
      },
      server: {
        files: ['<%= eslint.server.src %>'],
        tasks: ['eslint:server'],
      },
      test: {
        files: ['<%= eslint.test.src %>'],
        tasks: ['eslint:test'],
      },
    },
    browserify: {
      dist: {
        files: {
          'dist/loopback.js': ['index.js'],
        },
        options: {
          ignore: ['nodemailer', 'passport', 'bcrypt'],
          standalone: 'loopback',
        },
      },
    },
    mochaTest: {
      'unit': {
        src: 'test/*.js',
        options: {
          reporter: 'dot',
          require: require.resolve('./test/helpers/use-english.js'),
        },
      },
      'unit-xml': {
        src: 'test/*.js',
        options: {
          reporter: 'xunit',
          captureFile: 'xunit.xml',
        },
      },
    },
    karma: {
      'unit-once': {
        configFile: 'test/karma.conf.js',
        browsers: ['ChromeDocker'],
        singleRun: true,
        reporters: ['dots', 'junit'],

        // increase the timeout for slow build slaves (e.g. Travis-ci)
        browserNoActivityTimeout: 30000,

        // CI friendly test output
        junitReporter: {
          outputFile: 'karma-xunit.xml',
        },

        browserify: {
          // Disable sourcemaps to prevent
          // Fatal error: Maximum call stack size exceeded
          debug: false,
          // Disable watcher, grunt will exit after the first run
          watch: false,
        },
      },
      unit: {
        configFile: 'test/karma.conf.js',
      },
      e2e: {
        options: {
          // base path, that will be used to resolve files and exclude
          basePath: '',

          // frameworks to use
          frameworks: ['mocha', 'browserify'],

          // list of files / patterns to load in the browser
          files: [
            'test/e2e/remote-connector.e2e.js',
            'test/e2e/replication.e2e.js',
          ],

          // list of files to exclude
          exclude: [

          ],

          // test results reporter to use
          // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
          reporters: ['dots'],

          // web server port
          port: 9876,

          // cli runner port
          runnerPort: 9100,

          // enable / disable colors in the output (reporters and logs)
          colors: true,

          // level of logging
          // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
          logLevel: 'warn',

          // enable / disable watching file and executing tests whenever any file changes
          autoWatch: true,

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

          // If browser does not capture in given timeout [ms], kill it
          captureTimeout: 60000,

          // Continuous Integration mode
          // if true, it capture browsers, run tests and exit
          singleRun: false,

          // Browserify config (all optional)
          browserify: {
            // extensions: ['.coffee'],
            ignore: [
              'nodemailer',
              'passport',
              'passport-local',
              'superagent',
              'supertest',
              'bcrypt',
            ],
            // transform: ['coffeeify'],
            // debug: true,
            // noParse: ['jquery'],
            watch: true,
          },

          // Add browserify to preprocessors
          preprocessors: {'test/e2e/*': ['browserify']},
        },
      },
    },

  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-karma');

  grunt.registerTask('e2e-server', function() {
    const done = this.async();
    const app = require('./test/fixtures/e2e/app');
    app.listen(0, function() {
      process.env.PORT = this.address().port;
      done();
    });
  });

  grunt.registerTask('skip-karma', function() {
    console.log(`*** SKIPPING PHANTOM-JS BASED TESTS ON ${process.platform}` +
      ` ${process.arch} ***`);
  });

  grunt.registerTask('e2e', ['e2e-server', 'karma:e2e']);

  // Default task.
  grunt.registerTask('default', ['browserify']);

  grunt.registerTask('test', [
    'eslint',
    process.env.JENKINS_HOME ? 'mochaTest:unit-xml' : 'mochaTest:unit',
    process.env.JENKINS_HOME && (/^win/.test(process.platform) ||
      /^s390x/.test(process.arch) || /^ppc64/.test(process.arch)) ?
      'skip-karma' : 'karma:unit-once',
  ]);

  // alias for sl-ci-run and `npm test`
  grunt.registerTask('mocha-and-karma', ['test']);
};
