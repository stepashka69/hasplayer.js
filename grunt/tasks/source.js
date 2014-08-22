module.exports = function(grunt) {

	grunt.config.set('path', 'build');
	grunt.config.set('orangeApps', 'orangeApps');
	grunt.config.set('appDemoPlayer', 'orangeApps/DemoPlayer');
	grunt.config.set('app4Ever', 'orangeApps/4Ever');
	grunt.config.set('appDashif', 'orangeApps/Dash-IF');
	grunt.config.set('appABRTest', 'orangeApps/ABRTest/');

	grunt.registerTask('source', [
		'replace:source'
		]);
};