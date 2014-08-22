module.exports = {
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
};