function EventParameter(event) {
	this.param = [];
	this.enable = false;
	
	if (event) {
		this.enable = true;
		for (var i = 0; i < event.length; i++) {
			this.param.push(parseInt(event[i]));
		}
	}
}

function EventTypeFilter() {
	this.error = null;
	this.profil = null;
	this.usage = null;
}

EventTypeFilter.prototype.setFilter = function(type,eventParameter) {
	this[type] = eventParameter;
};

function Prisme (database, eventsObjectFilter, eventTypeSessionFilter, eventTypeRealTimeFilter) {
	this.database = database;
	
	this.eventTypeSessionFilter = this.parseEventsFilter(eventTypeSessionFilter);
	this.eventTypeRealTimeFilter = this.parseEventsFilter(eventTypeRealTimeFilter);

	this.currentBitrate = 0;
}

Prisme.prototype.parseEventsFilter = function(eventsFilter){
	var eventTypeFilter = new EventTypeFilter();
	//parse units events => error, usage and profil
	var events = eventsFilter.split(';');

	var parsedElements = [];
	//parse for each unit events, numbers of elements to return (n first, and m last)
	for (var i = 0; i < events.length; i++) {
		var tabTemp = events[i].split(',');
		parsedElements[tabTemp[0]] = [];
		for (var j = 1; j < tabTemp.length; j++) {
				parsedElements[tabTemp[0]].push(tabTemp[j]);
		}
	}

	//set, for each type filter, the different parameters : enable, n first and m last elements.
    eventTypeFilter.setFilter('error',new EventParameter(parsedElements['error']));
	eventTypeFilter.setFilter('profil',new EventParameter(parsedElements['profil']));
	eventTypeFilter.setFilter('usage',new EventParameter(parsedElements['usage']));

	return eventTypeFilter;
};

Prisme.prototype.init = function() {
	this.firstAccess = true;
	this.msgnbr = 0;
};

Prisme.prototype.generateSessionId = function() {
	return new Date().getTime()+"-"+String(Math.random()).substring(2);
};

Prisme.prototype.getMessageType = function(metric) {

	var type = -1;
	
	if (metric.hasOwnProperty('session')) {
		type = this.MESSAGE_SESSION;
	}/*error is defined in eventTypeRealTimeFilter ? error type code also defined?*/
	else if ((metric.hasOwnProperty('error') && (this.eventTypeRealTimeFilter.error != undefined && this.eventTypeRealTimeFilter.error.param[0] === metric.value.code)))
	{
		type = this.MESSAGE_REAL_TIME_ERROR;
	}/*use is defined in eventTypeRealTimeFilter ? */
	else if ((metric.hasOwnProperty('action') && (this.eventTypeRealTimeFilter.usage != undefined))){
		type = this.MESSAGE_REAL_TIME_USE;
	}/*profil is defined in eventTypeRealTimeFilter ?*/
	else if ((metric.hasOwnProperty('encoding') && (this.eventTypeRealTimeFilter.profil != undefined))){
		type = this.MESSAGE_REAL_TIME_PROFIL;
	}
	
	return type;
};

Prisme.prototype.process = function(type) {
	var formattedData = null;

	switch (type) {
		case 0:
			formattedData = this.formatterRecurring();
			break;
		case 1:
			formattedData = this.formatterRealTimeError();
			break;
		case 2:
			formattedData = this.formatterRealTimeProfil();
			break;
		case 3:
			formattedData = this.formatterRealTimeUse();
			break;
		case 4:
			formattedData = this.formatterSession();
			break;
	}

	this.msgnbr++;

	return formattedData;
};

//type 0
Prisme.prototype.formatterRecurring = function() {

	//même traitement que session si besoin => uniquement en LIVE
	/*var data = {};

	data.type = 0;

	if(this.firstAccess) {
		data.session = this.formatSessionObject([]);
	} else {
		data.session = this.formatSessionObject([]);
	}
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

	return data;*/
};

//type 1
Prisme.prototype.formatterRealTimeError = function() {
	var data = [];

	data.push(new Date().getTime());
	data.push('has/realtime/error/');

	this.data = {};

	this.formatSessionObject(['playerId', 'browserid', 'uuid']);

	//Add error info in realTimeErrorObj
	this.formatErrorObject([]);

	data.push(this.data);

	return data;
};

//type 2
Prisme.prototype.formatterRealTimeProfil = function() {
	var data = [];

	data.push(new Date().getTime());
	data.push('has/realtime/profil/');

	this.data = {};

	this.formatSessionObject(['playerId', 'browserid', 'uuid']);

	//Add encoding info in realTimeProfilObj
	this.formatEncodingObject([]);

	data.push(this.data);

	return data;
};

//type 3
Prisme.prototype.formatterRealTimeUse = function() {
	var data = [];

	data.push(new Date().getTime());
	data.push('has/realtime/use/');

	this.data = {};

	this.formatSessionObject(['playerId', 'browserid', 'uuid']);

	//Add action info in realTimeUseObj
	this.formatActionObject([]);

	data.push(this.data);

	return data;
};

//type 4
Prisme.prototype.formatterSession = function() {
	var data = [];

	data.push(new Date().getTime());
	data.push('has/session/');
	
	var sessionObj = {};

	sessionObj = this.formatSessionObject([]);
	sessionObj.events = [];
	sessionObj.events.usage = [];
	sessionObj.events.error = [];
	sessionObj.events.profil = [];

	sessionObj.counts = [];
	sessionObj.counts.error = [];
	sessionObj.counts.profil = [];
	//sessionObj.counts.playing = [];
	//sessionObj.counts.buffering = [];
	//sessionObj.counts.seeking = [];
	//sessionObj.counts.paused = [];
	
	var firstElts = this.database.getMetricsObjects('action',false,this.eventTypeSessionFilter['usage'].param[0]);
	var lastElts = this.database.getMetricsObjects('action',true,this.eventTypeSessionFilter['usage'].param[1]);
	if (firstElts.length >0) {
		sessionObj.events['usage'].push(firstElts);
	}

	if (lastElts.length >0) {
		sessionObj.events['usage'].push(lastElts);
	}

	firstElts = this.database.getMetricsObjects('error',false,this.eventTypeSessionFilter['error'].param[0]);
	lastElts = this.database.getMetricsObjects('error',true,this.eventTypeSessionFilter['error'].param[1]);
	if (firstElts.length >0) {
		sessionObj.events['error'].push(firstElts);
	}

	if (lastElts.length >0) {
		sessionObj.events['error'].push(lastElts);
	}
	
	firstElts = this.database.getMetricsObjects('encoding',false,this.eventTypeSessionFilter['profil'].param[0]);
	lastElts = this.database.getMetricsObjects('encoding',true,this.eventTypeSessionFilter['profil'].param[1]);
	if (firstElts.length >0) {
		sessionObj.events['profil'].push(firstElts);
	}

	if (lastElts.length >0) {
		sessionObj.events['profil'].push(lastElts);
	}

	//add Counts content.

	data.push(sessionObj);

	return data;
};

Prisme.prototype.setFieldValue = function(nameDst, value) {
	if (value !== undefined && value !== null && value !== '' && !this.isExcluded(nameDst, this.excludedList)) {
		// Round numbers to 3 decimals
		if ((typeof value == "number") && isFinite(value) && (value % 1 !== 0)) {
			value = Math.round(value * 1000) / 1000;
		}
		this.data[nameDst] = value;
	}
};

//RULES FORMAT
Prisme.prototype.formatSessionObject = function(excludedList) {
	
	if(!this.database) {
		return {};
	}

	var session = this.database.getMetricObject('session');
	if(session === null) {
		return {};
	}

	this.data = {};
	this.excludedList = excludedList;

	this.setFieldValue('sessionId', session.id);
	this.setFieldValue('playerId', session.playerid);
	this.setFieldValue('uuid', "undefined");
	this.setFieldValue('url', session.uri);
	this.setFieldValue('userAgent', session.userAgent);
	this.setFieldValue('contentId', "undefined");

	if (this.firstAccess === true) {
		this.data.status = "OK";
		this.firstAccess = false;
	}
	//this.setFieldValue('contentDuration', session.);
	//this.setFieldValue('watchStartDate', "undefined");
	//this.setFieldValue('watchEndDate', "undefined");
	//this.setFieldValue('maxPosition', "undefined");

	return this.data;
};

Prisme.prototype.formatPlayingObject = function() {
	if(!this.database) {
		return {};
	}

	var Playing = this.database.getCountState('playing');
	return Playing;
};

Prisme.prototype.formatBufferingObject = function() {
	if(!this.database) {
		return {};
	}

	var Buffering = this.database.getCountState('buffering');
	return Buffering;
};

Prisme.prototype.formatPausedObject = function() {
	if(!this.database) {
		return {};
	}

	var Paused = this.database.getCountState('paused');
	return Paused;
};

Prisme.prototype.formatStoppedObject = function() {
	if(!this.database) {
		return {};
	}
	var Paused = this.database.getCountState('stopped');
	return Paused;
};

Prisme.prototype.formatSeekingObject = function() {
	if(!this.database) {
		return {};
	}

	var Seeking = this.database.getCountState('seeking');
	return Seeking;
};

Prisme.prototype.formatStateObject = function(excludedList) {

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

Prisme.prototype.formatEncodingObject = function(excludedList) {

	var isVideo = function(metric) {
		return (metric.contentType === 'video');
	};

	if(!this.database) {
		return {};
	}

	var encoding = this.database.getMetricObject('encoding', true, isVideo);

	if(encoding === null) {
		return {};
	}

	this.excludedList = excludedList;

	this.setFieldValue('originBitrate', this.currentBitrate);
	this.setFieldValue('changeBitrate', encoding.bitrate);
	this.setFieldValue('position',encoding.position);

	this.currentBitrate = encoding.bitrate;
};

Prisme.prototype.formatActionObject = function(excludedList){
	
	if(!this.database) {
		return {};
	}

	var action = this.database.getMetricObject('action', true),
		prismeTypeCode = -1;

	if(action === null) {
		return {};
	}

	this.excludedList = excludedList;

	switch (action.type) {
		case "seek":
			prismeTypeCode = this.USE_SEEK;
			break;
		case "play":
			prismeTypeCode = this.USE_PLAY;
			break;
		case "pause":
			prismeTypeCode = this.USE_PAUSE;
			break;
		case "initial_start":
			prismeTypeCode = this.USE_PLAY;
			break;
	}

	this.setFieldValue('typeCode', prismeTypeCode);
	//Fast forward and fast backward are not possible in the player
	//this.setFieldValue('addInfos', undefined);
	this.setFieldValue('position', action.position);
};

Prisme.prototype.formatStartuptime = function(data) {
	if(!this.database) {
		return {};
	}

	var session = this.database.getMetricObject('session');

	if (session.startTime && session.startPlayingTime) {
		// Set startup time in seconds and round to 3 decimals
		data.startuptime = Math.round(session.startPlayingTime - session.startTime) / 1000;
	}
};

Prisme.prototype.formatConditionObject = function(excludedList) {
	
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

Prisme.prototype.formatErrorObject = function(excludedList) {

	if(!this.database) {
		return {};
	}

	var error = this.database.getMetricObject('error', true);

	if(error === null) {
		return {};
	}

	this.excludedList = excludedList;

	this.setFieldValue('orangeErrorCode', undefined);
	this.setFieldValue('chunkURL', undefined);
	this.setFieldValue('errorCode', error.code);
	this.setFieldValue('comment', error.message);

	this.currentBitrate = encoding.bitrate;

	/*var data = {},
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

	return data;*/
};

Prisme.prototype.formatMetadataObject = function(excludedList) {

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

Prisme.prototype.isExcluded = function(value, array) {
	return array.indexOf(value) > -1;
};

Prisme.prototype.MESSAGE_PERIODIC = 0;
Prisme.prototype.MESSAGE_REAL_TIME_ERROR = 1;
Prisme.prototype.MESSAGE_REAL_TIME_PROFIL = 2;
Prisme.prototype.MESSAGE_REAL_TIME_USE = 3;
Prisme.prototype.MESSAGE_SESSION = 4;

Prisme.prototype.ORANGE_STREAM_BROKEN_ERROR = 10;
Prisme.prototype.ORANGE_HTTP_ERROR = 20;
Prisme.prototype.ORANGE_STALLED_STREAM_ERROR = 30;
Prisme.prototype.ORANGE_DRM_OR_DECODER_ERROR = 40;
Prisme.prototype.ORANGE_UNDEFINED_PLAYER_ERROR = 99;
Prisme.prototype.ORANGE_DEVICE_CRASH_ERROR = 100;

Prisme.prototype.USE_PLAY = 1;
Prisme.prototype.USE_PAUSE = 2;
Prisme.prototype.USE_STOP = 3;
Prisme.prototype.USE_FAST_FORWARD = 4;
Prisme.prototype.USE_FAST_BACKWARD = 5;
Prisme.prototype.USE_SEEK = 6;
