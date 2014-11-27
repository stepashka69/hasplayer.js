function MetricsSender (debug) {
	this.debug = debug;
}

MetricsSender.prototype.http = function(type, url, data, callback) {

	var http = new XMLHttpRequest(),
		result = null;

	http.open(type, url, true);
	http.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
	http.timeout = 2000;

	http.onreadystatechange = function() {
		
		if(http.readyState == 4 && (http.status == 204 || http.status == 200)) {
			if(callback) {
				result = JSON.parse(http.response);
				callback(result);
			}
		} else if(http.readyState == 4 && callback){
			result = {
				active: false
			};
			callback(result);
		}
	};

	if(type === 'GET') {
		http.send();
	} else {
		this.debug.log('[MetricsAgent][' + url + '] - Send message: ' + data);
		http.send(data);
	}

};

