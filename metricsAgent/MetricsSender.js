function MetricsSender () {}

MetricsSender.prototype.http = function(type, url, data, callback) {

	var http = new XMLHttpRequest();

	console.log("MetricsAgent [" + url + "] - Open");
	http.open(type, url, true);
	http.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
	http.timeout = 2000;

	http.ontimeout = function (res) {
		console.log("MetricsAgent [" + url + "] TIMEOUT");
	}

	http.onreadystatechange = function() {
		
		console.log("MetricsAgent [" + url + "] - onreadystatechange, readystate = " + http.readyState + ", status = " + http.status);
		if(http.readyState == 4 && (http.status == 204 || http.status == 200)) {
			if(callback) {
				var result = JSON.parse(http.response);
				callback(result);
			}
		} else if(http.readyState == 4 && callback){
			var result = {
				active: false
			};
			callback(result);
		}
	};
	if(type === 'GET') {
		console.log("MetricsAgent [" + url + "] - Send");
		http.send();
	} else {
		console.log("MetricsAgent [" + url + "] - Message:");
		console.log(JSON.stringify(data));
		http.send(data);
	}

};

