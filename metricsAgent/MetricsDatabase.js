function MetricsDatabase() {
}

MetricsDatabase.prototype.setMetric = function(metric) {
	var date = new Date();
	localStorage.setItem(date.getTime(), JSON.stringify(metric));
};

MetricsDatabase.prototype.getMetrics = function() {
	var datas = [];

	for(var i in localStorage){
		var val = localStorage.getItem(i);
		datas.push(JSON.parse(val));
	}
	
	return datas;
};

MetricsDatabase.prototype.clear = function() {
	localStorage.clear();
};