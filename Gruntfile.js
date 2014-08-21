module.exports = function(grunt) {
  grunt.initConfig({

    path: 'build',
    orangeApps: 'orangeApps',
    appDemoPlayer: 'orangeApps/DemoPlayer',
    app4Ever: 'orangeApps/4Ever',
    appDashif: 'orangeApps/Dash-IF',
    appABRTest: 'orangeApps/ABRTest/',

    //Check for syntax errors
    jshint: {
      all: ["app/js/*/**/*.js"],
      options: {
        jshintrc: ".jshintrc"
      }
    },

    //Copy the index to the build folder
    copy: {
      html: {
        files: [
        {src: '<%= appDashif %>/index.html', dest: '<%= path %>/index.html'},
        {src: '<%= appDemoPlayer %>/index.html', dest: '<%= path %>/player.html'}
        ]
      }
    },

    //Configuration for blocks in HTML
    useminPrepare: {
      src: ['<%= appDashif %>/index.html', '<%= appDemoPlayer %>/index.html', '<%= path %>/source/playerSrc.html'],
      options: {
        dest: '<%= path %>'
      }
    },

    //The HTML to parse
    usemin: {
      html: ['<%= path %>/index.html', '<%= path %>/player.html', '<%= path %>/source/playerSrc.html']
    },

    //Get CSS files into one and replace all file url with base64 inline
    cssUrlEmbed: {
      encodeDirectly: {
        files: {
          '<%= path %>/style.css': [
          'app/lib/bootstrap/css/bootstrap.min.css',
          'app/lib/bootstrap/css/bootstrap-glyphicons.css',
          'app/lib/angular.treeview/css/angular.treeview.css',
          'app/css/main.css',
          'app/lib/video/video-4.6.min.css',
          'app/lib/jquery.ui/jquery-ui-1.10.3.custom.min.css',
          'app/lib/jquery.ui.labeledSlider/jquery.ui.labeledslider.css'
          ]
        },
        options: {
          failOnMissingUrl: false
        }
      }
    },

    //Options for minify CSS
    cssmin: {
      generated: {
        options: {
          keepSpecialComments: 0
        }
      },
      style: {
        options: {
          keepSpecialComments: 0
        },
        files: {
          '<%= path %>/style.css': ['<%= path %>/style.css']
        }
      }
    },

    //Write CSS from style.css inline in HTML where block is main
    htmlbuild: {
      dist: {
        src: '<%= path %>/index.html',
        dest: '<%= path %>',
        options: {
          beautify: false,
          relative: true,
          styles: {
            main: ['<%= path %>/style.css']
          }
        }
      }
    },

    //Options for minify JavaScript
    uglify: {
      generated: {
        options: {
          compress:{
            pure_funcs: [
            'self.debug.log',
            'this.debug.log',
            'rslt.debug.log'
            ],
            global_defs: {
              DEBUG: true
            },
            drop_console : true,
            drop_debugger: true,
            warnings: true
          },
          banner: '/* Last build : @@TIMESTAMPTOREPLACE / git revision : @@REVISIONTOREPLACE */\n'
        }
      },
      json: {
        options: {
          beautify : false,
          mangle: false
        },
        files: {
          '<%= path %>/json.js': ['<%= path %>/json.js']
        }
      } 
    },

    //Transform the json files in objects all in one JavaScript file
    json: {
      main: {
        options: {
          namespace: 'jsonData',
          includePath: false,
          processName: function(filename) {
            return filename.toLowerCase();
          }
        },
        src: [
          '<%= appDashif %>/json/sources.json',
          '<%= appDashif %>/json/notes.json',
          '<%= appDashif %>/json/contributors.json',
          '<%= appDashif %>/json/player_libraries.json',
          '<%= appDashif %>/json/showcase_libraries.json'
        ],
        dest: '<%= path %>/json.js'
      }
    },

    //Merge the JavaScript Json file with the index.js one
    concat: {
      jsonToIndex: {
        src: ['<%= path %>/index.js', '<%= path %>/json.js'],
        dest: '<%= path %>/index.js',
      },
    },

    //Minify the HTML
    htmlmin: {
      main: {
        options: {
          removeComments: true,
          collapseWhitespace: true,
          minifyCSS: true
        },
        files: {
          '<%= path %>/index.html': '<%= path %>/index.html',
          '<%= path %>/player.html': '<%= path %>/player.html'
        }
      }
    },

    //Get the revision info from git
    revision: {
      options: {
        property: 'meta.revision',
        ref: 'HEAD',
        short: true
      }
    },

    //Put the revision info in JS files
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
        {expand: true, flatten: true, src: ['<%= path %>/dash.all.js', '<%= path %>/index.js', '<%= path %>/player.js'], dest: '<%= path %>'}
        ]
      },
      source: {
        options: {
          patterns: [
          {
            match: /<!-- source -->([\s\S]*?)<!-- \/source -->/,
            replacement: '<%= grunt.file.read("orangeApps/playerSrc.html") %>'
          }
          ]
        },
        files: [
          {expand: true, flatten: true, src: ['<%= appDemoPlayer %>/index.html'], dest: '<%= appDemoPlayer %>'},
          {expand: true, flatten: true, src: ['<%= app4Ever %>/index.html'], dest: '<%= app4Ever %>'},
          {expand: true, flatten: true, src: ['<%= appDashif %>/index.html'], dest: '<%= appDashif %>'},
          {expand: true, flatten: true, src: ['<%= appABRTest %>/current.html'], dest: '<%= appABRTest %>'}
        ]
      },
      sourceForBuild: {
        options: {
          patterns: [
          {
            match: /<!-- source -->/,
            replacement: '<!-- build:js dash.all.js-->'
          },
          {
            match: /<!-- \/source -->/,
            replacement: '<!-- endbuild -->'
          }
          ]
        },
        files: [
          {expand: true, flatten: true, src: ['<%= orangeApps %>/playerSrc.html'], dest: '<%= path %>/source'}
        ]
      },
      sourceByBuild: {
        options: {
          patterns: [
          {
            match: /<!-- source -->([\s\S]*?)<!-- \/source -->/,
            replacement: '<script src="dash.all.js"></script>'
          }
          ]
        },
        files: [
          {expand: true, flatten: true, src: ['<%= path %>/player.html'], dest: '<%= path %>'},
          {expand: true, flatten: true, src: ['<%= path %>/index.html'], dest: '<%= path %>'}
        ]
      }
    },

    //Remove folder at start and temporary files in the end
    clean: {
      start: {
        src: ['<%= path %>']
      },
      end: {
        src: ['<%= path %>/style.css', '<%= path %>/json.js', '<%= path %>/source']
      }
    }

  });

  // Require needed grunt-modules
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-git-revision');
  grunt.loadNpmTasks('grunt-usemin');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-css-url-embed');
  grunt.loadNpmTasks('grunt-json');
  grunt.loadNpmTasks('grunt-html-build');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.loadNpmTasks('grunt-replace');


  grunt.registerTask('test', [
    'jshint'
    ]);

  grunt.registerTask('source', [
    'replace:source'
    ]);

  grunt.registerTask('build', [
    'clean:start',        //empty folder
    'copy',               //copy HTML file
    'replace:sourceByBuild', //replace source by call for dash.all.js
    'replace:sourceForBuild', //prepare source file for dash.all.js
    'revision',           //get git info
    'useminPrepare',      //get files in blocks tags
    'concat:generated',   //merge all the files in one for each blocks
    'cssUrlEmbed',        //get the CSS files and merge into one
    'cssmin:style',       //minify the generated CSS file
    'cssmin:generated',   //minify the CSS in blocks (none)
    'uglify:generated',   //minify the JS in blocks
    'json',               //get the json files into a json.js
    'uglify:json',        //minify the json.js file
    'concat:jsonToIndex', //merge the json.js file with index.js
    'usemin',             //replace the tags blocks by the result
    'htmlbuild:dist',     //inline the CSS
    'htmlmin:main',       //Minify the HTML
    'replace',            //Add the git info in files
    'clean:end'           //Clean temp files
    ]);
};
