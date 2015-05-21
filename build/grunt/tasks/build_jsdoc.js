module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    jsdoc : {
        dist : {
            src: ['../app/js/streaming/MediaPlayer.js'],
            options: {
                destination: '../doc/JSDoc/MediaPlayer/',
                configure: '../doc/JSDoc/Template/conf.json',
                template: 'node_modules/grunt-jsdoc/node_modules/ink-docstrap/template'
            }
        }
    }
  });

  grunt.loadNpmTasks('grunt-jsdoc');

};