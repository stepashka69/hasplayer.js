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
	AbstractFormatter.call(this,database);
	
	this.eventTypeSessionFilter = this.parseEventsFilter(eventTypeSessionFilter);
	this.eventTypeRealTimeFilter = this.parseEventsFilter(eventTypeRealTimeFilter);
}

Prisme.prototype = Object.create(AbstractFormatter.prototype);
Prisme.prototype.constructor = Prisme;

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
    eventTypeFilter.setFilter('error',new EventParameter(parsedElements.error));
	eventTypeFilter.setFilter('profil',new EventParameter(parsedElements.profil));
	eventTypeFilter.setFilter('usage',new EventParameter(parsedElements.usage));

	return eventTypeFilter;
};

Prisme.prototype.init = function() {
	AbstractFormatter.prototype.init.call(this);
	this.duration = 0;
};

Prisme.prototype.generateSessionId = function() {
	return AbstractFormatter.prototype.generateSessionId.call(this, '-');
};

Prisme.prototype.process = function(metric) {
	var formattedData = null;

	if(!this.database) {
		return formattedData;
	}

	if (!metric) {
		formattedData = this.formatterRecurring();
	} else {
		if (metric.hasOwnProperty('metadata') && metric.metadata.duration !== undefined) {
			this.duration = metric.metadata.duration;
		}
		if (metric.hasOwnProperty('session')) {
			formattedData = this.formatterSession();
		}// error is defined in eventTypeRealTimeFilter ? error type code also defined?
		else if ((metric.hasOwnProperty('error') && (this.eventTypeRealTimeFilter.error !== undefined && this.eventTypeRealTimeFilter.error.param[0] === metric.value.code)))
		{
			formattedData = this.formatterRealTime('has/realtime/error/');
		}//use is defined in eventTypeRealTimeFilter ?
		else if ((metric.hasOwnProperty('action') && (this.eventTypeRealTimeFilter.usage !== undefined))){
			formattedData = this.formatterRealTime('has/realtime/use/');
		}// profil is defined in eventTypeRealTimeFilter ?
		else if ((metric.hasOwnProperty('encoding') && (this.eventTypeRealTimeFilter.profil !== undefined))){
			formattedData = this.formatterRealTime('has/realtime/profil/');
		}else if (metric.hasOwnProperty('state') && this.firstAccess === false) {
			if (metric.state.current === 'stopped' && metric.state.reason === 0) {
				formattedData = this.formatterSession();
			}//For Prisme, stalled state is an error
			else if (metric.state.current === 'buffering') {
				formattedData = this.formatterRealTime('has/realtime/error/','buffering');
			}
		}
	}

	if (formattedData) {
		this.msgnbr++;
	}

	return formattedData;
};

//type 0
Prisme.prototype.formatterRecurring = function() {
	if (this.duration >= 0) {
		return null;
	}else {	//send Session event, it's a LIVE content
		return this.formatterSession();
	}
};

//type 1, 2 and 3
Prisme.prototype.formatterRealTime = function(realTimeName, param) {
	var data = [];

	data.push(new Date().getTime());
	data.push(realTimeName);

	var realTimeObj = {},
		realTimeTempObj = {};

	realTimeObj = this.formatSessionObject(['playerId', 'browserid', 'uuid']);

	switch(realTimeName) {
		case 'has/realtime/use/' :
			//Add action info in realTimeUseObj
			realTimeTempObj = this.formatLastActionObject([]);
			break;
		case 'has/realtime/profil/': 
			//Add encoding info in realTimeProfilObj
			realTimeTempObj = this.formatLastEncodingObject([]);
			break;
		case 'has/realtime/error/' :
			//Add error info in realTimeErrorObj
			if (param && param === 'buffering') {
				//send an error object with orangeCode = 30
				var state = this.database.getMetricObject('state', true);
				if(state === null) {
					return {};
				}
				var errorVo =  new MetricsVo.Error();

				errorVo.code = 0;
				errorVo.message = 'buffering state';
				errorVo.position = state.position;

				realTimeTempObj = this.formatErrorObject([],errorVo);
			}else{
				realTimeTempObj = this.formatLastErrorObject([]);
			}
			realTimeTempObj.Condition = this.formatTheConditionObject([]);
			break;
	}
	
	for (var attrname in realTimeTempObj) { 
		realTimeObj[attrname] = realTimeTempObj[attrname]; 
	}
	
	realTimeObj.Playing = this.formatPlayingObject([]);
	realTimeObj.Buffering = this.formatBufferingObject([]);
	realTimeObj.Seeking = this.formatSeekingObject([]);
	realTimeObj.Paused = this.formatPausedObject([]);

	realTimeObj.State = this.formatStateObject();

	realTimeObj.msgnbr = this.msgnbr;
	
	data.push(realTimeObj);

	return data;
};

//type 4
Prisme.prototype.formatterSession = function() {
	var data = [];

	data.push(new Date().getTime());
	data.push('has/session/');
	
	var sessionObj = {};

	sessionObj = this.formatSessionObject([]);
	sessionObj.MetaData = this.formatMetadataObject([]);
	sessionObj.events = {};
	sessionObj.events.usage = [];
	sessionObj.events.error = [];
	sessionObj.events.profil = [];

	sessionObj.events.profil = this.formatMetricsList('encoding',this.eventTypeSessionFilter.profil.param[0],this.eventTypeSessionFilter.profil.param[1],this.isVideo);
	sessionObj.events.usage = this.formatMetricsList('action',this.eventTypeSessionFilter.usage.param[0],this.eventTypeSessionFilter.usage.param[1]);
	sessionObj.events.error = this.formatMetricsList('error',this.eventTypeSessionFilter.error.param[0],this.eventTypeSessionFilter.error.param[1]);

	sessionObj.counts = {};
	sessionObj.counts.error = [];
	sessionObj.counts.profil = [];
	
	//add Counts content.
	sessionObj.counts.playing = this.formatPlayingObject([]);
	sessionObj.counts.buffering = this.formatBufferingObject([]);
	sessionObj.counts.seeking = this.formatSeekingObject([]);
	sessionObj.counts.paused = this.formatPausedObject([]);
	sessionObj.counts.profil = this.getCountsMetricTypeObject('encoding','bitrate',['originBitrate','position'],this.isVideo);
	sessionObj.counts.error = this.getCountsMetricTypeObject('error','orangeErrorCode',['chunkURL','errorCode','comment']);

	data.push(sessionObj);

	return data;
};

Prisme.prototype.formatMetricsList = function (metricType, nbFirstElts, nbLastElts, condition) {
	var tab = [],
		elts = this.database.getMetricsObjects(metricType,nbFirstElts,nbLastElts,condition),
		i = 0;
	
	if (elts.length >0) {
		for (i = 0; i < elts.length; i++) {
			if (metricType === 'encoding') {
				tab.push(this.formatEncodingObject([],elts[i][metricType]));
			}else{
				return [];
			}
		}
	}

	return tab;
};

Prisme.prototype.getCountsMetricTypeObject = function (metricType, paramRef, excludedList, condition) {
	var elts = this.database.getMetricsObjects(metricType,undefined,undefined,condition);
	return this.formatMetricCounts(excludedList,elts,metricType,paramRef);
};

//RULES FORMAT
Prisme.prototype.formatSessionObject = function(excludedList) {
	var session = this.database.getMetricObject('session');
	if(session === null) {
		return {};
	}

	this.data = {};
	this.excludedList = excludedList;

	this.setFieldValue('clientSessionId', session.id);
	this.setFieldValue('playerId', session.playerid);
	this.setFieldValue('uuid', undefined);
	this.setFieldValue('url', session.uri);
	this.setFieldValue('userAgent', session.userAgent);
	this.setFieldValue('contentId', undefined);
	this.setFieldValue('minBitrate', session.minBitrate);
	this.setFieldValue('maxBitrate', session.maxBitrate);
	this.setFieldValue('startLaunchDate', session.startTime);
	this.setFieldValue('startBufferingDate', session.startBufferingTime);
	this.setFieldValue('watchStartDate', session.startPlayingTime);
	//TBD uuid, contentName, maxPosition, listBitrate, httpBitrate
	//this.setFieldValue('maxPosition', "undefined");

	if (this.firstAccess === true) {
		this.data.status = 'OK';
		this.firstAccess = false;
	}

	var metadata = this.database.getMetricObject('metadata', true, this.isVideo);
	if(metadata === null) {
		return this.data;
	}

	this.setFieldValue('contentDuration', metadata.duration);

	return this.data;
};

Prisme.prototype.formatStateObject = function() {

	function capitaliseFirstLetter(string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	}
	
	var state = this.database.getMetricObject('state', true);
	if(state === null) {
		return {};
	}

	this.data = {};

	this.data.current = capitaliseFirstLetter(state.current);
	this.data.detail = state.reason;
	this.data.previous = capitaliseFirstLetter(state.previousState);
	this.data.previoustime = state.previousTime;

	return this.data;
};

Prisme.prototype.formatEncodingObject = function(excludedList, encoding) {
	this.excludedList = excludedList;

	this.data = {};

	this.setFieldValue('originBitrate', encoding.previousBitrate);
	this.setFieldValue('changeBitrate', encoding.bitrate);
	this.setFieldValue('position',encoding.position);

	return this.data;
};

Prisme.prototype.formatMetricCounts = function (excludedList, metricsList, metricType, paramRef) {
	var	i = 0,
		j = 0,
		len = metricsList.length,
		profiltab = [],
		paramTreated,
		alreadyTreatedParam = [],
		nbChange = 0,
		metric = null;
	
	//analyse all bitrate changed
	for(i = 0; i < len; i++) {
		metric = metricsList[i][metricType];
		paramTreated = metric[paramRef];
		nbChange = 1;
		//test to know if this param has already been treated
		if (alreadyTreatedParam[paramTreated] === undefined) {
			//search if this param has been memorized later during the video viewing
			for (j = i+1; j < len; j++) {
				if (metricsList[j][metricType][paramRef] === paramTreated) {
					nbChange++;
				}
			}
			this.setFieldValue('nb', nbChange);

			if (metricType === 'encoding') {
				profiltab.push(this.formatEncodingObject(excludedList,metric));
			}else if (metricType === 'error') {
				profiltab.push(this.formatErrorObject(excludedList,metric));
			} else{
				return {};
			}

			//keep in memory, we have already summaryse this param
			alreadyTreatedParam[paramTreated] = true;
		}
	}	

	return profiltab;
};

Prisme.prototype.formatLastEncodingObject = function(excludedList) {
	var encoding = this.database.getMetricObject('encoding', true, this.isVideo);

	if(encoding === null) {
		return {};
	}
	
	return this.formatEncodingObject(excludedList, encoding);
};

Prisme.prototype.formatActionObject = function(excludedList, action){
	var prismeTypeCode = -1;

	this.data = {};

	this.excludedList = excludedList;

	switch (action.type) {
		case 'seek':
			prismeTypeCode = this.USE_SEEK;
			break;
		case 'play':
			prismeTypeCode = this.USE_PLAY;
			break;
		case 'pause':
			prismeTypeCode = this.USE_PAUSE;
			break;
		case 'initial_start':
			prismeTypeCode = this.USE_PLAY;
			break;
	}

	this.setFieldValue('typeCode', prismeTypeCode);
	//Fast forward and fast backward are not possible in the player
	//this.setFieldValue('addInfos', undefined);
	this.setFieldValue('position', action.position);

	return this.data;
};

Prisme.prototype.formatLastActionObject = function(excludedList){
	var action = this.database.getMetricObject('action', true);

	if(action === null) {
		return {};
	}

	return this.formatActionObject(excludedList, action);
};

Prisme.prototype.formatTheConditionObject = function(excludedList){
	var condition = this.database.getMetricObject('condition');

	if(condition === null) {
		return {};
	}
	
	return this.formatConditionObject(excludedList,condition);
};

Prisme.prototype.formatConditionObject = function(excludedList, condition) {
	this.data = {};

	this.excludedList = excludedList;

	this.setFieldValue('fdc', condition.droppedFrames);
	this.setFieldValue('wsize', condition.windowSize);
	this.setFieldValue('full', condition.fullScreen);
	this.setFieldValue('fps', condition.fps);
	this.setFieldValue('dspeed', condition.bandwidth/1000);

	return this.data;
};

Prisme.prototype.formatErrorObject = function(excludedList, error) {
	this.data = {};

	this.excludedList = excludedList;

	switch (error.code) {
		case 22 :
			this.setFieldValue('orangeErrorCode', this.ORANGE_UNDEFINED_PLAYER_ERROR);
			break;
		case 0 :
			this.setFieldValue('orangeErrorCode', this.ORANGE_STALLED_STREAM_ERROR);
			break;
		default:
			this.setFieldValue('orangeErrorCode', this.ORANGE_UNDEFINED_PLAYER_ERROR);
			break;
	}

	this.setFieldValue('chunkURL', undefined);
	this.setFieldValue('position', error.position);
	this.setFieldValue('errorCode', error.code);
	this.setFieldValue('comment', error.message);

	//TBD position, chunkURL, orangeErrorCode

	return this.data;
};

Prisme.prototype.formatLastErrorObject = function(excludedList) {
	var error = this.database.getMetricObject('error', true);

	if(error === null) {
		return {};
	}

	return this.formatErrorObject(excludedList,error);
};

Prisme.prototype.formatMetadataObject = function(excludedList) {
	var session = this.database.getMetricObject('session'),
		metadata = this.database.getMetricObject('metadata', false, this.isVideo),
		contentType;

	this.data = {};
	this.excludedList = excludedList;
	
	this.setFieldValue('playerType', session.playerType);

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

	this.setFieldValue('encodingBr', metadata.bitrates);
	this.setFieldValue('contentType', contentType);
	this.setFieldValue('encodingFormat', metadata.codec);
	this.setFieldValue('encapsulation', metadata.format);

	var condition = this.database.getMetricObject('condition');
	if(condition === null) {
		return this.data;
	}
	
	this.setFieldValue('fdc', condition.droppedFrames);

	//diffusionMode
	//encodingFr

	return this.data;
};
//RULES FORMAT END
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