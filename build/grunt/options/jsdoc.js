module.exports = {
	dist : {
		options:{
			destination: '<%= path %>/doc/JSDoc/OrangeHasPlayer/',
			configure: '../doc/JSDoc/Template/conf.json',
			template: './node_modules/grunt-jsdoc/node_modules/ink-docstrap/template'
		}
	}
};