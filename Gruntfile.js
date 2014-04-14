/*global module:false*/
module.exports = function(grunt) {

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
      lib_test: {
        src: ['lib/**/*.js', 'test/**/*.js']
      }
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      lib_test: {
        files: '<%= jshint.lib_test.src %>',
        tasks: ['jshint:lib_test']
      }
    },
    browserify: {
      dist: {
        files: {
          'dist/loopback.js': ['index.js'],
        },
        options: {
          ignore: ['nodemailer', 'passport'],
          standalone: 'loopback'
        }
      }
    },
    karma: {
      unit: {
        options: {
          // base path, that will be used to resolve files and exclude
          basePath: '',

          // frameworks to use
          frameworks: ['mocha', 'browserify'],

          // list of files / patterns to load in the browser
          files: [
            'test/support.js',
            'test/model.test.js',
            'test/geo-point.test.js'
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
              'supertest'
            ],
            // transform: ['coffeeify'],
            // debug: true,
            // noParse: ['jquery'],
            watch: true,
          },

          // Add browserify to preprocessors
          preprocessors: {'test/*': ['browserify']}
        }
      },
      e2e: {
        options: {
          // base path, that will be used to resolve files and exclude
          basePath: '',

          // frameworks to use
          frameworks: ['mocha', 'browserify'],

          // list of files / patterns to load in the browser
          files: [
            'test/e2e/remote-connector.e2e.js'
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
              'supertest'
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
  grunt.loadNpmTasks('grunt-karma');

  grunt.registerTask('e2e-server', function() {
    var done = this.async();
    var app = require('./test/fixtures/e2e/app');
    app.listen(3000, done);
  });

  grunt.registerTask('e2e', ['e2e-server', 'karma:e2e']);

  // Default task.
  grunt.registerTask('default', ['browserify']);

};
