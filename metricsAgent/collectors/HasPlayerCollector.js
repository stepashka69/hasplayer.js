/*
 * The copyright in this software module is being made available under the BSD License, included below. This software module may be subject to other third party and/or contributor rights, including patent rights, and no such rights are granted under this license.
 * The whole software resulting from the execution of this software module together with its external dependent software modules from dash.js project may be subject to Orange and/or other third party rights, including patent rights, and no such rights are granted under this license.
 * 
 * Copyright (c) 2014, Orange
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 * •  Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 * •  Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 * •  Neither the name of the Orange nor the names of its contributors may be used to endorse or promote products derived from this software module without specific prior written permission.
 * 
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS “AS IS” AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
function HasPlayerCollector (player, database) {
	this.player = player;
	this.database = database;
	this.sessionId = null;
	this.playerId = String(Math.random()).substring(2);
	this.previousVideoBandwith = null;
	this.previousAudioBandwith = null;
}

HasPlayerCollector.prototype.init = function(sessionId) {
	this.sessionId = sessionId;
};

HasPlayerCollector.prototype.metricAddedListener = function(metric) {
	if(this.sessionId === null) {
		return;
	}
    var objStorage = {};

    switch (metric.data.metric) {
		case  "RepresentationSwitch" :
				metric.data.bandwith = this.customMetricsExtension.getBandwidthForRepresentation(metric.data.value.to);
				metric.data.codec = this.customMetricsExtension.getCodecsForRepresentation(metric.data.value.to);
				metric.data.index = this.customMetricsExtension.getIndexForRepresentation(metric.data.value.to);
				metric.data.max = this.customMetricsExtension.getMaxIndexForBufferType(metric.data.stream);
				objStorage.encoding = this.mapEncodingObject(metric.data);
				this.database.addMetric(objStorage);
				if (metric.data.stream === "video") {
					this.previousVideoBandwith = metric.data.bandwith;
				}else if (metric.data.stream === "audio") {
					this.previousAudioBandwith = metric.data.bandwith;
				}
				break;
		case "Condition" :
				objStorage.condition = this.mapConditionObject(metric.data);
				this.database.addMetric(objStorage);
				break;
		case "Error" :
				objStorage.error = this.mapErrorObject(metric.data);
				this.database.addMetric(objStorage);
				break;
		case  "PlayList" :
				objStorage.action = this.mapActionObject(metric.data);
				this.database.addMetric(objStorage);
				break;
		case  "State" :
				//store current state
				if (metric.data.stream === "video") {
					objStorage.state = this.mapStateObject(metric.data);
					this.database.addMetric(objStorage);
				}
				break;
		case "Session" :
				objStorage.session = this.mapSessionObject(metric.data);
				this.database.addMetric(objStorage);
				this.addState("stopped");
				break;
		case "ManifestReady" :
				this.addState("startup");
				this.sendMetaData("video");
				break;
		default :
				//console.log("metricAdded event from "+metric.data.metric+" metric not implemented");
    }
};

HasPlayerCollector.prototype.onError = function(error){
	var errorVo = new MetricsVo.Error();

	switch(error.error) {
		case "manifestError" :
		case "cc" :
			errorVo.message = error.event.message+" "+error.type;
			errorVo.code = error.event.id;
			break;
		case "download" :
			errorVo.message = error.error+" "+error.event.id+" "+error.type;
			if (error.event.request.status) {
				errorVo.code = error.event.request.status;
			}else{
				errorVo.chunkURL = error.event.url;
			}
			break;
		default :
			errorVo.message = error.error+" "+error.type;
			errorVo.code = error.event.code;
			break;
	}

	var objError = {};
	objError.error = errorVo;

	this.database.addMetric(objError);
};

HasPlayerCollector.prototype.metricUpdatedListener = function(metric) {
	if(this.sessionId === null) {
		return;
	}
    var objStorage = {};

    switch (metric.data.metric) {

		case "HttpRequestTrace" :
				objStorage.condition = this.mapConditionObject(metric.data);
				this.database.addMetric(objStorage);
				break;
		default :
    }
};

HasPlayerCollector.prototype.listen = function() {

    this.customMetricsExtension = this.player.getMetricsExt();

    this.player.addEventListener("metricAdded", this.metricAddedListener.bind(this));
    this.player.addEventListener("metricUpdated", this.metricUpdatedListener.bind(this));
    this.player.addEventListener("error", this.onError.bind(this));

    window.addEventListener("beforeunload", function (){
    	if(this.sessionId === null) {
			return;
		}
		//on window close event, add a stop state with reason = 0
		this.addState("stopped", 0);
		}.bind(this),false);
};

HasPlayerCollector.prototype.addState = function(state, reason) {
	var metric = {data:
		{value:
			{	current: state,
				position: this.player.getVideoModel().getCurrentTime(),
				reason: reason
			}
		}};
	var objStorage = {};
	objStorage.state = this.mapStateObject(metric.data);
	this.database.addMetric(objStorage);
};

HasPlayerCollector.prototype.sendMetaData = function(type){
	var objStorage = {};
	var metric = {data:
		{
			contentType: type,
			codec: this.customMetricsExtension.getCodecForType(type),
			duration: this.customMetricsExtension.getDuration()
	}};
	
	var bitrates = this.customMetricsExtension.getBitratesForType(type);
	var format = this.customMetricsExtension.getFormatForType(type);

	if (bitrates.length > 0) {
		metric.data.bitrates = bitrates;
	}

	//if format not defined, the current type is not defined in the manifest.
	//don't send metadata metric for this type
	if (format) {
		metric.data.format = format;
		objStorage.metadata = this.mapMetaDataObject(metric.data);
		this.database.addMetric(objStorage);
	}
};

HasPlayerCollector.prototype.mapSessionObject = function(metric) {
	var sessionVo = new MetricsVo.Session();

	sessionVo.id = this.sessionId;
	sessionVo.playerid = this.playerId;
	sessionVo.browserid = this.database.getBrowserId();
	sessionVo.userAgent = navigator.userAgent;
	sessionVo.uri = metric.value.uri;
	sessionVo.provider = document.location.href; //document.referrer;
	sessionVo.loopMode = metric.value.loopMode;
	sessionVo.startTime = new Date().getTime();
	sessionVo.endTime = metric.value.endTime;
	sessionVo.playerType = metric.value.playerType;

	return sessionVo;
};

HasPlayerCollector.prototype.mapMetaDataObject = function(metric) {
	var metaDataVo = new MetricsVo.MetaData();

	metaDataVo.bitrates = metric.bitrates;
	metaDataVo.contentType = metric.contentType;
	metaDataVo.duration = metric.duration;
	metaDataVo.format = metric.format;
	metaDataVo.codec = metric.codec;

	return metaDataVo;
};

HasPlayerCollector.prototype.mapStateObject = function(metric) {
	var stateVo = new MetricsVo.State();

	stateVo.current = metric.value.current;
	stateVo.position = metric.value.position;
	stateVo.reason = metric.value.reason;

	return stateVo;
};

HasPlayerCollector.prototype.mapConditionObject = function(metric) {
	var conditionVo = new MetricsVo.Condition();

	if(metric.stream && metric.stream === "video") {
		var httpRequest = metric.value;

		if(httpRequest.type === "Media Segment" && httpRequest.tfinish){
			var lastTrace = httpRequest.trace[httpRequest.trace.length-1] || null;
			conditionVo.bandwidth = lastTrace.b[0]*8000/ (httpRequest.tfinish.getTime() - httpRequest.trequest.getTime());
		}
		
	} else {
		conditionVo.droppedFrames = metric.value.droppedFrames;
		conditionVo.fullScreen = metric.value.isFullScreen;
		conditionVo.windowSize = metric.value.windowSize;
		conditionVo.fps = metric.value.fps;
	}

	return conditionVo;
};

HasPlayerCollector.prototype.mapErrorObject = function(metric) {
	var errorVo =  new MetricsVo.Error();

	errorVo.code = metric.value.code;
	errorVo.message = metric.value.message;

	return errorVo;
};

HasPlayerCollector.prototype.mapActionObject = function(metric) {
	var actionVo = new MetricsVo.Action();
		
	actionVo.type = metric.value.starttype;
	actionVo.position = this.player.getVideoModel().getCurrentTime();
	
	return actionVo;
};

HasPlayerCollector.prototype.mapEncodingObject = function(metric) {
	var encodingVo = new MetricsVo.Encoding();

    encodingVo.contentType = metric.stream;
    encodingVo.id = metric.value.to;
    encodingVo.codec = metric.codec;
    encodingVo.index = metric.index;
    encodingVo.bitrate = metric.bandwith;
    encodingVo.position = metric.value.mt;

    if (metric.stream === "video") {
		encodingVo.previousBitrate = this.previousVideoBandwith;
	}else if (metric.stream === "audio") {
		encodingVo.previousBitrate = this.previousAudioBandwith;
	}

    return encodingVo;
};
