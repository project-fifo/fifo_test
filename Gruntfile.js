module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    nodemon: {
      dev: {
        options: {
          file: 'server/server.js',
          args: ['dev'],
          ignoredFiles: ['README.md', 'node_modules/**'],
          watchedExtensions: ['js'],
          watchedFolders: ['tests'],
          debug: false,
          delayTime: 1,
          env: {
            PORT: '1337'
          },
          cwd: __dirname
        }
      },
      exec: {
        options: {
          exec: 'less'
        }
      }
    },
    jshint: {
      files: ['Gruntfile.js'],
      options: {
        globals: {
          jQuery: true,
          console: false,
          module: true,
          document: true
        }
      }
    }, 
    mochaTest: {
      datasets: {
        options: {
          reporter: 'spec',
          testname: "mocha tests - datasets only",
          bail: true
        },
        src: ['server/tests/**/*datasets.js']
      },
      dtraces: {
        options: {
          reporter: 'spec',
          testname: "mocha tests - dtraces only",
          bail: true
        },
        src: ['server/tests/**/*dtraces.js']
      },
      roles: {
        options: {
          reporter: 'spec',
          testname: "mocha tests - roles only",
          bail: true
        },
        src: ['server/tests/**/*roles.js']
      },
      hypervisors: {
        options: {
          reporter: 'spec',
          testname: "mocha tests - hypervisors only",
          bail: true
        },
        src: ['server/tests/**/*hypervisors.js']
      },
      ipranges: {
        options: {
          reporter: 'spec',
          testname: "mocha tests - ipranges only",
          bail: true
        },
        src: ['server/tests/**/*ipranges.js']
      },
      lists: {
        options: {
          reporter: 'spec',
          testname: "mocha tests - lists only",
          bail: true
        },
        src: ['server/tests/**/*lists.js']
      },
      networks: {
        options: {
          reporter: 'spec',
          testname: "mocha tests - networks only",
          bail: true
        },
        src: ['server/tests/**/*networks.js']
      },
      orgs: {
        options: {
          reporter: 'spec',
          testname: "mocha tests - orgs only",
          bail: true
        },
        src: ['server/tests/**/*orgs.js']
      },
      packages: {
        options: {
          reporter: 'spec',
          testname: "mocha tests - packages only",
          bail: true
        },
        src: ['server/tests/**/*packages.js']
      },
      users: {
        options: {
          reporter: 'spec',
          testname: "mocha tests - users only",
          bail: true
        },
        src: ['server/tests/**/*users.js']
      },
      vms: {
        options: {
          reporter: 'spec',
          testname: "mocha tests - vms only",
          bail: true
        },
        src: ['server/tests/**/*vms.js']
      }
    }

////////

  });

////////
  
  grunt.loadNpmTasks('grunt-nodemon');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');
  
  // backend fifo test tasks
  grunt.registerTask('test', [ 'jshint', 'mochaTest:datasets', 'mochaTest:dtraces', 'mochaTest:roles',
    'mochaTest:hypervisors', 'mochaTest:ipranges', 'mochaTest:networks', 'mochaTest:orgs',
    'mochaTest:packages', 'mochaTest:users', 'mochaTest:vms' ]);

  grunt.registerTask('test1', [ 'jshint', 'mochaTest:dtraces', 'mochaTest:roles', 'mochaTest:hypervisors',
    'mochaTest:ipranges', 'mochaTest:networks', 'mochaTest:orgs', 'mochaTest:packages' ]);

  grunt.registerTask('test2', [ 'jshint', 'mochaTest:datasets', 'mochaTest:users', 'mochaTest:vms' ]);

  grunt.registerTask('test-datasets', [ 'jshint', 'mochaTest:datasets' ]);
  grunt.registerTask('test-dtraces', [ 'jshint', 'mochaTest:dtraces' ]);
  grunt.registerTask('test-roles', [ 'jshint', 'mochaTest:roles' ]);
  grunt.registerTask('test-hypervisors', [ 'jshint', 'mochaTest:hypervisors' ]);
  grunt.registerTask('test-ipranges', [ 'jshint', 'mochaTest:ipranges' ]);
  grunt.registerTask('test-lists', [ 'jshint', 'mochaTest:lists' ]);
  grunt.registerTask('test-networks', [ 'jshint', 'mochaTest:networks' ]);
  grunt.registerTask('test-orgs', [ 'jshint', 'mochaTest:orgs' ]);
  grunt.registerTask('test-packages', [ 'jshint', 'mochaTest:packages' ]);
  grunt.registerTask('test-users', [ 'jshint', 'mochaTest:users' ]);
  grunt.registerTask('test-vms', [ 'jshint', 'mochaTest:vms' ]);

  // general tasks
  grunt.registerTask('init', [ 'shell:copyFontAwesomeCSS', 'shell:copyFontAwesomeFonts','less:production', 'requirejs:mainJS', 'requirejs:mainCSS' ]);
  grunt.registerTask('build', [ 'less:production', 'requirejs:mainJS', 'requirejs:mainCSS' ]);

  grunt.registerTask('server', [ 'nodemon:dev' ]);
  grunt.registerTask('default', [ 'init', 'test', 'build' ]);
  grunt.registerTask('default', [  "watch" ]);


}; // End
