module.exports = {

	jsonToIndex: {
		src: ['<%= path %>/dashif.js', '<%= path %>/json.js'],
		dest: '<%= path %>/dashif.js',
	},

	agent: {
		src: [
		'<%= metricsAgent %>/MetricsAgent.js', 
		'<%= metricsAgent %>/MetricsDatabase.js',
		'<%= metricsAgent %>/MetricsSender.js',
		'<%= metricsAgent %>/collectors/HasPlayerCollector.js',
		'<%= metricsAgent %>/formatters/CSQoEFormatter.js',
		'<%= metricsAgent %>/MetricsVo.js'
		],
		dest: '<%= path %>/metricsAgent.js',
	}
	
};