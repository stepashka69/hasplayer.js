module.exports = function(grunt) {

	grunt.config.set('path', 'build');
	grunt.config.set('metricsAgent', 'metricsAgent');
	
	grunt.registerTask('build-agent', [
    'clean:start',            //empty folder
    'revision',               //get git info
    'concat:agent',       //merge all the files in one for each blocks
    'uglify:agent',            //minify the concated file
    'replace:agent',          //Add the git info in files
    // 'clean:end'               //Clean temp files
    ]);

};