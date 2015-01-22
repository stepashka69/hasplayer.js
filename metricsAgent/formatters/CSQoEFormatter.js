function CSQoE (database) {
	AbstractFormatter.call(this,database);
	this.StateObject = {};
	this.StateObject.Playing = {count:0, duration:0, lastNewStateDuration:0};
	this.StateObject.Buffering = {count:0, duration:0, lastNewStateDuration:0};
	this.StateObject.Paused = {count:0, duration:0, lastNewStateDuration:0};
	this.StateObject.Stopped = {count:0, duration:0, lastNewStateDuration:0};
	this.StateObject.Seeking = {count:0, duration:0, lastNewStateDuration:0};
}

CSQoE.prototype = Object.create(AbstractFormatter.prototype);
CSQoE.prototype.constructor = CSQoE;

CSQoE.prototype.init = function() {
	AbstractFormatter.prototype.init.call(this);
};

CSQoE.prototype.generateSessionId = function() {
	return AbstractFormatter.prototype.generateSessionId.call(this, ".");
};

CSQoE.prototype.process = function(metric) {
	var formattedData = null;

	if(!this.database) {
		return formattedData;
	}

	if (!metric) {
		formattedData = this.formatterRecurring();
	}
	else if (metric.hasOwnProperty('state') && (metric.state.current !== 'init')) {
		formattedData = this.formatterNewState(metric);
	} else if (metric.hasOwnProperty('metadata')) {
		formattedData = this.formatterMetadata();
	} else if (metric.hasOwnProperty('encoding') && (metric.encoding.contentType === 'video')) {
		formattedData = this.formatterChangeBitrate();
	} else if (metric.hasOwnProperty('error')) {
		formattedData = this.formatterError();
	}

	if (formattedData) {
		this.msgnbr++;
	}

	return formattedData;
};

CSQoE.prototype.updateFormatterState = function(formattedData, isNewState, newMetric) {
	//new metric state has been added
	if (isNewState) {
		//increase the count value
		switch(newMetric.state.current) {
			case "playing" : 
				this.StateObject.Playing.count += formattedData.Playing.count;
				break;
			case "buffering" :
				this.StateObject.Buffering.count += formattedData.Buffering.count;
				break;
			case "paused" :
				this.StateObject.Paused.count += formattedData.Paused.count;
				break;
			case "stopped" :
				this.StateObject.Stopped.count += formattedData.Stopped.count;
				break;
			case "seeking" :
				this.StateObject.Seeking.count += formattedData.Seeking.count;
				break;
		}
		//update, for the previous state, the duration
		switch(newMetric.state.previousState) {
			case "playing" : 
				this.StateObject.Playing.lastNewStateDuration += formattedData.Playing.duration;
				this.StateObject.Playing.duration = this.StateObject.Playing.lastNewStateDuration;
				break;
			case "buffering" :
				this.StateObject.Buffering.lastNewStateDuration += formattedData.Buffering.duration;
				this.StateObject.Buffering.duration = this.StateObject.Buffering.lastNewStateDuration;
				break;
			case "paused" :
				this.StateObject.Paused.lastNewStateDuration += formattedData.Paused.duration;
				this.StateObject.Paused.duration = this.StateObject.Paused.lastNewStateDuration;
				break;
			case "stopped" :
				this.StateObject.Stopped.lastNewStateDuration += formattedData.Stopped.duration;
				this.StateObject.Stopped.duration = this.StateObject.Stopped.lastNewStateDuration;
				break;
			case "seeking" :
				this.StateObject.Seeking.lastNewStateDuration += formattedData.Seeking.duration;
				this.StateObject.Seeking.duration = this.StateObject.Stopped.lastNewStateDuration;
				break;
		}
	}else{
		//a reccurent or error metric has been added
		//update the current state duration = global duration + duration since the last new state metric
		switch(formattedData.state.current) {
			case "Playing" : 
				this.StateObject.Playing.duration = (formattedData.Playing.duration + this.StateObject.Playing.lastNewStateDuration).toFixed(3);
				break;
			case "Buffering" :
				this.StateObject.Buffering.duration = (formattedData.Buffering.duration + this.StateObject.Buffering.lastNewStateDuration).toFixed(3);
				break;
			case "Paused" :
				this.StateObject.Paused.duration = (formattedData.Paused.duration + this.StateObject.Paused.lastNewStateDuration).toFixed(3);
				break;
			case "Stopped" :
				this.StateObject.Stopped.duration = (formattedData.Stopped.duration + this.StateObject.Stopped.lastNewStateDuration).toFixed(3);
				break;
			case "Seeking" :
				this.StateObject.Seeking.duration = (formattedData.Seeking.duration + this.StateObject.Seeking.lastNewStateDuration).toFixed(3);
				break;
		}		
	}
};

CSQoE.prototype.setStateObject = function(stateObject) {
	var data = {};

	data.count = stateObject.count;
	data.duration = stateObject.duration;

	return data;
};

//type 0
CSQoE.prototype.formatterRecurring = function() {

	var data = {};

	data.type = 0;

	data.session = this.formatSessionObject([]);
	
	data.state = this.formatStateObject([]);

	switch(data.state.current) {
		case "Playing":
			data.Playing = this.formatPlayingObject([]);
			break;
		case "Buffering" :
			data.Buffering = this.formatBufferingObject([]);
			break;
		case "Paused" :
			data.Paused = this.formatPausedObject([]);
			break;
		case "Stopped" :
			data.Stopped = this.formatStoppedObject([]);
			break;
		case "Seeking" :
			data.Seeking = this.formatSeekingObject([]);
			break;
	}
	
	this.updateFormatterState(data, false);
	
	data.Playing = this.setStateObject(this.StateObject.Playing);
	data.Seeking = this.setStateObject(this.StateObject.Seeking);
	data.Stopped = this.setStateObject(this.StateObject.Stopped);
	data.Paused = this.setStateObject(this.StateObject.Paused);
	data.Buffering = this.setStateObject(this.StateObject.Buffering);

	data.encoding = this.formatEncodingObject([]);
	data.condition = this.formatConditionObject([]);
	data.error = this.formatErrorObject([]);

	//non objects fields
	this.formatStartuptime(data);

	this.firstAccess = false;

	return data;
};

//type 1
CSQoE.prototype.formatterNewState = function(metric) {
	var data = {};

	data.type = 1;
	
	if(this.firstAccess) {
		data.session = this.formatSessionObject([]); // only id, playerid, browserid, repeatMode, repeatCount	
	} else {
		data.session = this.formatSessionObject(['playerid', 'browserid', 'uri', 'provider', 'repeatMode', 'repeatCount']); // only id
	}

	data.state = this.formatStateObject([]);
	data.Playing = this.formatPlayingObject([]);
	data.Buffering = this.formatBufferingObject([]);
	data.Paused = this.formatPausedObject([]);
	data.Stopped = this.formatStoppedObject([]);
	data.Seeking = this.formatSeekingObject([]);
	
	this.updateFormatterState(data, true, metric);
	
	//just keep the last state metric
	this.database.deleteMetrics('state');
	//action metrics are not used in CsQoE, delete them from database
	this.database.deleteMetrics('action');
	
	data.Playing = this.setStateObject(this.StateObject.Playing);
	data.Seeking = this.setStateObject(this.StateObject.Seeking);
	data.Stopped = this.setStateObject(this.StateObject.Stopped);
	data.Paused = this.setStateObject(this.StateObject.Paused);
	data.Buffering = this.setStateObject(this.StateObject.Buffering);

	data.encoding = this.formatEncodingObject([]);
	data.condition = this.formatConditionObject([]);
	data.error = this.formatErrorObject(['code']); //only count

	//non objects fields
	this.formatStartuptime(data);

	this.firstAccess = false;

	return data;
};

//type 2
CSQoE.prototype.formatterMetadata = function() {
	var data = {};

	data.type = 2;

	if(this.firstAccess) {
		data.session = this.formatSessionObject([]);
	} else {
		data.session = this.formatSessionObject(['playerid', 'browserid', 'uri', 'provider', 'repeatMode', 'repeatCount']); // only id	
	}

	data.metadata = this.formatMetadataObject([]);

	this.firstAccess = false;

	return data;
};

//type 3
CSQoE.prototype.formatterChangeBitrate = function() {
	var data = {};

	data.type = 3;

	if(this.firstAccess) {
		data.session = this.formatSessionObject([]); // only id, playerid, browserid, repeatMode, repeatCount
	} else {
		data.session = this.formatSessionObject(['playerid', 'browserid', 'uri', 'provider', 'repeatMode', 'repeatCount']); // only id
	}

	data.state = this.formatStateObject(['previous', 'previoustime', 'progress']); // only current, detail
	data.encoding = this.formatEncodingObject([]);
	data.condition = this.formatConditionObject([]);
	
	//player has changed his current encoding metric, we can delete old ones
	this.database.deleteMetrics('encoding');

	this.firstAccess = false;

	return data;
};

//type 10
CSQoE.prototype.formatterError = function() {
	var data = {};

	data.type = 10;

	if(this.firstAccess) {
		data.session = this.formatSessionObject([]);
	} else {
		data.session = this.formatSessionObject(['playerid', 'browserid', 'uri', 'provider', 'repeatMode', 'repeatCount']); // only id	
	}

	data.state = this.formatStateObject([]);

	switch(data.state.current) {
		case "Playing":
			data.Playing = this.formatPlayingObject([]);
			break;
		case "Buffering" :
			data.Buffering = this.formatBufferingObject([]);
			break;
		case "Paused" :
			data.Paused = this.formatPausedObject([]);
			break;
		case "Stopped" :
			data.Stopped = this.formatStoppedObject([]);
			break;
		case "Seeking" :
			data.Seeking = this.formatSeekingObject([]);
			break;
	}	

	this.updateFormatterState(data, false);

	data.Playing = this.setStateObject(this.StateObject.Playing);
	data.Seeking = this.setStateObject(this.StateObject.Seeking);
	data.Stopped = this.setStateObject(this.StateObject.Stopped);
	data.Paused = this.setStateObject(this.StateObject.Paused);
	data.Buffering = this.setStateObject(this.StateObject.Buffering);

	data.encoding = this.formatEncodingObject([]);
	data.condition = this.formatConditionObject([]);
	data.error = this.formatErrorObject([]);

	//non objects fields
	this.formatStartuptime(data);

	this.firstAccess = false;

	return data;
};

//RULES FORMAT
CSQoE.prototype.formatSessionObject = function(excludedList) {
	var session = this.database.getMetricObject('session');
	if(session === null) {
		return {};
	}

	this.data = {};
	this.excludedList = excludedList;

	this.setFieldValue('id', session.id);
	this.setFieldValue('playerid', session.playerid);
	this.setFieldValue('browserid', session.browserid);

	this.data.msgnbr = this.msgnbr;

	if(session.hasOwnProperty('uri') && !this.isExcluded('uri', this.excludedList)) {
		var parser = document.createElement('a');
        parser.href = session.uri;
		this.data.uri = (parser.pathname.charAt(0) == "/") ? parser.pathname : "/" + parser.pathname;
		this.data.dhost = parser.hostname;
	}

	this.setFieldValue('provider', session.provider);
	this.setFieldValue('repeatMode', session.loopMode);
	this.setFieldValue('repeatCount', session.loopCount);

	return this.data;
};

CSQoE.prototype.formatStateObject = function(excludedList) {

	function capitaliseFirstLetter(string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	}
	
	var state = this.database.getMetricObject('state', true);
	if(state === null) {
		return {};
	}

	this.data = {};
	this.excludedList = excludedList;

	this.setFieldValue('current', capitaliseFirstLetter(state.current));
	this.setFieldValue('detail', state.reason);
	this.setFieldValue('previous', capitaliseFirstLetter(state.previousState));
	this.setFieldValue('previoustime', state.previousTime);
	this.setFieldValue('progress', state.position);

	return this.data;

};

CSQoE.prototype.formatEncodingObject = function(excludedList) {
	var encoding = this.database.getMetricObject('encoding', true, this.isVideo),
		metadata = this.database.getMetricObject('metadata', true, this.isVideo);

	if(metadata === null || encoding === null) {
		return {};
	}

	this.data = {};
	this.excludedList = excludedList;

	this.setFieldValue('current', metadata.bitrates[encoding.index]);
	this.setFieldValue('min', 0);
	this.setFieldValue('max', metadata.bitrates[metadata.bitrates.length-1]);

	return this.data;
};

CSQoE.prototype.formatStartuptime = function(data) {
	var session = this.database.getMetricObject('session');

	if (session.startTime && session.startPlayingTime) {
		// Set startup time in seconds and round to 3 decimals
		data.startuptime = Math.round(session.startPlayingTime - session.startTime) / 1000;
	}
};

CSQoE.prototype.formatConditionObject = function(excludedList) {
	var condition = this.database.getMetricObject('condition');
	if(condition === null) {
		return {};
	}

	this.data = {};
	this.excludedList = excludedList;

	this.setFieldValue('fdc', condition.droppedFrames);
	this.setFieldValue('wsize', condition.windowSize);
	this.setFieldValue('full', condition.fullScreen);
	this.setFieldValue('fps', condition.fps);
	this.setFieldValue('dspeed', condition.bandwidth/1000);

	return this.data;
};

CSQoE.prototype.formatErrorObject = function(excludedList) {
	var data = {},
		metrics = this.database.getMetrics(),
		i = 0,
		len = metrics.length,
		error = null;

	if(!this.isExcluded('count', excludedList)) {
		data.count = 0;
		for (i = 0; i < len; i++) {
			if (metrics[i].hasOwnProperty('error')) {
				data.count++;
			}
		}
	}

	if(!this.isExcluded('code', excludedList)) {
		error = this.database.getMetricObject('error', true);
		if (error !== null) {
			data.code = error.code;
			data.message = error.message;
		}
	}

	return data;
};

CSQoE.prototype.formatMetadataObject = function(excludedList) {
	var session = this.database.getMetricObject('session'),
		metadata = this.database.getMetricObject('metadata', false, this.isVideo),
		contentType;

	this.data = {};
	this.excludedList = excludedList;
	
	this.setFieldValue('playertype', session.playerType);

	if(metadata === null) {
		return this.data;
	}

	if(metadata.hasOwnProperty('duration')) {
		if(metadata.duration < 0) {
			contentType = 'LIVE';
		} else {
			contentType = 'VOD';
		}
	}

	this.setFieldValue('videoid', metadata.id);
	this.setFieldValue('encodingbr', metadata.bitrates);
	this.setFieldValue('contenttype', contentType);
	this.setFieldValue('contentduration', metadata.duration);
	this.setFieldValue('encodingformat', metadata.codec);
	this.setFieldValue('encapsulation', metadata.format);

	return this.data;

};
//RULES FORMAT END