function MetricsDatabase(video) {
	this.sessionId = null;
	this.video = video;
	this.browserId = "browserid";
	this.metrics = [];
}

MetricsDatabase.prototype.isDefined = function(value) {
	return (value !== undefined && value !== null && value !== '');
};

MetricsDatabase.prototype.init = function(sessionId) {
	this.clear();
	this.sessionId = sessionId;

	localStorage.removeItem(this.sessionId);
	localStorage.setItem(this.sessionId, "[]");

	var browserid = JSON.parse(localStorage.getItem(this.browserId));

	if (browserid) {
		this.browserUUID = browserid;
	} else{
		this.browserUUID = this.generateUUID();
		localStorage.setItem(this.browserId, JSON.stringify(this.browserUUID));
	}

	// Add a "init" state
	this.metrics.push({'state': {'current': 'init'}, 'date': new Date().getTime()});
};

MetricsDatabase.prototype.generateUUID = function() {
	var d = new Date().getTime();
	var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = (d + Math.random()*16)%16 | 0;
		d = Math.floor(d/16);
		return (c=='x' ? r : (r&0x7|0x8)).toString(16);
	});
	return uuid;
};

MetricsDatabase.prototype.getBrowserId = function() {
	return this.browserUUID;
};

MetricsDatabase.prototype.addMetric = function(metric) {

	// Set metrics date
	metric.date = new Date().getTime();

	// Process the new metric and push it into database
	this.processMetric(metric);

	// Save current database into local storage
	localStorage.setItem(this.sessionId, JSON.stringify(this.metrics));
};

MetricsDatabase.prototype.processMetric = function(metric) {

	var updateOnly = false,
		session = null,
		condition = null,
		previousStateMetric = null;

	// "session" metric => update session fields if already exists
	if (metric.hasOwnProperty('session')) {
		session = this.getMetricObject('session');
		if (session) {
			for (var key in metric.session) {
				if (this.isDefined(metric.session[key])) {
					session[key] = metric.session[key];
				}
			}
			updateOnly = true;
		}
	}

	// "state" metric
	if (metric.hasOwnProperty('state')) {
		// => Get previous state, and update it
		previousStateMetric = this.getMetric('state', true);
		if (previousStateMetric) {
			metric.state.previousState = previousStateMetric.state.current;
			metric.state.previousTime = previousStateMetric.date;
			previousStateMetric.state.duration = metric.date - previousStateMetric.date;
		}

		// => Update session
		session = this.getMetricObject('session');
		if (session) {
			if ((metric.state.current === "buffering") && !session.startBufferingTime) {
				session.startBufferingTime = metric.date;
			}
			if ((metric.state.current === "playing") && !session.startPlayingTime) {
				session.startPlayingTime = metric.date;
			}
		}
	}

	// "metadata" metric => update session
	if (metric.hasOwnProperty('metadata')) {
		if (metric.metadata.bitrates && metric.metadata.contentType === 'video') {
			session = this.getMetricObject('session');
			if (session) {
				session.minBitrate = Math.min.apply(null, metric.metadata.bitrates);
				session.maxBitrate = Math.max.apply(null, metric.metadata.bitrates);
			}
		}
	}

	// "condition" metric => update condition fields 
	if (metric.hasOwnProperty('condition')) {
		condition = this.getMetricObject('condition');
		if (condition) {
			for (var key in metric.condition) {
				if (this.isDefined(metric.condition[key])) {
					condition[key] = metric.condition[key];
				}
			}
			updateOnly = true;
		}
	}

	// Push the new metric
	if (!updateOnly) {
		this.metrics.push(metric);

		// Event to inform in case of instant message needed
		var evt = document.createEvent("CustomEvent");
		evt.initCustomEvent('newMetricStored', false, false, { metric: metric });
		this.video.dispatchEvent(evt);
	}
};

MetricsDatabase.prototype.checkMetric = function (metric, type, condition) {

	if (metric.hasOwnProperty(type)) {
		if (condition !== undefined) {
			if (condition(metric[type])) {
				return true;
			} else {
				return false;
			}
		} else {
			return true;
		}
	}

	return false;
};

MetricsDatabase.prototype.getMetric = function(type, reverseSearch, condition) {
	var i;

	if ((reverseSearch !== undefined) && (reverseSearch === true)) {
		for (i = (this.metrics.length - 1); i >= 0; i--) {
			if (this.checkMetric(this.metrics[i], type, condition)) {
				return this.metrics[i];
			}
		}
	} else {
		for (i = 0; i < this.metrics.length; i++) {
			if (this.checkMetric(this.metrics[i], type, condition)) {
				return this.metrics[i];
			}
		}
	}

	return null;
};

MetricsDatabase.prototype.getMetricObject = function(type, reverseSearch, condition) {
	var metric = this.getMetric(type, reverseSearch, condition);
	if (metric) {
		return metric[type];
	}
	return null;
};

MetricsDatabase.prototype.getMetricsObjects = function(type, reverseSearch, nbElts, condition) {
	var metricsList = [];

	if ((reverseSearch !== undefined) && (reverseSearch === true)) {
		for (i = (this.metrics.length - 1); i >= 0 && (nbElts?metricsList.length < nbElts:true); i--) {
			if (this.checkMetric(this.metrics[i], type, condition)) {
					metricsList.push(this.metrics[i]);
			}
		}
	} else {
		for (i = 0; i < this.metrics.length && (nbElts?metricsList.length < nbElts:true); i++) {
			if (this.checkMetric(this.metrics[i], type, condition)) {
				metricsList.push(this.metrics[i]);
			}
		}
	}

	return metricsList;
};

MetricsDatabase.prototype.getMetrics = function() {
//	var metrics = JSON.parse(localStorage.getItem(this.sessionId));
//	return metrics;
	return this.metrics;
};

MetricsDatabase.prototype.updateCurrentState = function(date) {
	var stateMetric = this.getMetric('state', true),
		currentDate = date ? date : new Date().getTime();

	if (stateMetric) {
		stateMetric.state.duration = currentDate - stateMetric.date;
		stateMetric.state.position = this.video.currentTime;
	}
};

MetricsDatabase.prototype.getCountState = function(state) {
	var metrics = this.getMetrics(),
		i = 0,
		len = metrics.length,
		result = {
			count: 0,
			duration: 0
		};

	for(i = 0; i < len; i++) {
		if (metrics[i].hasOwnProperty('state')) {
			if (metrics[i].state.current === state) {
				result.count++;
				result.duration += metrics[i].state.duration;
			}
		}
	}

	// Set duration in seconds and round to 3 decimals
	result.duration = Math.round(result.duration) / 1000;

	return result;
};

MetricsDatabase.prototype.clear = function() {

	this.metrics = [];

	var dateToCompare = new Date(),
	hour = dateToCompare.getHours();

	dateToCompare.setHours(hour-2);

	for(var key in localStorage) {
		var sessionDate = parseInt(key.split(".")[0]);

		if (!isNaN(sessionDate)) {
			var dateOfSession = new Date(sessionDate);

			if(dateToCompare.getTime() > dateOfSession.getTime()) {
				localStorage.removeItem(key);
			}
		}
	}
};