/**
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
 * @constructs OrangeHasPlayer
 *
 */
/*jshint -W020 */
OrangeHasPlayer = function() {

    ///////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////// PRIVATE ////////////////////////////////////////////
    var context,
        mediaPlayer,
        debug,
        video,
        isFullScreen = false,
        isSubtitleVisible = true,
        audioTracks = [],
        subtitleTracks = [],
        videoQualityChanged = [],
        audioQualityChanged = [],
        videoBitrates = null,
        audioBitrates = null,
        videoDownloadedBdthValue,
        audioDownloadedBdthValue,
        defaultAudioLang = 'und',
        defaultSubtitleLang = 'und',
        selectedAudioTrack = null,
        selectedSubtitleTrack = null,
        metricsAgent = {
            ref: null,
            deferInit : null,
            isActivated: false
        },
        initialQuality = {
            video: -1,
            audio: -1
        },

        debugData ={
            isInDebug:false,
            level:0,
            loggerType:'console'
        },
        state = 'UNINITIALIZED';

    var _isPlayerInitialized = function() {
        if (state === 'UNINITIALIZED') {
            throw new Error('OrangeHasPlayer.hasMediaSourceExtension(): Must not be in UNINITIALIZED state');
        }
    };

    var _onloaded = function( /*e*/ ) {
        debug.log("[OrangeHasPlayer] loadeddata");
        this.getAudioTracks();
        this.getSubtitleTracks();
        this.getSelectedAudioTrack();
        this.getSelectedSubtitleTrack();
        if (video.textTracks.length > 0) {
            video.textTracks[0].mode = (isSubtitleVisible === true) ? 'showing' : 'hidden';
        }
    };

    var _handleKeyPressedEvent = function(e) {
        // if we press ctrl + alt + maj + z we activate debug mode
        if ((e.altKey === true) && (e.ctrlKey === true) && (e.shiftKey === true) &&
            ((e.keyCode === 68) || (e.keyCode === 90))) {
            if (debugData.isInDebug) {
                debugData.isInDebug = false;
                console.log("debug mode desactivated");
                _isPlayerInitialized();
                if ((e.keyCode === 90)) {
                    _downloadDebug(mediaPlayer.getDebug().getLogger().getLogs());
                }
                mediaPlayer.getDebug().setLevel(debugData.level);
                mediaPlayer.getDebug().setLogger(debugData.loggerType);
            } else {
                debugData.isInDebug = true;
                console.log("debug mode activated");
                _isPlayerInitialized();
                debugData.level =  mediaPlayer.getDebug().getLevel();
                mediaPlayer.getDebug().setLevel((e.keyCode === 68) ? 4 : 3);
                mediaPlayer.getDebug().setLogger((e.keyCode === 68) ? 'console' : 'memory');
            }
        }
    };

    var _downloadDebug = function(array) {
        if (array && array.length > 0) {
            var filename = 'hasplayer_logs.txt',
                data = JSON.stringify(array, null, '\r\n'),
                blob = new Blob([data], {type: 'text/json'});

            if (navigator.msSaveBlob) { // For IE10+ and edge
                navigator.msSaveBlob(blob,filename);
            } else {
                var e    = document.createEvent('MouseEvents'),
                    a    = document.createElement('a');
                a.download = filename;
                a.href = window.URL.createObjectURL(blob);
                a.dataset.downloadurl =  ['text/json', a.download, a.href].join(':');
                e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
                a.dispatchEvent(e);
            }
        }
    };

    var _dispatchBitrateEvent = function(type, value) {
        var event = document.createEvent("CustomEvent");
        event.initCustomEvent(type, false, false, {
            type: value.streamType,
            bitrate: value.switchedQuality,
            representationId: value.representationId,
            time: video.currentTime,
            width: value.width,
            height: value.height
        });
        video.dispatchEvent(event);
    };

    var _cleanStreamTab = function(streamTab, idToRemove){
        var i = 0;

        for (i = idToRemove.length - 1; i >= 0; i--) {
            streamTab.splice(i, 1);
        }
    };

    var _detectPlayBitrateChange = function(streamTab) {
        var currentTime = video.currentTime,
            currentSwitch = null,
            idToRemove = [],
            i = 0;

        for (i = 0; i < streamTab.length; i += 1) {
            currentSwitch = streamTab[i];
            if (currentTime >= currentSwitch.mediaStartTime) {
                _dispatchBitrateEvent('play_bitrate', currentSwitch);
                debug.log("[OrangeHasPlayer]["+currentSwitch.streamType+"] send play_bitrate - b=" + currentSwitch.switchedQuality + ", t="+currentSwitch.mediaStartTime + "(" + video.playbackRate + ")");
                // And remove when it's played
                idToRemove.push(i);
            }
        }

        _cleanStreamTab(streamTab, idToRemove);
    };

    var _onTimeupdate = function() {
        // If not in playing state, then do not send 'play_bitrate' events, wait for 'loadeddata' event first
        if (video.playbackRate === 0) {
            return;
        }
        // Check for video playing quality change
        _detectPlayBitrateChange(videoQualityChanged);
        // Check for audio playing quality change
        _detectPlayBitrateChange(audioQualityChanged);
    };

    var _metricAdded = function(e) {
        var metricsExt = mediaPlayer.getMetricsExt(),
            event;

        switch (e.data.metric) {
            case "ManifestReady":
                _isPlayerInitialized();
                debug.log("[OrangeHasPlayer] ManifestReady");
                videoBitrates = metricsExt.getBitratesForType('video');
                debug.log("[OrangeHasPlayer] video bitrates: " + JSON.stringify(videoBitrates));
                break;
            case "RepresentationSwitch":
                _isPlayerInitialized();
                if (e.data.stream == "video") {
                    videoBitrates = metricsExt.getBitratesForType(e.data.stream);
                    _dispatchBitrateEvent('download_bitrate', {
                        streamType: e.data.stream,
                        switchedQuality: videoBitrates[e.data.value.lto],
                        representationId: e.data.value.to,
                        width: metricsExt.getVideoWidthForRepresentation(e.data.value.to),
                        height: metricsExt.getVideoHeightForRepresentation(e.data.value.to)
                    });
                    debug.log("[OrangeHasPlayer]["+e.data.stream+"] send download_bitrate - b="+videoBitrates[e.data.value.lto]);
                } else if (e.data.stream == "audio") {
                    audioBitrates = metricsExt.getBitratesForType(e.data.stream);
                    _dispatchBitrateEvent('download_bitrate', {
                        streamType: e.data.stream,
                        switchedQuality: audioBitrates[e.data.value.to],
                        representationId: e.data.value.to,
                        width: metricsExt.getVideoWidthForRepresentation(e.data.value.to),
                        height: metricsExt.getVideoHeightForRepresentation(e.data.value.to)
                    });
                    debug.log("[OrangeHasPlayer]["+e.data.stream+"] send download_bitrate - b="+videoBitrates[e.data.value.lto]);
                }
                break;
            case "BufferedSwitch" :
                _isPlayerInitialized();
                if (e.data.stream == "video") {
                    videoQualityChanged.push({
                                streamType: e.data.stream,
                                mediaStartTime: e.data.value.mt,
                                switchedQuality: videoBitrates[e.data.value.lto],
                                representationId: e.data.value.to,
                                width: metricsExt.getVideoWidthForRepresentation(e.data.value.to),
                                height: metricsExt.getVideoHeightForRepresentation(e.data.value.to)
                    });
                } else if (e.data.stream == "audio") {
                    audioQualityChanged.push({
                                 streamType: e.data.stream,
                                mediaStartTime: e.data.value.mt,
                                switchedQuality: audioBitrates[e.data.value.lto],
                                representationId: e.data.value.to,
                                width: metricsExt.getVideoWidthForRepresentation(e.data.value.to),
                                height: metricsExt.getVideoHeightForRepresentation(e.data.value.to)
                    });
                }
                break;
            case "BufferLevel" :
                //debug.log("[OrangeHasPlayer] BufferLevel = "+e.data.value.level+" for type = "+e.data.stream);
                event = document.createEvent("CustomEvent");
                event.initCustomEvent('bufferLevel_updated', false, false, {
                    type: e.data.stream,
                    level: e.data.value.level.toFixed(3)
                });
                video.dispatchEvent(event);
                break;
            case "State" :
                //debug.log("[OrangeHasPlayer] State = "+e.data.value.current+" for type = "+e.data.stream);
                event = document.createEvent("CustomEvent");
                event.initCustomEvent('state_changed', false, false, {
                    type: e.data.stream,
                    state: e.data.value.current
                });
                video.dispatchEvent(event);
                break;
        }
    };

    ///////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////// PUBLIC /////////////////////////////////////////////

    /////////// INITIALIZATION

    /**
     * Initialize the player.
     * @method init
     * @access public
     * @memberof OrangeHasPlayer#
     * @param {Object} videoElement - the HTML5 video element used to decode and render the media data
     */
    this.init = function(videoElement) {
        if (!videoElement) {
            throw new Error('OrangeHasPlayer.init(): Invalid Argument');
        }

        context = new MediaPlayer.di.Context();
        mediaPlayer = new MediaPlayer(context);
        video = videoElement;
        mediaPlayer.startup();
        mediaPlayer.attachView(video);
        state = 'PLAYER_CREATED';

        debug = mediaPlayer.getDebug();

        this.addEventListener("loadeddata", _onloaded.bind(this));
        mediaPlayer.addEventListener("metricAdded", _metricAdded);
        video.addEventListener("timeupdate", _onTimeupdate);
        window.addEventListener("keydown",_handleKeyPressedEvent);
    };

    /**
     * Returns the version of the player.
     * @method getVersion
     * @access public
     * @memberof OrangeHasPlayer#
     * @return {string} the version of the player
     */
    this.getVersion = function() {
        _isPlayerInitialized();
        return mediaPlayer.getVersion();
    };

    /**
     * Returns the full version of the player (including git tag)
     * @method getVersionFull
     * @access public
     * @memberof OrangeHasPlayer#
     * @return {string} the version of the player including git tag
     */
    this.getVersionFull = function() {
        _isPlayerInitialized();
        return mediaPlayer.getVersionFull();
    };

    /**
     * Returns the build date of this player.
     * @method getBuildDate
     * @access public
     * @memberof OrangeHasPlayer#
     * @return {string} the build date of this player
     */
    this.getBuildDate = function() {
        _isPlayerInitialized();
        return mediaPlayer.getBuildDate();
    };

    /**
     * Loads and initializes the metrics agent.
     * @method loadMetricsAgent
     * @access public
     * @memberof OrangeHasPlayer#
     * @param {json} parameters - the metrics agent parameters
     * @param {String} parameters.name - the metrics agent name
     * @param {String} parameters.activationUrl - the activation url
     * @param {String} parameters.serverUrl - the collecter url
     * @param {String} parameters.dbServerUrl - the inside events database server (for debug purpose)
     * @param {String} parameters.collector - the collector type ('HasPlayer')
     * @param {String} parameters.formatter - the formatter type ('CSQoE' or 'PRISME')
     * @param {Integer} parameters.sendingTime - the periodic delay (in milliseconds) for sending events to collector
     */
    this.loadMetricsAgent = function(parameters) {
        _isPlayerInitialized();

        if (typeof(MetricsAgent) !== 'undefined') {
            metricsAgent.ref = new MetricsAgent(mediaPlayer, video, parameters, mediaPlayer.getDebug());

            metricsAgent.deferInit = Q.defer();
            metricsAgent.ref.init(function(activated) {
                debug.log("Metrics agent state: ", activated);
                metricsAgent.isActivated = activated;
                metricsAgent.deferInit.resolve();
            });
        } else {
            throw new Error('OrangeHasPlayer.loadMetricsAgent(): MetricsAgent is undefined');
        }
    };

    /////////// PLAYBACK

    /**
     * Load/open a video stream.
     * @method load
     * @access public
     * @memberof OrangeHasPlayer#
     * @param {string} url - the video stream's manifest (MPEG DASH, Smooth Streaming or HLS) url
     * @param {json} protData - information about protection, with the following syntax:
        <pre>
        {
            "[key_system_name]": {
                laURL: "[licenser url (optionnal)]",
                pssh: "[base64 pssh box (optionnal)]"
                cdmData: "[custom data (optionnal)]"
            },
            ...
        };
        </pre>
     */
    this.load = function(url, protData) {
        var self = this,
            config = {
            video: {
                "ABR.keepBandwidthCondition": true
            },
            audio: {
                "ABR.keepBandwidthCondition": true
            }
        };

        audioTracks = [];
        subtitleTracks = [];

        videoDownloadedBdthValue = undefined;
        audioDownloadedBdthValue = undefined;
        videoQualityChanged = [];
        audioQualityChanged = [];

        _isPlayerInitialized();

        // Reset the player
        self.reset(0);

        // Set initial quality if first stream
        if (initialQuality.video >= 0) {
            mediaPlayer.setQualityFor('video', initialQuality.video);
            config.video["ABR.keepBandwidthCondition"] = false;
            initialQuality.video = -1;
        }

        if (initialQuality.audio >= 0) {
            mediaPlayer.setQualityFor('audio', initialQuality.audio);
            config.audio["ABR.keepBandwidthCondition"] = false;
            initialQuality.audio = -1;
        }

        // Wait for MetricsAgent completely intialized before starting a new session
        Q.when(metricsAgent.ref ? metricsAgent.deferInit.promise : true).then(function() {

            if (metricsAgent.ref && metricsAgent.isActivated && url) {
                metricsAgent.ref.createSession();
            }

            // Set config to set 'keepBandwidthCondition' parameter
            mediaPlayer.setConfig(config);

            //init default audio language
            mediaPlayer.setDefaultAudioLang(defaultAudioLang);
            //init default subtitle language
            mediaPlayer.setDefaultSubtitleLang(defaultSubtitleLang);

            mediaPlayer.attachSource(url, protData);
            if (mediaPlayer.getAutoPlay()) {
                state = 'PLAYER_RUNNING';
            }
        });
    };

    /**
     * refresh manifest url
     * @method refeshManifest
     * @access public
     * @memberof OrangeHasPlayer#
     * param {string} url - the video stream's manifest (MPEG DASH, Smooth Streaming or HLS) url
     */
    this.refreshManifest = function(url){
        _isPlayerInitialized();
        mediaPlayer.refreshManifest(url);
    };
    /**
     * Plays/resumes playback of the media.
     * @method play
     * @access public
     * @memberof OrangeHasPlayer#
     */
    this.play = function() {
        _isPlayerInitialized();

        video.play();

        state = 'PLAYER_RUNNING';
    };

    /**
     * Seeks the media to the new time. For LIVE streams, this function can be used to perform seeks within the DVR window if available.
     * @method seek
     * @access public
     * @memberof OrangeHasPlayer#
     * @param {number} time - the new time value in seconds
     */
    this.seek = function(time) {
        _isPlayerInitialized();

        if (typeof time !== 'number') {
            throw new Error('OrangeHasPlayer.seek(): Invalid Arguments');
        }

        if (!this.isLive() && time >= 0 && time <= video.duration) {
            video.currentTime = time;
        }

        if (this.isLive()) {
            throw new Error('OrangeHasPlayer.seek(): impossible for live stream');
        }

        if (time < 0 || time > video.duration) {
            throw new Error('OrangeHasPlayer.seek(): seek value not correct');
        }
    };

    /**
     * Pauses the media playback.
     * @method pause
     * @access public
     * @memberof OrangeHasPlayer#
     */
    this.pause = function() {
        _isPlayerInitialized();
        if (!this.isLive()) {
            state = "PLAYER_PAUSED";
            video.pause();
        } else {
            throw new Error('OrangeHasPlayer.pause(): pause is impossible on live stream');
        }
    };

    /**
     * Stops the media playback and seek back to start of stream and media. Subsequently call to play() method will restart streaming and playing from beginning.
     * @method stop
     * @access public
     * @memberof OrangeHasPlayer#
     */
    this.stop = function() {
        _isPlayerInitialized();
        state = "PLAYER_STOPPED";
        video.pause();
        //test if player is in VOD mode
        if (!this.isLive()) {
            video.currentTime = 0;
        }

        if (metricsAgent.ref) {
            metricsAgent.ref.stop();
        }
    };

    /**
     * Resets the player. HasPlayer data : stop downloading chunks elements, current url and protection data values set to null.
     * @method reset
     * @access public
     * @memberof OrangeHasPlayer#
     * @param {number} reason - 0 : a stop during streaming (ex: browser has been closed), 1 : a stop because all the stream has been watched and 2 : a stop, after an error. 
     */
    this.reset = function(reason) {
        _isPlayerInitialized();
        mediaPlayer.setQualityFor('video', 0);
        mediaPlayer.setQualityFor('audio', 0);
        mediaPlayer.reset(reason);
        if (metricsAgent.ref) {
            metricsAgent.ref.stop();
        }
    };

    /**
     * Returns the current playback time in seconds.
     * @method getPosition
     * @access public
     * @memberof OrangeHasPlayer#
     * @return {number} the current playback time in seconds
     */
    this.getPosition = function() {
        _isPlayerInitialized();
        if (!this.isLive()) {
            return video.currentTime;
        } else {
            return undefined;
        }
    };

    /////////// STREAM METADATA

    /**
     * Returns true if the current stream is a live stream.
     * @method isLive
     * @access public
     * @memberof OrangeHasPlayer#
     * @return {boolean} true if current stream is a live stream, false otherwise
     */
    this.isLive = function() {
        _isPlayerInitialized();
        return video.duration !== Number.POSITIVE_INFINITY ? false : true;
    };

    /**
     * Returns the media duration.
     * @method getDuration
     * @access public
     * @memberof OrangeHasPlayer#
     * @return {number} the media duration in seconds, <i>Infinity</i> for live content
     */
    this.getDuration = function() {
        _isPlayerInitialized();
        return video.duration;
    };

    /**
     * Returns the list of available bitrates (as specified in the stream manifest).
     * @method getVideoBitrates
     * @access public
     * @memberof OrangeHasPlayer#
     * @return {Array} array of bitrate values
     */
    this.getVideoBitrates = function() {
        _isPlayerInitialized();
        return videoBitrates;
    };

    /////////// EVENTS

    /**
     * Registers a listener on the specified event.
     * @method addEventListener
     * @access public
     * @memberof OrangeHasPlayer#
     * @param {string} type - the event type for listen to, either any HTML video element event or player event
     * ('play_bitrate', 'download_bitrate', 'error' or 'subtitlesStyleChanged') events.
     * For play_bitrate and download_bitrate events, callback parameter contains, in detail attribute, those values :
     * <pre>
     *  type: stream type (audio or video),
     *  bitrate: new bitrate,
     *  representationId: id for the stream representation,
     *  time: video currentTime value,
     *  width: video width for video stream, undefined otherwise,
     *  height: video height for video stream, undefined otherwise
     * </pre>
     * @param {callback} listener - the callback which is called when an event of the specified type occurs
     * @param {boolean} useCapture - @see HTML DOM addEventListener() method documentation
     */
    this.addEventListener = function(type, listener, useCapture) {
        switch (type) {
            case "error":
            case "subtitlesStyleChanged":
            case "manifestUrlUpdate":
                mediaPlayer.addEventListener(type, listener, useCapture);
                break;
            case "play_bitrate":
            case "download_bitrate":
            case "bufferLevel_updated":
            case "state_changed":
                video.addEventListener(type, listener, useCapture);
                break;
            default:
                video.addEventListener(type, listener, useCapture);
        }
    };

    /**
     * Unregisters the listener previously registered with the addEventListener() method.
     * @method removeEventListener
     * @access public
     * @memberof OrangeHasPlayer#
     * @see [addEventListener]{@link OrangeHasPlayer#addEventListener}
     * @param {string} type - the event type on which the listener was registered
     * @param {callback} listener - the callback which was registered to the event type
     */
    this.removeEventListener = function(type, listener) {
        switch (type) {
            case "error":
            case "subtitlesStyleChanged":
                mediaPlayer.removeEventListener(type, listener);
                break;
            case "play_bitrate":
            case "download_bitrate":
            case "bufferLevel_updated":
            case "state_changed":
                video.removeEventListener(type, listener);
                break;
            default:
                video.removeEventListener(type, listener);
        }
    };

    /////////// AUDIO TRACKS

    /**
     * Sets the default audio language. If the default language is available in the stream,
     * the corresponding audio track is selected. Otherwise, the first declared audio track is selected.
     * @method setDefaultAudioLang
     * @access public
     * @memberof OrangeHasPlayer#
     * @param {string} lang - the default audio language based on ISO 3166-2
     */
    this.setDefaultAudioLang = function(lang) {
        if (typeof lang !== 'string') {
            throw new Error('OrangeHasPlayer.setDefaultAudioLang(): Invalid Arguments');
        }
        defaultAudioLang = lang;
    };

    /**
     * Returns the list of audio tracks contained in the stream (as specified in the stream manifest).
     * The audio tracks list can be retrieved once the 'loadeddata' event has been raised.
     * @method getAudioTracks
     * @access public
     * @see [addEventListener]{@link OrangeHasPlayer#addEventListener}
     * @memberof OrangeHasPlayer#
     * @return {Array} the audio tracks list as an array of objects with the following syntax:
       <pre>
        {
            "id": "[the track id]",
            "lang": "[the track language]"
        };
        </pre>
     */
    this.getAudioTracks = function() {
        var i = 0,
            mediaPlayerAudioTracks;

        _isPlayerInitialized();

        if (audioTracks.length === 0) {

            mediaPlayerAudioTracks = mediaPlayer.getAudioTracks();

            if (mediaPlayerAudioTracks) {
                for (i = 0; i < mediaPlayerAudioTracks.length; i++) {
                    audioTracks.push({
                        id: mediaPlayerAudioTracks[i].id,
                        lang: mediaPlayerAudioTracks[i].lang
                    });
                }
            }
        }

        return audioTracks;
    };

    /**
     * Selects the audio track to be playbacked.
     * @method setAudioTrack
     * @access public
     * @memberof OrangeHasPlayer#
     * @see [getAudioTracks]{@link OrangeHasPlayer#getAudioTracks}
     * @param {string} audioTrack - the audio track object, as returned by the getAudioTracks() method
     */
    this.setAudioTrack = function(audioTrack) {
        var i = 0,
            mediaPlayerAudioTracks;

        _isPlayerInitialized();

        if (!audioTrack || !(audioTrack.id || audioTrack.lang)) {
            throw new Error('OrangeHasPlayer.setAudioTrack(): audioTrack parameter is unknown');
        }

        if (selectedAudioTrack && ((audioTrack.id === selectedAudioTrack.id) ||
            (audioTrack.lang === selectedAudioTrack.lang))) {
            debug.log("[OrangeHasPlayer] " + audioTrack.lang + " is already selected");
            return;
        }

        mediaPlayerAudioTracks = mediaPlayer.getAudioTracks();

        if (mediaPlayerAudioTracks) {
            for (i = 0; i < mediaPlayerAudioTracks.length; i++) {
                if ((audioTrack.id === mediaPlayerAudioTracks[i].id) ||
                    (audioTrack.lang === mediaPlayerAudioTracks[i].lang)) {
                    mediaPlayer.setAudioTrack(mediaPlayerAudioTracks[i]);
                    selectedAudioTrack = mediaPlayerAudioTracks[i];
                    return;
                }
            }
        }

        throw new Error('OrangeHasPlayer.setAudioTrack():' + audioTrack.lang + 'is unknown');
    };

    /**
     * Returns the selected audio track.
     * @method getSelectedAudioTrack
     * @access public
     * @memberof OrangeHasPlayer#
     * @return {Object} the selected audio track as an object with the syntax as specified in [getAudioTracks]{@link OrangeHasPlayer#getAudioTracks}
     */
    this.getSelectedAudioTrack = function() {
        var i = 0,
            selectedTrack;

        _isPlayerInitialized();

        selectedTrack = mediaPlayer.getSelectedAudioTrack();

        if (selectedTrack) {
            for (i = 0; i < audioTracks.length; i++) {
                if (audioTracks[i].id === selectedTrack.id ||
                    audioTracks[i].lang === selectedTrack.lang) {
                    selectedAudioTrack = audioTracks[i];
                    return selectedAudioTrack;
                }
            }
        }
        return null;
    };

    /////////// SUBTITLE TRACKS

    /**
     * Sets the default subtitle language. If the default language is available in the stream,
     * the corresponding audio track is selected. Otherwise, the first declared subtitle track is selected.
     * @method setDefaultSubtitleLang
     * @access public
     * @memberof OrangeHasPlayer#
     * @param {string} lang - the default subtitle language based on ISO 3166-2
     */
    this.setDefaultSubtitleLang = function(lang) {
        if (typeof lang !== 'string') {
            throw new Error('OrangeHasPlayer.setDefaultSubtitleLang(): Invalid Arguments');
        }
        defaultSubtitleLang = lang;
    };

    /**
     * Returns the list of subtitle tracks contained in the stream (as specified in the stream manifest).
     * The subtitle tracks list can be retrieved once the 'loadeddata' event has been raised.
     * @method getSubtitleTracks
     * @access public
     * @see [addEventListener]{@link OrangeHasPlayer#addEventListener}
     * @memberof OrangeHasPlayer#
     * @return {Array} the subtitle tracks list as an array of objects with the following syntax:
       <pre>
        {
            "id": "[the track id]",
            "lang": "[the track language]"
        };
        </pre>
     */
    this.getSubtitleTracks = function() {
        var i = 0,
            mediaPlayerSubtitleTracks;

        _isPlayerInitialized();

        if (subtitleTracks.length === 0) {

            mediaPlayerSubtitleTracks = mediaPlayer.getSubtitleTracks();

            if (mediaPlayerSubtitleTracks) {
                for (i = 0; i < mediaPlayerSubtitleTracks.length; i++) {
                    subtitleTracks.push({
                        id: mediaPlayerSubtitleTracks[i].id,
                        lang: mediaPlayerSubtitleTracks[i].lang
                    });
                }
            }
        }

        return subtitleTracks;
    };

    /**
     * Selects the subtitle track to be playbacked.
     * @method setSubtitleTrack
     * @access public
     * @memberof OrangeHasPlayer#
     * @see [getSubtitleTracks]{@link OrangeHasPlayer#getSubtitleTracks}
     * @param {string} subtitleTrack - the subtitle track object, as returned by the getSubtitleTracks() method
     */
    this.setSubtitleTrack = function(subtitleTrack) {
        var i = 0,
            mediaPlayerSubtitleTracks;

        if (!subtitleTrack || !(subtitleTrack.id || subtitleTrack.lang)) {
            throw new Error('OrangeHasPlayer.setSubtitleTrack(): subtitleTrack parameter is unknown');
        }

        if (selectedSubtitleTrack && ((subtitleTrack.id === selectedSubtitleTrack.id) ||
            (subtitleTrack.lang === selectedSubtitleTrack.lang))) {
            debug.log("[OrangeHasPlayer] " + subtitleTrack.lang + " is already selected");
            return;
        }

        _isPlayerInitialized();

        mediaPlayerSubtitleTracks = mediaPlayer.getSubtitleTracks();

        if (mediaPlayerSubtitleTracks) {
            for (i = 0; i < mediaPlayerSubtitleTracks.length; i++) {
                if ((subtitleTrack.id === mediaPlayerSubtitleTracks[i].id) ||
                    (subtitleTrack.lang === mediaPlayerSubtitleTracks[i].lang)) {
                    mediaPlayer.setSubtitleTrack(mediaPlayerSubtitleTracks[i]);
                    selectedSubtitleTrack = mediaPlayerSubtitleTracks[i];
                    return;
                }
            }
        }

        throw new Error('OrangeHasPlayer.setSubtitleTrack():' + subtitleTrack.lang + 'is unknown');
    };

    /**
     * Returns the selected subtitle track.
     * @method getSelectedSubtitleTrack
     * @access public
     * @memberof OrangeHasPlayer#
     * @return {Object} the selected subtitle track as an object with the syntax as specified in [getSubtitleTracks]{@link OrangeHasPlayer#getSubtitleTracks}
     */
    this.getSelectedSubtitleTrack = function() {
        var i = 0,
            selectedTrack;

        _isPlayerInitialized();

        selectedTrack = mediaPlayer.getSelectedSubtitleTrack();

        if (selectedTrack) {
            for (i = 0; i < subtitleTracks.length; i++) {
                if (subtitleTracks[i].id === selectedTrack.id ||
                    subtitleTracks[i].lang === selectedTrack.lang) {
                    selectedSubtitleTrack = subtitleTracks[i];
                    return selectedSubtitleTrack;
                }

            }
        }
        return null;
    };

    /////////// AUDIO VOLUME

    /**
     * Returns the audio mute status.
     * @method getMute
     * @access public
     * @memberof OrangeHasPlayer#
     * @return {boolean} true if the audio is muted, false otherwise
     */
    this.getMute = function() {
        _isPlayerInitialized();
        return video.muted;
    };

    /**
     * Sets the audio mute status.
     * @method setMute
     * @access public
     * @memberof OrangeHasPlayer#
     * @param {boolean} state - true to mute audio, false otherwise
     */
    this.setMute = function(state) {
        _isPlayerInitialized();
        if (typeof state !== 'boolean') {
            throw new Error('OrangeHasPlayer.setMute(): Invalid Arguments');
        }
        video.muted = state;
    };

    /**
     * Returns the audio volume level.
     * @method getVolume
     * @access public
     * @memberof OrangeHasPlayer#
     * @return {number} the current audio volume level, from 0.0 (silent) to 1.0 (loudest)
     */
    this.getVolume = function() {
        _isPlayerInitialized();
        return video.volume;
    };

    /**
     * Sets the audio volume level.
     * @method setVolume
     * @access public
     * @memberof OrangeHasPlayer#
     * @param {number} volume - the audio volume level, from 0.0 (silent) to 1.0 (loudest)
     */
    this.setVolume = function(volume) {
        _isPlayerInitialized();
        if ((typeof volume !== 'number') || volume < 0 || volume > 1) {
            throw new Error('OrangeHasPlayer.setVolume(): Invalid Arguments');
        }

        video.volume = volume;
    };

    /////////// SUBTITLES DISPLAY

    /**
     * Sets the subtitles visibility
     * @method setSubtitleVisibility
     * @access public
     * @memberof OrangeHasPlayer#
     * @param {boolean} value - true to show subtitles, false to hide subtitles
     */
    this.setSubtitleVisibility = function(value) {
        _isPlayerInitialized();
        if (typeof value !== 'boolean') {
            throw new Error('OrangeHasPlayer.setSubtitleVisibility(): Invalid Arguments');
        }

        isSubtitleVisible = value;

        if (video.textTracks.length === 0) {
            return;
        }

        video.textTracks[0].mode = (value === true) ? 'showing' : 'hidden';
    };

    /**
     * Returns the subtitles visibility state.
     * @method getSubtitleVisibility
     * @access public
     * @memberof OrangeHasPlayer#
     * @return {boolean} true if subtitles are shown, false if they are hidden
     */
    this.getSubtitleVisibility = function() {
        _isPlayerInitialized();

        return isSubtitleVisible;
    };


    /////////// ADVANCED CONFIGURATION

    /**
     * Sets the initial quality to be downloaded for the given track type.
     * This method has to be used before each call to load() method to set the initial quality.
     * Otherwise, the initial quality is set according to previous bandwidth condition.
     * @access public
     * @memberof OrangeHasPlayer#
     * @see [setConfig]{@link OrangeHasPlayer#setConfig} to set quality boundaries
     * @param {string} type - the track type ('video' or 'audio')
     * @param  {number} value - the new initial quality index (starting from 0) to be downloaded
     */
    this.setInitialQualityFor = function(type, value) {
        initialQuality[type] = value;
    };

    /**
     * Sets some parameters values.
     * @method setParams
     * @access public
     * @memberof OrangeHasPlayer#
     * @param {json} params - a json object containing parameters values to set.
     * @param {number} params.BufferController.minBufferTimeForPlaying - Minimum buffer level before playing, in seconds (default value = 0)
     * @param {number} params.BufferController.minBufferTime - Minimum buffer size, in seconds (default value = 16)
     * @param {number} params.ABR.minBandwidth - Minimum bandwidth to be playbacked (default value = -1)
     * @param {number} params.ABR.maxBandwidth - Maximum bandwidth to be playbacked (default value = -1)
     * @param {number} params.ABR.minQuality - Minimum quality index (start from 0) to be playbacked (default value = -1)
     * @param {number} params.ABR.maxQuality - Maximum quality index (start from 0) to be playbacked (default value = -1)
     * @param {boolean} params.ABR.switchUpIncrementally - Switch up quality incrementally, or not (default value = false)
     * @param {number} params.ABR.switchUpRatioSafetyFactor - Switch up bandwith ratio safety factor (default value = 1.5)
     * @param {boolean} params.ABR.latencyInBandwidth - Include (or not) latency in bandwidth (default value = true)
     * @param {number} params.ABR.switchLowerBufferTime - Buffer level (in seconds) under which switching down to lowest quality occurs (default value = -1)
     * @param {number} params.ABR.switchLowerBufferRatio - Buffer level (as percentage of buffer size) under which switching down to lowest quality occurs (default value = 0.25)
     * @param {number} params.ABR.switchDownBufferTime - Buffer level (in seconds) under which switching down quality occur, if unsufficient bandwidth (default value = -1)
     * @param {number} params.ABR.switchDownBufferRatio - Buffer level (as percentage of buffer size) under which switching down quality occurs, if unsufficient bandwidth (default value = 0.5)
     * @param {number} params.ABR.switchUpBufferTime - Buffer level (in seconds) upper which switching up quality occurs, if sufficient bandwidth (default value = -1)
     * @param {number} params.ABR.switchUpBufferRatio - Buffer level (as percentage of buffer size) upper which switching up quality occurs, if sufficient bandwidth (default value = 0.75)
     * @param {json} params.video - Video parameters (parameters can be overriden specifically for video track)
     * @param {json} params.audio - audio parameters (parameters can be overriden specifically for audio track)
     */
    this.setParams = function(params) {
        _isPlayerInitialized();
        mediaPlayer.setConfig(params);
    };

    /**
     * Enables or disables debug information in the browser console.
     * @method setDebug
     * @access public
     * @memberof OrangeHasPlayer#
     * @param {boolean} value - true to enable debug information, false to disable
     */
    this.setDebug = function(value) {
        _isPlayerInitialized();
        if (typeof value !== 'boolean') {
            throw new Error('OrangeHasPlayer.setDebug(): Invalid Arguments');
        }
        if (value === true) {
            debugData.level = 4;
            mediaPlayer.getDebug().setLevel(4);
        } else {
            debugData.level = 0;
            mediaPlayer.getDebug().setLevel(0);
        }
    };

    /**
     * Notifies the player that HTML video container element has been resized.
     * @method fullscreenChanged
     * @access public
     * @memberof OrangeHasPlayer#
     * @param {boolean} true if the HTML video container element has been resized to full screen, false otherwise
     */
    this.fullscreenChanged = function(value) {
        isFullScreen = !isFullScreen;
    };

};

/**
 * Returns the current browser status on MSE support.
 * @method hasMediaSourceExtension
 * @static
 * @return true if MSE is supported, false otherwise
 */
OrangeHasPlayer.hasMediaSourceExtension = function() {
    return new MediaPlayer.utils.Capabilities().supportsMediaSource();
};

/**
 * Returns the current browser status on EME support.
 * @method hasMediaKeysExtension
 * @static
 * @return true if EME is supported, false otherwise
 */
OrangeHasPlayer.hasMediaKeysExtension = function() {
    return new MediaPlayer.utils.Capabilities().supportsMediaKeys();
};
