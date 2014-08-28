function MetricsDatabase() {
	this.database = [];
}

MetricsDatabase.prototype.setMetric = function(metric) {
	this.database.push(metric);
};

MetricsDatabase.prototype.getMetrics = function() {
	return this.database;
};

MetricsDatabase.prototype.clear = function() {
	this.database = [];
};