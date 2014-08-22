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
        jshintrc: ".jshintrc",
        reporter: require('jshint-stylish')
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

    //Options for minify CSS
    cssmin: {
      generated: {
        options: {
          keepSpecialComments: 0
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
  require('load-grunt-tasks')(grunt);

  grunt.registerTask('cssimg', [
    'cssUrlEmbed'
    ]);

  grunt.registerTask('test', [
    'jshint'
    ]);

  grunt.registerTask('source', [
    'replace:source'
    ]);

  grunt.registerTask('build', [
    'clean:start',            //empty folder
    'copy',                   //copy HTML files
    'replace:sourceByBuild',  //replace source by call for dash.all.js
    'replace:sourceForBuild', //prepare source file for dash.all.js
    'revision',               //get git info
    'useminPrepare',          //get files in blocks tags
    'concat:generated',       //merge all the files in one for each blocks
    'cssmin:generated',       //minify the CSS in blocks (none)
    'uglify:generated',       //minify the JS in blocks
    'json',                   //get the json files into a json.js
    'uglify:json',            //minify the json.js file
    'concat:jsonToIndex',     //merge the json.js file with index.js
    'usemin',                 //replace the tags blocks by the result
    'htmlbuild:dist',         //inline the CSS
    'htmlmin:main',           //Minify the HTML
    'replace',                //Add the git info in files
    'clean:end'               //Clean temp files
    ]);
};
