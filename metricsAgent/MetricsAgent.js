/*

parameters: 
activationUrl: 'getActivationOrderFromThisUrl'
serverUrl: 'sendMetricsToThisUrl',
collector: 'nameOfTheCollector',
formatter: 'nameOfTheFormatter',
sendingTime: timerToSendMetricsInMs

*/

var messageInterval = null;

function MetricsAgent(player, video, parameters, debug) {
	this.version = '1.0.0';
	this.player = player;
	this.video = video;
	this.parameters = parameters;
	this.debug = debug;
	this.timerActivated = false;

	if ((this.debug === undefined) || (this.debug === null)) {
		this.debug = console;
	}

	this.sessionId = null;
	this.database = new MetricsDatabase(this.video);
	this.collector = new window[this.parameters.collector](this.player, this.database);
	this.formatter = new window[this.parameters.formatter](this.database, this.parameters.eventsObjectFilter,this.parameters.eventTypeSessionFilter, this.parameters.eventTypeRealTimeFilter);
	this.sender = new MetricsSender(this.debug);
	this.isSending = false;


	//activate metrics listener
	this.collector.listen();
	this.video.addEventListener('newMetricStored', this.metricAdded.bind(this), false);
}

MetricsAgent.prototype.getVersion = function() {
	return this.version;
};

MetricsAgent.prototype.init = function(callback) {

	this.getActivation(function(activation) {
		if (callback) {
			if (activation.active) {
				this.debug.log('[MetricsAgent][' + this.parameters.activationUrl + '] - Activation: ' + activation.active);
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
	this.sessionId = this.formatter.generateSessionId();

	this.database.init(this.sessionId);
	this.collector.init(this.sessionId);
	this.formatter.init(this.database);

	// Activate periodic messages
	//messageInterval = setInterval(function () {this.sendPeriodicMessage();}.bind(this), this.parameters.sendingTime);
};

MetricsAgent.prototype.getActivation = function(callback) {
	if (this.parameters.activationUrl) {
		this.sender.http('GET', this.parameters.activationUrl, null, callback, callback ? true : false);
	}else{
		//no activation url, MetricsAgent is activated by parameter enable value 
		var activation = {};
		activation.active = this.parameters.enable;
		callback(activation);
	}
};

MetricsAgent.prototype.sendPeriodicMessage = function() {

	//console.log('%c SEND PERIODIC MESSAGE ', 'color: #2980b9');
	this.database.updateCurrentState();
	this.sendMetrics();
};

MetricsAgent.prototype.metricAdded = function(event) {
	var metric = event.detail.metric;

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

	this.sendMetrics(metric);
};

MetricsAgent.prototype.sendMetrics = function(metric) {
	//avoid sending same metrics twice
	if(this.isSending) {
		return;
	}
	this.isSending = true;

	var formattedData = this.formatter.process(metric);

	//send formated Metrics to serverUrl in param
	if (formattedData) {
		this.sender.http('POST', this.parameters.serverUrl, JSON.stringify(formattedData));
	}
	this.isSending = false;
};

