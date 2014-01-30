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
        curly: false,
        eqeqeq: true,
        immed: true,
        latedef: false,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        unused: false,
        boss: true,
        eqnull: true,
        browser: true,
        asi: true,
        node: true,
        laxbreak: true,
        globals: {
          require: true,
          jQuery: true,
          process: true,
          /* MOCHA */
          describe: false,
          it: false,
          before: false,
          beforeEach: false,
          after: false,
          afterEach: false,
          assert: false,
          request: false,
          app: false,
          loopback: false,
          expect: true,
          GeoPoint: true,
          assertValidDataSource: true
        }
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
          ignore: ['nodemailer', 'passport']
        }
      }
    },
    mochaSelenium: {
      options: {
        // Mocha options
        reporter: 'spec',
        timeout: 30e3,
        // Toggles wd's promises API, default:false
        usePromises: false
      },
      firefox: {
        src: ['test/*.js']
        // firefox is the default browser, so no browserName option required
      },
      chrome: {
        src: ['test/*.js'],
        options: {
          // Chrome browser must be installed from Chromedriver support
          browserName: 'chrome'
        }
      },
      phantomjs: {
        src: ['test/*.js'],
        options: {
          // phantomjs must be in the $PATH when invoked
          browserName: 'phantomjs'
        }
      }
    }
  });

// todo appium

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-selenium');

  // Default task.
  grunt.registerTask('default', ['browserify', 'mochaSelenium']);

};
