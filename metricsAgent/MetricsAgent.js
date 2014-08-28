/*

parameters: 
activationUrl: 'getActivationOrderFromThisUrl'
serverUrl: 'sendMetricsToThisUrl',
collector: 'nameOfTheCollector',
formatter: 'nameOfTheFormatter',
sendingTime: timerToSendMetricsInMs

*/

function MetricsAgent(player, parameters) {

	this.player = player;
	this.parameters = parameters;

	this.database = null;
	this.sender = null;
	this.collector = null;
	this.formatter = null;

	this.init();
}

MetricsAgent.prototype.init = function() {

	this.sender = new MetricsSender();

	this.getActivation(function(activation) {
		if(activation.active) {
			this.database = new MetricsDatabase();
			this.collector = new window[this.parameters.collector](this.player, this.database);
			this.formatter = new window[this.parameters.formatter](this.database);

			this.collector.listen();
			this.schedule();
		}
	}.bind(this));

};

MetricsAgent.prototype.getActivation = function(callback) {

	//get informations required by server to activate the agent
	var informations = {
		OS: 'Firefox',
		URL: 'http://orange.fr'
	};
	
	var serialize = function(obj, prefix) {
		var str = [];
		for(var p in obj) {
			var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
			str.push(typeof v == "object" ?
				serialize(v, k) :
				encodeURIComponent(k) + "=" + encodeURIComponent(v));
		}
		return str.join("&");
	};

	this.sender.http('GET', this.parameters.activationUrl + '?' + serialize(informations), JSON.stringify(informations), callback);

};

MetricsAgent.prototype.schedule = function() {

	//send the metrics each ?seconds for now
	setTimeout(function() {

		//get all the metrics for now
		var metrics = this.database.getMetrics();
		var formattedData = this.formatter.process(metrics);
		//send formated Metrics to serverUrl in param
		this.sender.http('POST', this.parameters.serverUrl, JSON.stringify(formattedData));
		this.database.clear();
		this.schedule();

	}.bind(this), this.parameters.sendingTime);

};