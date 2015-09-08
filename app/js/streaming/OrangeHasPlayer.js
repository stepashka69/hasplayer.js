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
        video,
        isFullScreen = false,
        isSubtitleVisible = true,
        audiotracks = [],
        subtitletracks = [],
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
            isActivated: false
        },
        initialQuality = {
            video: -1,
            audio: -1
        },
        state = 'UNINITIALIZED';

    var _isPlayerInitialized = function() {
        if (state === 'UNINITIALIZED') {
            throw new Error('OrangeHasPlayer.hasMediaSourceExtension(): Must not be in UNINITIALIZED state');
        }
    };

    var _onloaded = function( /*e*/ ) {
        if (video.textTracks.length > 0) {
            video.textTracks[0].mode = (isSubtitleVisible === true) ? 'showing' : 'hidden';
        }
    };

    var _dispatchBitrateEvent = function(type, value) {
        var event = document.createEvent("CustomEvent");
        event.initCustomEvent(type, false, false, {
            type: value.streamType,
            bitrate: value.switchedQuality,
            representationid: value.representationId,
            time: video.currentTime,
            width: value.width,
            height: value.height
        });
        video.dispatchEvent(event);
    };

    var _onUpdate = function() {
        var currentTime = video.currentTime,
            currentSwitch = null,
            i = 0;

        // Check for playing quality change
        for (i = 0; i < videoQualityChanged.length; i += 1) {
            currentSwitch = videoQualityChanged[i];
            if (currentTime >= currentSwitch.mediaStartTime) {
                _dispatchBitrateEvent('play_bitrate', currentSwitch);
                // And remove when it's played
                videoQualityChanged.splice(0, 1);
                break;
            }
        }

        // Check for playing quality change
        for (i = 0; i < audioQualityChanged.length; i += 1) {
            currentSwitch = audioQualityChanged[i];
            if (currentTime >= currentSwitch.mediaStartTime) {
                _dispatchBitrateEvent('play_bitrate', currentSwitch);
                // And remove when it's played
                audioQualityChanged.splice(0, 1);
                break;
            }
        }
    };

    var _metricChanged = function(e) {
        var metricsExt,
            repSwitch,
            httpRequests,
            httpRequest,
            metrics;

        _isPlayerInitialized();
        metricsExt = mediaPlayer.getMetricsExt();

        metrics = mediaPlayer.getMetricsFor(e.data.stream);
        if (metrics && metricsExt) {
            repSwitch = metricsExt.getCurrentRepresentationSwitch(metrics);
            httpRequests = metricsExt.getHttpRequests(metrics);
            httpRequest = (httpRequests.length > 0) ? httpRequests[httpRequests.length - 1] : null;
            
            if (e.data.stream == "video") {
                videoBitrates = metricsExt.getBitratesForType(e.data.stream);

                // case of downloaded quality change
                if ((httpRequest !== null && videoBitrates !== null) && (videoBitrates[httpRequest.quality] != videoDownloadedBdthValue) && (repSwitch !== null)) {
                    videoDownloadedBdthValue = videoBitrates[httpRequest.quality];
                    videoQualityChanged.push({
                        streamType: e.data.stream,
                        mediaStartTime: httpRequest.startTime,
                        switchedQuality: videoBitrates[httpRequest.quality],
                        downloadStartTime: httpRequest.trequest,
                        representationId: repSwitch.to,
                        width: metricsExt.getVideoWidthForRepresentation(repSwitch.to),
                        height: metricsExt.getVideoHeightForRepresentation(repSwitch.to)
                    });
                    _dispatchBitrateEvent('download_bitrate', videoQualityChanged[videoQualityChanged.length - 1]);
                }
            }else if (e.data.stream == "audio") {
                audioBitrates = metricsExt.getBitratesForType(e.data.stream);

                // case of downloaded quality change
                if ((httpRequest !== null && audioBitrates !== null) && (audioBitrates[httpRequest.quality] != audioDownloadedBdthValue) && (repSwitch !== null)) {
                    audioDownloadedBdthValue = audioBitrates[httpRequest.quality];
                    audioQualityChanged.push({
                        streamType: e.data.stream,
                        mediaStartTime: httpRequest.startTime,
                        switchedQuality: audioBitrates[httpRequest.quality],
                        downloadStartTime: httpRequest.trequest,
                        representationId: repSwitch.to,
                        width: metricsExt.getVideoWidthForRepresentation(repSwitch.to),
                        height: metricsExt.getVideoHeightForRepresentation(repSwitch.to)
                    });
                    _dispatchBitrateEvent('download_bitrate', audioQualityChanged[audioQualityChanged.length - 1]);
                }
            }
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

        this.addEventListener("loadeddata", _onloaded.bind(this));
        mediaPlayer.addEventListener("metricChanged", _metricChanged);
        video.addEventListener("timeupdate", _onUpdate);
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

            metricsAgent.ref.init(function(activated) {
                console.log("Metrics agent state: ", activated);
                metricsAgent.isActivated = activated;
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
                customData: "[custom data (optionnal)]"
            },
            ...
        };
        </pre>
     */
    this.load = function(url, protData) {
        var config = {
            video: {
                "ABR.keepBandwidthCondition": true
            },
            audio: {
                "ABR.keepBandwidthCondition": true
            }
        };

        audiotracks = [];
        subtitletracks = [];

        videoDownloadedBdthValue = undefined;
        audioDownloadedBdthValue = undefined;
        videoQualityChanged = [];
        audioQualityChanged = [];

        _isPlayerInitialized();

        this.reset(0);

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

        if (metricsAgent.ref && metricsAgent.isActivated && url) {
            metricsAgent.ref.createSession();
        }

        //init default audio language
        mediaPlayer.setDefaultAudioLang(defaultAudioLang);
        //init default subtitle language
        mediaPlayer.setDefaultSubtitleLang(defaultSubtitleLang);

        // Set config to set 'keepBandwidthCondition' parameter
        mediaPlayer.setConfig(config);

        mediaPlayer.attachSource(url, protData);
        if (mediaPlayer.getAutoPlay()) {
            state = 'PLAYER_RUNNING';
        }
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
    };

    /**
     * Resets the player. HasPlayer data : stop downloading chunks elements, current url and protection data values set to null.
     * @method reset
     * @access public
     * @memberof OrangeHasPlayer#
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
     * ('play_bitrate', 'download_bitrate', 'error' or 'subtitlesStyleChanged') events
     * @param {callback} listener - the callback which is called when an event of the specified type occurs
     * @param {boolean} useCapture - @see HTML DOM addEventListener() method documentation
     */
    this.addEventListener = function(type, listener, useCapture) {
        switch (type) {
            case "error":
            case "subtitlesStyleChanged":
                mediaPlayer.addEventListener(type, listener, useCapture);
                break;
            case "play_bitrate":
            case "download_bitrate":
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

        if (audiotracks.length === 0) {

            mediaPlayerAudioTracks = mediaPlayer.getAudioTracks();

            if (mediaPlayerAudioTracks) {
                for (i = 0; i < mediaPlayerAudioTracks.length; i++) {
                    audiotracks.push({
                        id: mediaPlayerAudioTracks[i].id,
                        lang: mediaPlayerAudioTracks[i].lang
                    });
                }
            } else {
                throw new Error('OrangeHasPlayer.getAudioTracks(): no audio tracks found');
            }
        }

        return audiotracks;
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

        mediaPlayerAudioTracks = mediaPlayer.getAudioTracks();

        if (mediaPlayerAudioTracks) {
            for (i = 0; i < mediaPlayerAudioTracks.length; i++) {
                if ((audioTrack.id === mediaPlayerAudioTracks[i].id) ||
                    (audioTrack.lang === mediaPlayerAudioTracks[i].lang)) {
                    mediaPlayer.setAudioTrack(mediaPlayerAudioTracks[i]);
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
            for (i = 0; i < audiotracks.length; i++) {
                if (audiotracks[i].id === selectedTrack.id ||
                    audiotracks[i].lang === selectedTrack.lang) {
                    selectedAudioTrack = audiotracks[i];
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

        if (subtitletracks.length === 0) {

            mediaPlayerSubtitleTracks = mediaPlayer.getSubtitleTracks();

            if (mediaPlayerSubtitleTracks) {
                for (i = 0; i < mediaPlayerSubtitleTracks.length; i++) {
                    subtitletracks.push({
                        id: mediaPlayerSubtitleTracks[i].id,
                        lang: mediaPlayerSubtitleTracks[i].lang
                    });
                }
            } else {
                throw new Error('OrangeHasPlayer.getSubtitleTracks(): no subtitle tracks found');
            }
        }

        return subtitletracks;
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

        _isPlayerInitialized();

        mediaPlayerSubtitleTracks = mediaPlayer.getSubtitleTracks();

        if (mediaPlayerSubtitleTracks) {
            for (i = 0; i < mediaPlayerSubtitleTracks.length; i++) {
                if ((subtitleTrack.id === mediaPlayerSubtitleTracks[i].id) ||
                    (subtitleTrack.lang === mediaPlayerSubtitleTracks[i].lang)) {
                    mediaPlayer.setSubtitleTrack(mediaPlayerSubtitleTracks[i]);
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

        for (i = 0; i < subtitletracks.length; i++) {
            if (subtitletracks[i].id === selectedTrack.id ||
                subtitletracks[i].lang === selectedTrack.lang) {
                selectedSubtitleTrack = subtitletracks[i];
                return selectedSubtitleTrack;
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
        if ((typeof volume !== 'number') || (volume < 0 && volume > 1)) {
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
     * @param {number} params.BufferController.minBufferTimeForPlaying - Minimum buffer level before playing, in seconds (default value = 2)
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
            mediaPlayer.getDebug().setLevel(4);
        } else {
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