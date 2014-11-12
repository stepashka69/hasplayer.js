function CSQoE () {
}

CSQoE.prototype.init = function(database) {
	this.database = database;
	this.firstAccess = true;
	this.msgnbr = 0;
};

CSQoE.prototype.getMessageType = function(metric) {

	var type = -1;
	
	if (metric.hasOwnProperty('state')) {
		if (metric.state.current === 'init') {
			type = -1;
		} else {
			type = this.MESSAGE_STATE_CHANGE;
		}
	} else if (metric.hasOwnProperty('metadata')) {
		type = this.MESSAGE_SESSION;
	} else if (metric.hasOwnProperty('encoding') && (metric.encoding.contentType === 'video')) {
		type = this.MESSAGE_BITRATE_CHANGE;
	} else if (metric.hasOwnProperty('error')) {
		type = this.MESSAGE_ERROR;
	}

	return type;
};

CSQoE.prototype.process = function(type) {
	var formattedData = null;

	switch (type) {
		case 0:
			formattedData = this.formatterRecurring();
			break;
		case 1:
			formattedData = this.formatterNewState();
			break;
		case 2:
			formattedData = this.formatterMetadata();
			break;
		case 3:
			formattedData = this.formatterChangeBitrate();
			break;
		case 10:
			formattedData = this.formatterError();
			break;
	}

	this.msgnbr++;

	return formattedData;
};

//type 0
CSQoE.prototype.formatterRecurring = function() {

	var data = {};

	data.type = 0;

	data.session = this.formatSessionObject([]);
	
	data.state = this.formatStateObject([]);
	data.Playing = this.formatPlayingObject([]);
	data.Buffering = this.formatBufferingObject([]);
	data.Paused = this.formatPausedObject([]);
	data.Stopped = this.formatStoppedObject([]);
	data.Seeking = this.formatSeekingObject([]);
	data.encoding = this.formatEncodingObject([]);
	data.condition = this.formatConditionObject([]);
	data.error = this.formatErrorObject([]);

	//non objects fields
	this.formatStartuptime(data);

	this.firstAccess = false;

	return data;
};

//type 1
CSQoE.prototype.formatterNewState = function() {
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

	data.Playing = this.formatPlayingObject([]);
	data.Buffering = this.formatBufferingObject([]);
	data.Paused = this.formatPausedObject([]);
	data.Stopped = this.formatStoppedObject([]);
	data.Seeking = this.formatSeekingObject([]);
	data.state = this.formatStateObject([]);
	data.encoding = this.formatEncodingObject([]);
	data.condition = this.formatConditionObject([]);
	data.error = this.formatErrorObject([]);

	//non objects fields
	this.formatStartuptime(data);

	this.firstAccess = false;

	return data;
};

CSQoE.prototype.setFieldValue = function(nameDst, value) {
	if (value !== undefined && value !== null && value !== '' && !this.isExcluded(nameDst, this.excludedList)) {
		// Round numbers to 3 decimals
		if ((typeof value == "number") && isFinite(value) && (value % 1 !== 0)) {
			value = Math.round(value * 1000) / 1000;
		}
		this.data[nameDst] = value;
	}
};

//RULES FORMAT
CSQoE.prototype.formatSessionObject = function(excludedList) {
	
	if(!this.database) {
		return {};
	}

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

CSQoE.prototype.formatPlayingObject = function() {
	var Playing = this.countState('playing');
	return Playing;
};

CSQoE.prototype.formatBufferingObject = function() {
	var Buffering = this.countState('buffering');
	return Buffering;
};

CSQoE.prototype.formatPausedObject = function() {
	var Paused = this.countState('paused');
	return Paused;
};

CSQoE.prototype.formatStoppedObject = function() {
	var Paused = this.countState('stopped');
	return Paused;
};

CSQoE.prototype.formatSeekingObject = function() {
	var Seeking = this.countState('seeking');
	return Seeking;
};

CSQoE.prototype.formatStateObject = function(excludedList) {

	function capitaliseFirstLetter(string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	}
	
	if(!this.database) {
		return {};
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

	var isVideo = function(metric) {
		return (metric.contentType === 'video');
	};

	if(!this.database) {
		return {};
	}

	var encoding = this.database.getMetricObject('encoding', true, isVideo),
		metadata = this.database.getMetricObject('metadata', true, isVideo);

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
	if(!this.database) {
		return {};
	}

	var session = this.database.getMetricObject('session');

	if (session.startTime && session.startPlayingTime) {
		// Set startup time in seconds and round to 3 decimals
		data.startuptime = Math.round(session.startPlayingTime - session.startTime) / 1000;
	}
};

CSQoE.prototype.formatConditionObject = function(excludedList) {
	
	if(!this.database) {
		return {};
	}

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

	if(!this.database) {
		return {};
	}

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

	var isVideo = function(metric) {
		return (metric.contentType === 'video');
	};

	if(!this.database) {
		return {};
	}

	var session = this.database.getMetricObject('session'),
		metadata = this.database.getMetricObject('metadata', false, isVideo),
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


CSQoE.prototype.countState = function(state) {
	if(!this.database) {
		return {};
	}
	
	var metrics = this.database.getMetrics(),
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

CSQoE.prototype.isExcluded = function(value, array) {
	return array.indexOf(value) > -1;
};

CSQoE.prototype.MESSAGE_PERIODIC = 0;
CSQoE.prototype.MESSAGE_STATE_CHANGE = 1;
CSQoE.prototype.MESSAGE_SESSION = 2;
CSQoE.prototype.MESSAGE_BITRATE_CHANGE = 3;
CSQoE.prototype.MESSAGE_ERROR = 10;