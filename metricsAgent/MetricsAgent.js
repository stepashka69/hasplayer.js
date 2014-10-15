/*

parameters: 
activationUrl: 'getActivationOrderFromThisUrl'
serverUrl: 'sendMetricsToThisUrl',
collector: 'nameOfTheCollector',
formatter: 'nameOfTheFormatter',
sendingTime: timerToSendMetricsInMs

*/

var messageInterval = null;

function MetricsAgent(player, video, parameters) {
	this.player = player;
	this.video = video;
	this.parameters = parameters;
	this.timerActivated = false;

	this.sessionId = null;
	this.database = new MetricsDatabase(this.video);
	this.collector = new window[this.parameters.collector](this.player, this.database);
	this.formatter = new window[this.parameters.formatter](this.database);
	this.sender = new MetricsSender();
	this.isSending = false;

	//activate metrics listener
	this.collector.listen();
	this.video.addEventListener("newMetricStored", this.metricAdded.bind(this), false);
}

MetricsAgent.prototype.init = function(callback) {

	this.getActivation(function(activation) {
		if (callback) {
			if (activation.active) {
				console.log("MetricsAgent [" + this.parameters.activationUrl + "] - Activation: " + activation.active);
			}
			callback(activation.active);
		}
	}.bind(this));	
};

MetricsAgent.prototype.stop = function() {

	// Desactivate periodic messages
	clearInterval(messageInterval);

	// Reset session id
	this.sessionId = null;
};

MetricsAgent.prototype.createSession = function() {

	//console.log('%c START OF SESSION ', 'color: #2980b9');
	this.sessionId = new Date().getTime()+"."+String(Math.random()).substring(2);

	this.database.init(this.sessionId);
	this.collector.init(this.sessionId);
	this.formatter.init(this.database);

	// Activate periodic messages
	//messageInterval = setInterval(function () {this.sendPeriodicMessage();}.bind(this), this.parameters.sendingTime);
};

MetricsAgent.prototype.getActivation = function(callback) {
	this.sender.http('GET', this.parameters.activationUrl, null, callback, callback ? true : false);
};

MetricsAgent.prototype.sendPeriodicMessage = function() {

	//console.log('%c SEND PERIODIC MESSAGE ', 'color: #2980b9');
	this.database.updateCurrentState();
	this.sendMetrics(this.formatter.MESSAGE_PERIODIC);
};

MetricsAgent.prototype.metricAdded = function(event) {
	var metric = event.detail.metric,
		messageType = -1;

	// Send metric details for debugging
	if (this.parameters.dbServerUrl) {
		this.sender.http('POST', this.parameters.dbServerUrl, JSON.stringify(metric));
	}

	// If state metric
	if (metric.hasOwnProperty('state')) {
		// If "stopped" state then stop periodic message
		// Else (re)start periodic messages
		if (metric.state.current === 'stopped') {
			//console.log('%c STOP PERIODIC MESSAGES', 'color: #2980b9');
			clearInterval(messageInterval);
			messageInterval = null;
		} else if (!messageInterval) {
			//console.log('%c START PERIODIC MESSAGES', 'color: #2980b9');
			messageInterval = setInterval(function () {this.sendPeriodicMessage();}.bind(this), this.parameters.sendingTime);
		}
	}

	// Check if we have to send a new message
	messageType = this.formatter.getMessageType(metric);

	if (messageType !== -1) {
		//console.log('%c SEND MESSAGE %s', 'color: #2980b9', messageType);
		this.sendMetrics(messageType);
	}
};

MetricsAgent.prototype.sendMetrics = function(type) {
	//avoid sending same metrics twice
	if(this.isSending) {
		return;
	}
	this.isSending = true;

	//get all metrics and format them
	var metrics = this.database.getMetrics();
	var formattedData = this.formatter.process(type, metrics);

	//send formated Metrics to serverUrl in param
	this.sender.http('POST', this.parameters.serverUrl, JSON.stringify(formattedData));
	this.isSending = false;
};

