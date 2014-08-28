function HasPlayerCollector (player, database) {

	this.player = player;
	this.database = database;
	this.data = {};
	
}

HasPlayerCollector.prototype.listen = function() {
	
	this.player.addEventListener('metricAdded', function(metric) {
		this.database.setMetric(this.map(metric.data));
	}.bind(this));
	
};

HasPlayerCollector.prototype.map = function(metric) {
	
	//rules to map metrics
	this.data = {
		type: metric.stream,
		about: metric.metric,
		metric: metric.value
	};

	return this.data;
};