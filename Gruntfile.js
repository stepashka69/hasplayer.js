module.exports = function(grunt) {
  grunt.initConfig({

    jshint: {
      all: ["app/js/*/**/*.js"],
      options: {
        jshintrc: ".jshintrc"
      }
    },

    useminPrepare: {
      html: 'index.html',
      options: {
        dest: 'dist'
      }
    },

    usemin: {
      html: ['dist/index.html']
    },

    copy: {
      html: {
        src: 'index.html', dest: 'dist/index.html'
      }
    },

    cssmin: {
      generated: {
        options: {
          keepSpecialComments: 0
        }
      },
      mini: {
        files: {
          'dist/style.css': ['dist/style.css']
        }
      }
    },

    uglify: {
      generated: {
        options: {
          compress:{
            pure_funcs: [
            'self.debug.log',   /* set this function « no side effects » so  you can remove it ! */
            'this.debug.log',
            'rslt.debug.log'
            ],
            global_defs: {
              DEBUG: true        /* conditionned code by DEBUG will be remove at build */
            },
            drop_console : true,  /* remove console statements */
            drop_debugger: true,  /* remove debugger statements */
            warnings: true       /* display compress warnings (lines removal for example) */
          },
          banner: '/* Last build : @@TIMESTAMPTOREPLACE / git revision : @@REVISIONTOREPLACE */\n' /* add this line at dash.all.js start */
          // ,
          // beautify : {        /* to debug purpose : code is more human readable  */
          //   beautify : true
          // },
          // mangle: false       /* to debug purpose : variable names are unchanged */
        }
      },
      json: {
        options: {
          beautify : false,
          mangle: false
        },
        files: {
          'dist/json.js': ['dist/json.js']
        }
      } 
    },

    filerev: {
      options: {
        encoding: 'utf8',
        algorithm: 'md5',
        length: 8
      }
    },

    uncss: {
      dist: {
        options: {
          ignore: [
          /(#|\.)fancybox(\-[a-zA-Z]+)?/,
          ".open>.dropdown-menu",
          ".nav>li",
          ".nav-tabs>li",
          ".nav-tabs>li.active>a",
          ".nav-tabs>li.active>a:hover",
          ".nav-tabs>li.active>a:focus",
          ".tab-content>.active",
          ".pill-content>.active",
          ".tab-content>.tab-pane", 
          ".pill-content>.pill-pane",
          ".fade",
          ".fade.in",
          ".collapse",
          ".collapse.in",
          ".navbar-collapse",
          ".navbar-collapse.in",
          ".collapsing",
          ".alert-danger",
          ".visible-xs",
          ".noscript-warning"
          ],
        },
        files: {
          'dist/style.css': ['dist/index.html']
        }
      }
    },

    htmlbuild: {
      dist: {
        src: 'dist/index.html',
        dest: 'dist/',
        options: {
          beautify: false,
          relative: true,
          styles: {
            main: ['dist/style.css']
          }
        }
      }
    },

    revision: {
      options: {
        property: 'meta.revision',
        ref: 'development',
        short: true
      }
    },

    replace: {
      all: {
        options: {
          patterns: [
          {
            match: 'REVISIONTOREPLACE',
            replacement: '<%= meta.revision %>'
          },
          {
            match: 'TIMESTAMPTOREPLACE',
            replacement: '<%= (new Date().getDate())+"."+(new Date().getMonth()+1)+"."+(new Date().getFullYear())+"_"+(new Date().getHours())+":"+(new Date().getMinutes())+":"+(new Date().getSeconds()) %>'
          }
          ]
        },
        files: [
        {expand: true, flatten: true, src: ['dist/player.js', 'dist/index.js'], dest: 'dist'}
        ]
      }
    },

    json: {
      main: {
        options: {
          namespace: 'jsonData',
          includePath: false,
          processName: function(filename) {
            return filename.toLowerCase();
          }
        },
        src: ['app/sources.json', 'app/notes.json', 'app/contributors.json', 'app/player_libraries.json', 'app/showcase_libraries.json'],
        dest: 'dist/json.js'
      }
    },

    concat: {
      jsonToIndex: {
        src: ['dist/index.js', 'dist/json.js'],
        dest: 'dist/index.js',
      },
    },

    htmlmin: {
      main: {
        options: {
          removeComments: true,
          collapseWhitespace: true
        },
        files: {
          'dist/index.html': 'dist/index.html'
        }
      }
    },

    clean: {
      start: {
        src: ['dist']
      },
      end: {
        src: ['dist/style.css', 'dist/json.js']
      }
    }


  });

  // Require needed grunt-modules
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-filerev');
  grunt.loadNpmTasks('grunt-usemin');
  // grunt.loadNpmTasks('grunt-uncss');
  grunt.loadNpmTasks('grunt-html-build');
  grunt.loadNpmTasks('grunt-git-revision');
  grunt.loadNpmTasks('grunt-replace');
  grunt.loadNpmTasks('grunt-json');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');


  grunt.registerTask('test', [
    'jshint',
  ]);

  // Define tasks
  grunt.registerTask('build', [
    'clean:start',
    'revision',
    'copy',
    'useminPrepare',
    'concat:generated',
    'cssmin:generated',
    'uglify:generated',
    'filerev',
    'usemin',
    // 'uncss', //Causing troubles with graphics elements not loading at start
    'cssmin:mini',
    'htmlbuild',
    'replace',
    'json',
    'uglify:json',
    'concat:jsonToIndex',
    'htmlmin:main',
    'clean:end'
    ]);
};
