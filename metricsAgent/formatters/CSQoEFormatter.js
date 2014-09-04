function CSQoE () {
}

CSQoE.prototype.process = function(metrics) {
	var len = metrics.length,
		i = 0,
		formattedData = [];

	for(i; i<len; i++) {
		var formattedMetric = this.format(metrics[i]);
		formattedData.push(formattedMetric);
	}

	return formattedData;
};

CSQoE.prototype.format = function(metric) {

	//rules to format metric
	return metric.about;

};

