/*global module:false*/
module.exports = function(grunt) {

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
        banner: '<%= banner %>'
      },
      dist: {
        files: {
          'dist/loopback.min.js': ['dist/loopback.js']
        }
      }
    },
    jshint: {
      options: {
        jshintrc: true
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      lib: {
        src: ['lib/**/*.js']
      },
      common: {
        src: ['common/**/*.js']
      },
      server: {
        src: ['server/**/*.js']
      },
      test: {
        src: ['test/**/*.js']
      }
    },
    jscs: {
      gruntfile: 'Gruntfile.js',
      lib: ['lib/**/*.js'],
      common: ['common/**/*.js'],
      server: ['server/**/*.js'],
      test: ['test/**/*.js']
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      lib: {
        files: ['<%= jshint.lib.src %>'],
        tasks: ['jshint:lib']
      },
      test: {
        files: ['<%= jshint.test.src %>'],
        tasks: ['jshint:test']
      }
    },
    browserify: {
      dist: {
        files: {
          'dist/loopback.js': ['index.js'],
        },
        options: {
          ignore: ['nodemailer', 'passport', 'bcrypt'],
          standalone: 'loopback'
        }
      }
    },
    mochaTest: {
      'unit': {
        src: 'test/*.js',
        options: {
          reporter: 'dot',
        }
      },
      'unit-xml': {
        src: 'test/*.js',
        options: {
          reporter: 'xunit',
          captureFile: 'xunit.xml'
        }
      }
    },
    karma: {
      'unit-once': {
        configFile: 'test/karma.conf.js',
        browsers: ['PhantomJS'],
        singleRun: true,
        reporters: ['dots', 'junit'],

        // increase the timeout for slow build slaves (e.g. Travis-ci)
        browserNoActivityTimeout: 30000,

        // CI friendly test output
        junitReporter: {
          outputFile: 'karma-xunit.xml'
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
            'test/e2e/replication.e2e.js'
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
            'Chrome'
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
              'bcrypt'
            ],
            // transform: ['coffeeify'],
            // debug: true,
            // noParse: ['jquery'],
            watch: true,
          },

          // Add browserify to preprocessors
          preprocessors: {'test/e2e/*': ['browserify']}
        }
      }
    }

  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-jscs');
  grunt.loadNpmTasks('grunt-karma');

  grunt.registerTask('e2e-server', function() {
    var done = this.async();
    var app = require('./test/fixtures/e2e/app');
    app.listen(3000, done);
  });

  grunt.registerTask('e2e', ['e2e-server', 'karma:e2e']);

  // Default task.
  grunt.registerTask('default', ['browserify']);

  grunt.registerTask('test', [
    'jscs',
    'jshint',
    process.env.JENKINS_HOME ? 'mochaTest:unit-xml' : 'mochaTest:unit',
   'karma:unit-once']);

  // alias for sl-ci-run and `npm test`
  grunt.registerTask('mocha-and-karma', ['test']);
};
