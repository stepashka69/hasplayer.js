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
 * @constructs MediaPlayer
 *
 */
/*jshint -W020 */
MediaPlayer = function () {

    ///////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////// PRIVATE ////////////////////////////////////////////
    var VERSION_DASHJS = "1.2.0",
        VERSION = '1.3.0_dev',
        GIT_TAG = '@@REVISION',
        BUILD_DATE = '@@TIMESTAMP',
        context = new MediaPlayer.di.Context(), // default context
        system = new dijon.System(), // dijon system instance
        initialized = false,
        debugController = null, // use to handle key pressed and download debug file
        videoModel, // model to manipulate hte domVideoNode
        videoBitrates = null, //bitrates list of video
        audioBitrates = null,
        videoQualityChanged = [],
        audioQualityChanged = [],
        error = null,
        warning = null,
        tracks = {
            video: [],
            audio: [],
            text: []
        },
        defaultAudioLang = 'und',
        defaultSubtitleLang = 'und',
        subtitlesEnabled = false,
        initialQuality = {
            video: -1,
            audio: -1
        },
        streamController = null,
        resetting = false,
        playing = false,
        autoPlay = true,
        source = null, // current source played
        scheduleWhilePaused = false, // should we buffer while in pause
        plugins = {};


    // player state and intitialization
    var _isReady = function () {
        return initialized && videoModel.getElement() && source && !resetting;
    };

    var _isPlayerInitialized = function () {
        if (!initialized) {
            throw new Error('MediaPlayer not initialized !!!');
        }
    };

    var _isVideoModelInitialized = function () {
        if (!videoModel.getElement()) {
            throw new Error('MediaPlayer.play(): Video element not attached to MediaPlayer');
        }
    };

    var _isSourceInitialized = function () {
        if (!source) {
            throw new Error('MediaPlayer.play(): Source not attached to MediaPlayer');
        }
    };

    // event connection
    var _connectEvents = function () {
        //this.addEventListener('loadedMetadata', _onloaded.bind(this));
        this.addEventListener('metricsAdded', _metricsAdded.bind(this));
        this.addEventListener('error', _onError.bind(this));
        this.addEventListener('warning', _onWarning.bind(this));
        this.addEventListener('timeupdate', _onTimeupdate.bind(this));
    };

    // event disptach
    var _dispatchBitrateEvent = function (type, value) {
        var event = document.createEvent("CustomEvent");
        event.initCustomEvent(type, false, false, {
            type: value.streamType,
            bitrate: value.switchedQuality,
            representationId: value.representationId,
            time: videoModel.getCurrentTime(),
            width: value.width,
            height: value.height
        });
        videoModel.getElement().dispatchEvent(event);
    };

    var _metricsAdded = function (e) {
        switch (e.data.metric) {
            case "ManifestReady":
                _isPlayerInitialized();
                this.debug.log("[HasPlayer] ManifestReady");
                videoBitrates = this.metricsExt.getBitratesForType('video');
                this.debug.log("[HasPlayer] video bitrates: " + JSON.stringify(videoBitrates));
                event = document.createEvent("CustomEvent");
                event.initCustomEvent('manifest_loaded', false, false, {});
                videoModel.getElement().dispatchEvent(event);
                break;
            case "RepresentationSwitch":
                _isPlayerInitialized();
                if (e.data.stream == "video") {
                    videoBitrates = this.metricsExt.getBitratesForType(e.data.stream);
                    if (videoBitrates) {
                        _dispatchBitrateEvent('download_bitrate', {
                            streamType: e.data.stream,
                            switchedQuality: videoBitrates[e.data.value.lto],
                            representationId: e.data.value.to,
                            width: this.metricsExt.getVideoWidthForRepresentation(e.data.value.to),
                            height: this.metricsExt.getVideoHeightForRepresentation(e.data.value.to)
                        });
                        this.debug.log("[HasPlayer][" + e.data.stream + "] send download_bitrate - b=" + videoBitrates[e.data.value.lto]);
                    }
                } else if (e.data.stream == "audio") {
                    audioBitrates = this.metricsExt.getBitratesForType(e.data.stream);
                    if (audioBitrates) {
                        _dispatchBitrateEvent('download_bitrate', {
                            streamType: e.data.stream,
                            switchedQuality: audioBitrates[e.data.value.to],
                            representationId: e.data.value.to,
                            width: this.metricsExt.getVideoWidthForRepresentation(e.data.value.to),
                            height: this.metricsExt.getVideoHeightForRepresentation(e.data.value.to)
                        });
                        this.debug.log("[HasPlayer][" + e.data.stream + "] send download_bitrate - b=" + videoBitrates[e.data.value.lto]);
                    }
                }
                break;
            case "BufferedSwitch":
                _isPlayerInitialized();
                if (e.data.stream == "video") {
                    videoQualityChanged.push({
                        streamType: e.data.stream,
                        mediaStartTime: e.data.value.mt,
                        switchedQuality: videoBitrates[e.data.value.lto],
                        representationId: e.data.value.to,
                        width: this.metricsExt.getVideoWidthForRepresentation(e.data.value.to),
                        height: this.metricsExt.getVideoHeightForRepresentation(e.data.value.to)
                    });
                } else if (e.data.stream == "audio") {
                    audioQualityChanged.push({
                        streamType: e.data.stream,
                        mediaStartTime: e.data.value.mt,
                        switchedQuality: audioBitrates[e.data.value.lto],
                        representationId: e.data.value.to,
                        width: this.metricsExt.getVideoWidthForRepresentation(e.data.value.to),
                        height: this.metricsExt.getVideoHeightForRepresentation(e.data.value.to)
                    });
                }
                break;
            case "BufferLevel":
                //this.debug.log("[HasPlayer] BufferLevel = "+e.data.value.level+" for type = "+e.data.stream);
                event = document.createEvent("CustomEvent");
                event.initCustomEvent('bufferLevel_updated', false, false, {
                    type: e.data.stream,
                    level: e.data.value.level
                });
                videoModel.getElement().dispatchEvent(event);
                break;
            case "State":
                //this.debug.log("[HasPlayer] State = "+e.data.value.current+" for type = "+e.data.stream);
                event = document.createEvent("CustomEvent");
                event.initCustomEvent('state_changed', false, false, {
                    type: e.data.stream,
                    state: e.data.value.current
                });
                videoModel.getElement().dispatchEvent(event);
                break;
        }
    };

    var _onError = function (e) {
        error = e.data;
    };

    var _onWarning = function (e) {
        warning = e.data;
    };

    /**
     * Usefull to dispatch event of quality changed
     */
    var _onTimeupdate = function () {
        // If not in playing state, then do not send 'play_bitrate' events, wait for 'loadeddata' event first
        if (videoModel.getPlaybackRate() === 0) {
            return;
        }
        // Check for video playing quality change
        _detectPlayBitrateChange.call(this, videoQualityChanged);
        // Check for audio playing quality change
        _detectPlayBitrateChange.call(this, audioQualityChanged);
    };

    var _detectPlayBitrateChange = function (streamTab) {
        var currentTime = videoModel.getCurrentTime(),
            currentSwitch = null,
            idToRemove = [],
            i = 0;

        for (i = 0; i < streamTab.length; i += 1) {
            currentSwitch = streamTab[i];
            if (currentTime >= currentSwitch.mediaStartTime) {
                _dispatchBitrateEvent('play_bitrate', currentSwitch);
                this.debug.log("[OrangeHasPlayer][" + currentSwitch.streamType + "] send play_bitrate - b=" + currentSwitch.switchedQuality + ", t=" + currentSwitch.mediaStartTime + "(" + videoModel.getPlaybackRate() + ")");
                // And remove when it's played
                idToRemove.push(i);
            }
        }

        _cleanStreamTab(streamTab, idToRemove);
    };

    var _cleanStreamTab = function (streamTab, idToRemove) {
        var i = 0;

        for (i = idToRemove.length - 1; i >= 0; i -= 1) {
            streamTab.splice(i, 1);
        }
    };


    /// Private playback functions ///
    var _resetAndPlay = function () {
        if (playing && streamController) {
            if (!resetting) {
                resetting = true;

                var teardownComplete = {};
                teardownComplete[MediaPlayer.dependencies.StreamController.eventList.ENAME_TEARDOWN_COMPLETE] = (function () {

                    // Finish rest of shutdown process
                    streamController = null;
                    playing = false;

                    resetting = false;

                    this.debug.log("[MediaPlayer] Player is stopped");

                    if (_isReady.call(this)) {
                        _doAutoPlay.call(this);
                    }
                }).bind(this);
                streamController.subscribe(MediaPlayer.dependencies.StreamController.eventList.ENAME_TEARDOWN_COMPLETE, teardownComplete, undefined, true);
                streamController.reset();
            }
        } else {
            if (_isReady.call(this)) {
                _doAutoPlay.call(this);
            }
        }
    };

    var _doAutoPlay = function () {
        if (_isReady()) {
            _play.call(this);
        }
    };

    var _play = function () {
        _isPlayerInitialized();
        _isVideoModelInitialized();
        _isSourceInitialized();

        if (!MediaPlayer.hasMediaSourceExtension()) {
            this.errHandler.sendError(MediaPlayer.dependencies.ErrorHandler.prototype.CAPABILITY_ERR_MEDIASOURCE, "MediaSource extension not supported by the browser");
            return;
        }

        playing = true;

        // streamController Initialization
        if (!streamController) {
            streamController = system.getObject('streamController');
            streamController.setVideoModel(videoModel);
            streamController.setAutoPlay(autoPlay);
        }

        streamController.setDefaultAudioLang(defaultAudioLang);
        streamController.setDefaultSubtitleLang(defaultSubtitleLang);
        streamController.enableSubtitles(subtitlesEnabled);
        // TODO restart here !!!
        streamController.load(source.url, source.protData);
        system.mapValue("scheduleWhilePaused", scheduleWhilePaused);
        system.mapOutlet("scheduleWhilePaused", "stream");

    };

    // TODO : remove this when migration of method getTracks will be done on all the process
    var getTracksFromType = function (_type) {
        switch (_type) {
            case MediaPlayer.TRACKS_TYPE.AUDIO:
                return streamController.getAudioTracks();
            case MediaPlayer.TRACKS_TYPE.TEXT:
                return streamController.getSubtitleTracks();
        }
    };

    var getSelectedTrackFromType = function (_type) {
        if (!streamController) {
            return null;
        }
        switch (_type) {
            case MediaPlayer.TRACKS_TYPE.AUDIO:
                return streamController.getSelectedAudioTrack();
            case MediaPlayer.TRACKS_TYPE.TEXT:
                return streamController.getSelectedSubtitleTrack();
        }
    };


    // parse the arguments of load function to make an object
    var _parseLoadArguments = function () {
        if (arguments && arguments.length > 0) {
            var params = {};
            // restaure url
            if (typeof arguments[0] === 'string') {
                params.url = arguments[0];
            }
            //restaure protData
            if (arguments[1]) {
                params.protData = arguments[1];
            }
            return params;
        }

    };
    // END TODO

    // DIJON initialization
    system.mapValue('system', system);
    system.mapOutlet('system');
    system.injectInto(context);

    return {
        ///////////////////////////////////////////////////////////////////////////////////////////////
        ////////////////////////////////////////// PUBLIC /////////////////////////////////////////////
        notifier: undefined,
        debug: undefined,
        eventBus: undefined,
        metricsExt: undefined,
        abrController: undefined,
        metricsModel: undefined,
        errHandler: undefined,
        config: undefined,

        /////////// VERSION

        /**
         * Returns the version of the player.
         * @method getVersion
         * @access public
         * @memberof MediaPlayer#
         * @return {string} the version of the player
         */
        getVersion: function () {
            return VERSION;
        },

        /**
         * Returns the full version of the player (including git tag).
         * @method getVersionFull
         * @access public
         * @memberof MediaPlayer#
         * @return {string} the version of the player including git tag
         */
        getVersionFull: function () {
            if (GIT_TAG.indexOf("@@") === -1) {
                return VERSION + '_' + GIT_TAG;
            } else {
                return VERSION;
            }
        },

        /**
         * get the HAS version
         * @access public
         * @memberof MediaPlayer#
         * @return hasplayer version
         */
        getVersionDashJS: function () {
            return VERSION_DASHJS;
        },

        /**
        * @access public
        * @memberof MediaPlayer#
        * @return date when the hasplayer has been built.
        */
        getBuildDate: function () {
            if (BUILD_DATE.indexOf("@@") === -1) {
                return BUILD_DATE;
            } else {
                return 'Not a builded version';
            }
        },

        /////////// INIT

        /**
         * Initialize the player.
         * @method init
         * @access public
         * @memberof MediaPlayer#
         * @param {Object} video - the HTML5 video element used to decode and render the media data
         */
        init: function (video) {
            if (!video) {
                throw new Error('MediaPlayer.init(): Invalid Argument');
            }
            if (!initialized) {
                system.injectInto(this);
                initialized = true;
                this.debug.log("[MediaPlayer] Version: " + this.getVersionFull() + " - " + this.getBuildDate());
                this.debug.log("[MediaPlayer] user-agent: " + navigator.userAgent);
            }
            videoModel = system.getObject('videoModel');
            videoModel.setElement(video);

            // in case of init is called another time
            if (playing && streamController) {
                streamController.reset();
                playing = false;
            }
            debugController = new MediaPlayer.dependencies.DebugController();
            // connect default events
            _connectEvents.call(this);
            debugController.init();

            // Initialize already loaded plugins
            for (var plugin in plugins) {
                plugins[plugin].init(this);
            }
        },

        /////////// LISTENERS

        /**
         * Registers a listener on the specified event.
         * The possible event types are:
         * <li>'error' (see [error]{@link HasPlayer#event:error} event specification)
         * <li>'warning' (see [warning]{@link HasPlayer#event:warning} event specification)
         * <li>'subtitlesStyleChanged' (see [subtitlesStyleChanged]{@link HasPlayer#event:subtitlesStyleChanged} event specification)
         * <li>'manifestUrlUpdate' (see [manifestUrlUpdate]{@link HasPlayer#event:manifestUrlUpdate} event specification)
         * <li>'play_bitrate' (see [play_bitrate]{@link HasPlayer#event:play_bitrate} event specification)
         * <li>'download_bitrate' (see [download_bitrate]{@link HasPlayer#event:download_bitrate} event specification)
         * <li>'bufferLevel_updated' (see [bufferLevel_updated]{@link HasPlayer#event:bufferLevel_updated} event specification)
         * <li>'state_changed' (see [state_changed]{@link HasPlayer#event:state_changed} event specification)
         * @method addEventListener
         * @access public
         * @memberof HasPlayer#
         * @param {string} type - the event type for listen to, either any HTML video element event or player event.
         * @param {callback} listener - the callback which is called when an event of the specified type occurs
         * @param {boolean} useCapture - see HTML DOM addEventListener() method specification
         */
        addEventListener: function (type, listener, useCapture) {
            _isPlayerInitialized();
            if (MediaPlayer.PUBLIC_EVENTS[type] === 'hasplayer') {
                this.eventBus.addEventListener(type, listener, useCapture);
            } else {
                videoModel.listen(type, listener, useCapture);
            }
        },

        /**
         * Unregisters the listener previously registered with the addEventListener() method.
         * @method removeEventListener
         * @access public
         * @memberof HasPlayer#
         * @see [addEventListener]{@link HasPlayer#addEventListener}
         * @param {string} type - the event type on which the listener was registered
         * @param {callback} listener - the callback which was registered to the event type
         */
        removeEventListener: function (type, listener) {
            _isPlayerInitialized();
            if (MediaPlayer.PUBLIC_EVENTS[type] === 'hasplayer') {
                this.eventBus.removeEventListener(type, listener);
            } else {
                videoModel.unlisten(type, listener);
            }
        },

        /////////// COMPONENTS GETTER

        /**
         * Returns the video model object.
         * @access public
         * @memberof MediaPlayer#
         * @return the video model object
         */
        getVideoModel: function() {
            return videoModel;
        },

        /**
         * Returns the debug object.
         * @access public
         * @memberof MediaPlayer#
         * @return the debug object 
         */
        getDebug: function () {
            return this.debug;
        },

        /**
         * Returns the metrics extension object.
         * @access public
         * @memberof MediaPlayer#
         * @return the metrics extension object
         */
        getMetricsExt: function () {
            return this.metricsExt;
        },

        /////////// CONFIG

        /**
         * Sets some player configuration parameters
         * @access public
         * @memberof MediaPlayer#
         * @param params - configuration parameters
         * @see {@link http://localhost:8080/OrangeHasPlayer/samples/Dash-IF/hasplayer_config.json}
         *
         */
        setConfig: function (params) {
            if (this.config && params) {
                this.debug.log("[MediaPlayer] set config: " + JSON.stringify(params, null, '\t'));
                this.config.setParams(params);
            }
        },

        /**
         * Sets some parameters values.
         * TODO : this metod should be replace by MediaPlayer#setConfig
         * @method setParams
         * @access public
         * @memberof MediaPlayer#
         * @param {PlayerParams} params - parameter(s) value(s) to set.
         */
        setParams: function (params) {
            _isPlayerInitialized();
            this.setConfig(params);
        },

        /**
         * Enables or disables debug information in the browser console.
         * @method setDebug
         * @access public
         * @memberof MediaPlayer#
         * @param {boolean} value - true to enable debug information, false to disable
         */
        setDebug: function (value) {
            _isPlayerInitialized();
            if (typeof value !== 'boolean') {
                throw new Error('OrangeHasPlayer.setDebug(): Invalid Arguments');
            }
            if (value === true) {
                this.debug.setLevel(4);
            } else {
                this.debug.setLevel(0);
            }
        },

        /**
         * Returns the autoplay state.
         * @access public
         * @memberof MediaPlayer#
         * @return the autoplay state
         */
        getAutoPlay: function () {
            return autoPlay;
        },

        /**
         * Sets the autoplay state.
         * @access public
         * @memberof MediaPlayer#
         * @param {boolean} value - the new autoplay state
         */
        setAutoPlay: function (value) {
            autoPlay = value;
        },

        /**
         * Sets the initial quality to be downloaded for the given track type.
         * This method has to be used before each call to load() method to set the initial quality.
         * Otherwise, the initial quality is set according to previous bandwidth condition.
         * @access public
         * @memberof MediaPlayer#
         * @see [setConfig]{@link MediaPlayer#setConfig} to set quality boundaries
         * @param {string} type - the track type ('video' or 'audio')
         * @param {number} value - the new initial quality index (starting from 0) to be downloaded
         */
        setInitialQualityFor: function (type, value) {
            initialQuality[type] = value;
        },

        /**
         * Returns the current quality for a stream type
         * @access public
         * @memberof MediaPlayer#
         * @param {string} type - stream type, 'video' or 'audio'
         * @return the current quality level as an index of the quality (in bitrate ascending order)
         */
        getQualityFor: function(type) {
            return this.abrController.getQualityFor(type);
        },

        /**
         * Selects the quality level for a stream type.
         * If you want to set limit up and down for video for instance, you have to use setConfig function.
         * @access public
         * @memberof MediaPlayer#
         * @param {string} type - stream type, 'video' or 'audio'
         * @param {number} value - the selected quality level as an index of the quality (in bitrate ascending order)
         */
        setQualityFor: function(type, value) {
            this.abrController.setPlaybackQuality(type, value);
        },

        /**
         * Returns the auto switch quality state.
         * @access public
         * @memberof MediaPlayer#
         * @return the auto switch quality state
         */
        getAutoSwitchQuality: function() {
            return this.abrController.getAutoSwitchBitrate();
        },

        /**
         * Sets the auto switch quality state.
         * @access public
         * @memberof MediaPlayer#
         * @param {boolean} value - the new auto switch quality state
         */
        setAutoSwitchQuality: function(value) {
            this.abrController.setAutoSwitchBitrate(value);
        },

        /**
         * Returns the buffering behaviour while the player is in pause.
         * @access public
         * @memberof MediaPlayer#
         * @return {boolean} true if we continue to buffer stream while in pause
         */
        getScheduleWhilePaused: function () {
            return scheduleWhilePaused;
        },

        /**
         * Sets the buffering behaviour while player is in pause.
         * @access public
         * @memberof MediaPlayer#
         * @param {boolean} value - true if it buffers stream while in pause
         */
        setScheduleWhilePaused: function (value) {
            scheduleWhilePaused = value;
        },

        /**
         * Sets the default audio language. If the default language is available in the stream,
         * the corresponding audio track is selected. Otherwise, the first declared audio track in the manifest is selected.
         * This function has to be called before any other function 
         * @method setDefaultAudioLang
         * @access public
         * @memberof MediaPlayer#
         * @param {string} lang - the default audio language based on ISO 3166-2
         */
        setDefaultAudioLang: function (language) {
            if (typeof language !== 'string') {
                throw new Error('OrangeHasPlayer.setDefaultAudioLang(): Invalid Arguments');
            }
            defaultAudioLang = language;
        },

        /**
         * Sets the default subtitle language. If the default language is available in the stream,
         * the corresponding subtitle track is selected. Otherwise, the first declared subtitle track in the manifest is selected.
         * This function has to be called before any other function 
         * @method setDefaultSubtitleLang
         * @access public
         * @memberof MediaPlayer#
         * @param {string} lang - the default subtitle language based on ISO 3166-2
         */
        setDefaultSubtitleLang: function (language) {
            if (typeof language !== 'string') {
                throw new Error('OrangeHasPlayer.setDefaultSubtitleLang(): Invalid Arguments');
            }
            defaultSubtitleLang = language;
        },

        /////////// PLAYBACK

        /**
         * Load/open a video stream.
         * @method load
         * @access public
         * @memberof MediaPlayer#
         * @param {object} stream - video stream properties object such url, prodData ...
            <pre>
            {
                url : "http://..../manifest.mpd",
                protData : {
                    // one entry for each key system ('com.microsoft.playready' or 'com.widevine.alpha')
                    "[key_system_name]": {
                        laURL: "[licenser url (optionnal)]",
                        pssh: "[base64 pssh box (optionnal)]"
                        cdmData: "[custom data (optionnal)]"
                    },
                    ...
               }
               ...
            }
            </pre>
        */
        load: function (stream) {
            var i,
                pluginsInitDefer = [],
                config = {
                    video: {
                        "ABR.keepBandwidthCondition": true
                    },
                    audio: {
                        "ABR.keepBandwidthCondition": true
                    }
                };

            // patch to be retro compatible with old syntax
            if (arguments && arguments.length > 0 && typeof arguments[0] !== 'object') {
                console.warn('You are using "depreacted" call of the method load, please refer to the documentation to change prameters call');
                stream = _parseLoadArguments.apply(null, arguments);
            }

            tracks.audio = [];
            tracks.text = [];

            videoQualityChanged = [];
            audioQualityChanged = [];

            _isPlayerInitialized();

            // Reset the player
            this.reset(0);

            // Set initial quality if first stream
            if (initialQuality.video >= 0) {
                this.abrController.setPlaybackQuality('video', initialQuality.video);
                config.video["ABR.keepBandwidthCondition"] = false;
                initialQuality.video = -1;
            }

            if (initialQuality.audio >= 0) {
                this.abrController.setPlaybackQuality('audio', initialQuality.audio);
                config.audio["ABR.keepBandwidthCondition"] = false;
                initialQuality.audio = -1;
            }

            // Set config to set 'keepBandwidthCondition' parameter
            this.setConfig(config);

            // Reset last error and warning
            error = null;
            warning = null;

            // Wait for plugins completely intialized before starting a new session
            for (i = 0; i < plugins.length; i++) {
                pluginsInitDefer.push(plugins[i].deferInit);
            }
            Q.all(pluginsInitDefer).then((function () {
                // Notify plugins a new stream is loaded
                for (var plugin in plugins) {
                    plugins[plugin].load(stream.url);
                }

                // here we are ready to start playing
                source = stream;
                _resetAndPlay.call(this);
            }).bind(this));
        },

        /**
        * Plays/resumes playback of the media.
        * @method play
        * @access public
        * @memberof MediaPlayer#
        */
        play: function () {
            _isPlayerInitialized();
            videoModel.play();
        },

        /**
         * Seeks the media to the new time. For LIVE streams, this function can be used to perform seeks within the DVR window if available.
         * @method seek
         * @access public
         * @memberof MediaPlayer#
         * @param {number} time - the new time value in seconds
         */
        seek: function (time) {
            var range = null;

            _isPlayerInitialized();

            if (typeof time !== 'number') {
                throw new Error('OrangeHasPlayer.seek(): Invalid Arguments');
            }

            if (!this.isLive()) {
                if (time < 0 || time > videoModel.getDuration()) {
                    throw new Error('OrangeHasPlayer.seek(): seek value outside available time range');
                } else {
                    videoModel.setCurrentTime(time);
                }
            } else {
                range = this.getDVRWindowRange();
                if (range === null) {
                    throw new Error('OrangeHasPlayer.seek(): impossible for live stream');
                } else if (time < range.start || time > range.end) {
                    throw new Error('OrangeHasPlayer.seek(): seek value outside available time range');
                } else {
                    videoModel.setCurrentTime(time);
                }
            }
        },

        /**
         * Pauses the media playback.
         * @method pause
         * @access public
         * @memberof MediaPlayer#
         */
        pause: function () {
            _isPlayerInitialized();
            if (!this.isLive()) {
                videoModel.pause();
            } else {
                throw new Error('OrangeHasPlayer.pause(): pause is impossible on live stream');
            }
        },

        /**
         * Stops the media playback and seek back to start of stream and media. Subsequently call to play() method will restart streaming and playing from beginning.
         * @method stop
         * @access public
         * @memberof MediaPlayer#
         */
        stop: function () {
            _isPlayerInitialized();
            videoModel.pause();
            //test if player is in VOD mode
            if (!this.isLive()) {
                videoModel.setCurrentTime(0);
            }

            // Notify plugins that current stream is stopped
            for (var plugin in plugins) {
                plugins[plugin].stop();
            }
        },

        /**
         * Stops and resets the player.
         * @method reset
         * @access public
         * @memberof MediaPlayer#
         * @param {number} reason - the reason for stopping the player.
         * Possible values are:
         * <li>0 : stop during streaming (ex: browser has been closed)
         * <li>1 : stop because all the stream has been watched
         * <li>2 : stop after an error
         */
        reset: function (reason) {
            _isPlayerInitialized();
            this.abrController.setAutoSwitchBitrate('video', 0);
            this.abrController.setAutoSwitchBitrate('audio', 0);

            this.metricsModel.addState('video', 'stopped', videoModel.getCurrentTime(), reason);
            source = null;
            _resetAndPlay.call(this);

            // Notify plugins that player is reset
            for (var plugin in plugins) {
                plugins[plugin].stop();
            }
        },

        /**
        * Updates the manifest url.
        * @method refeshManifest
        * @access public
        * @memberof MediaPlayer#
        * param {string} url - the updated video stream's manifest (MPEG DASH, Smooth Streaming or HLS) url
        */
        refreshManifest: function (url) {
            _isPlayerInitialized();
            streamController.refreshManifest(url);
        },


        /////////////////////// STREAM METADATA 

        /**
         * Returns the media duration.
         * @method getDuration
         * @access public
         * @memberof MediaPlayer#
         * @return {number} the media duration in seconds, <i>Infinity</i> for live content
         */
        getDuration: function () {
            _isPlayerInitialized();
            return videoModel.getDuration();
        },

        /**
         * Returns true if the current stream is a live stream.
         * @method isLive
         * @access public
         * @memberof MediaPlayer#
         * @return {boolean} true if current stream is a live stream, false otherwise
         */
        isLive: function () {
            _isPlayerInitialized();
            return videoModel.getDuration() !== Number.POSITIVE_INFINITY ? false : true;
        },

        /**
         * Returns the current playback time.
         * @method getPosition
         * @access public
         * @memberof MediaPlayer#
         * @return {number} the current playback time in seconds
         */
        getPosition: function () {
            _isPlayerInitialized();
            if (!this.isLive()) {
                return videoModel.getCurrentTime();
            } else {
                return undefined;
            }
        },

        /**
         * Return available dvr range for  live stream
         * @method isLive
         * @access public
         * @memberOf MediaPlayer#
         * @return {Array} dvr range available
         */
        getDVRWindowRange: function () {
            if (this.isLive()) {
                var metric = this.metricsModel.getReadOnlyMetricsFor('video'),
                    dvrInfo = metric ? this.metricsExt.getCurrentDVRInfo(metric) : null,
                    range = dvrInfo ? dvrInfo.range : null;
                return range;
            } else {
                return null;
            }
        },

        /**
         * Returns the DVR window size.
         * @method getDVRWindowSize
         * @access public
         * @memberof MediaPlayer#
         * @return {number} the DVR window size in seconds
         */
        getDVRWindowSize: function () {
            _isPlayerInitialized();
            return this.getDVRInfoMetric.call(this).mpd.timeShiftBufferDepth;
        },


        getDVRInfoMetric: function () {
            var metric = this.metricsModel.getReadOnlyMetricsFor('video') || this.metricsModel.getReadOnlyMetricsFor('audio');
            return this.metricsExt.getCurrentDVRInfo(metric);
        },


        /**
         * TBD
         * @param  value
         * @return DVR seek offset
         * @access public
         */
        getDVRSeekOffset: function (value) {
            var metric = this.getDVRInfoMetric.call(this),
                val = metric.range.start + parseInt(value, 10);

            if (val > metric.range.end) {
                val = metric.range.end;
            }

            return val;
        },

        /**
         * Returns the list of available bitrates (as specified in the stream manifest).
         * @method getVideoBitrates
         * @access public
         * @memberof MediaPlayer#
         * @return {Array<Number>} array of bitrate values
         */
        getVideoBitrates: function () {
            _isPlayerInitialized();
            return videoBitrates;
        },

        /**
         * Returns the metrics for stream type
         * @access public
         * @memberof MediaPlayer#
         * @param {string} type - stream type, 'video' or 'audio'
         * @return the metrics array for the selected type
         */
        getMetricsFor: function(type) {
            var metrics = this.metricsModel.getReadOnlyMetricsFor(type);
            return metrics;
        },

        /////////////////////// TRICK MODE

        /**
         * Returns the current trick mode speed.
         * @method setTrickModeSpeed
         * @access public
         * @memberof MediaPlayer#
         * @return the current trick mode speed
         */
        getTrickModeSpeed: function () {
            if (streamController) {
                return streamController.getTrickModeSpeed();
            }

            return 0;
        },

        /**
         * Sets the trick mode speed.
         * @method setTrickModeSpeed
         * @access public
         * @memberof MediaPlayer#
         * @param {number} speed - the new trick mode speed (0 corresponds to normal playback, i.e. playbackRate = 1)
         */
        setTrickModeSpeed: function (speed) {
            _isPlayerInitialized();
            if (streamController) {
                if (streamController.getTrickModeSpeed() !== speed && speed === 1) {
                    videoModel.play();
                } else {
                    streamController.setTrickModeSpeed(speed);
                }
            }
        },

        /////////////////////// ERROR/WARNING

        /**
         * Returns the Error object for the most recent error
         * @access public
         * @memberof MediaPlayer#
         * @return {object} the Error object for the most recent error, or null if there has not been an error
        */
        getError: function () {
            return error;
        },

        /**
         * Returns the Warning object for the most recent warning
         * @access public
         * @memberof MediaPlayer#
         * @return {object} the Warning object for the most recent warning, or null if there has not been a warning
         */
        getWarning: function () {
            return warning;
        },

        /////////////////////// TRACKS

        /**
         * Returns the list of tracks contained in the stream (as specified in the stream manifest) 
         * according to the type given in parameters. if null it returns all type of tracks (audio & text)
         * The tracks list can be retrieved once the video 'loadeddata' event has been fired.
         * @method getTracks
         * @param {String} type
         * @access public
         * @memberof MediaPlayer#
         * @return {Array<Track>} the audio tracks
         */
        getTracks: function (type) {

            _isPlayerInitialized();

            if (!type || (type !== MediaPlayer.TRACKS_TYPE.AUDIO && type !== MediaPlayer.TRACKS_TYPE.TEXT)) {
                throw new Error('MediaPlayer Invalid Argument - "type" should be defined and shoud be kind of MediaPlayer.TRACKS_TYPE');
            }

            if (tracks[type].length === 0) {
                if (streamController) {
                    var selectedTracks = getTracksFromType(type);
                    if (selectedTracks) {
                        for (var i = 0; i < selectedTracks.length; i += 1) {
                            tracks[type].push({
                                id: selectedTracks[i].id,
                                lang: selectedTracks[i].lang
                            });
                        }
                    }
                }
            }

            return tracks[type];
        },

        /**
         * Selects the track to be playbacked for the stream type.
         * @method setTrack
         * @access public
         * @memberof MediaPlayer#
         * @see [getTracks]{@link MediaPlayer#getTracks}
         * @param {String} type - the stream type (see @link MediaPlayer#TRACKS_TYPE)
         * @param {Track} track - the track to select
         * 
         */
        setTrack: function (type, track) {

            _isPlayerInitialized();

            if (!type || (type !== MediaPlayer.TRACKS_TYPE.AUDIO && type !== MediaPlayer.TRACKS_TYPE.TEXT)) {
                throw new Error('MediaPlayer Invalid Argument - "type" should be defined and shoud be kind of MediaPlayer.TRACKS_TYPE');
            }

            if (!track || !(track.id || track.lang)) {
                throw new Error('OrangeHasPlayer.setTrack(): track parameter is unknown');
            }

            var selectedTrack = this.getSelectedTrack(type);

            if (selectedTrack && ((track.id === selectedTrack.id) ||
                (track.lang === selectedTrack.lang))) {
                this.debug.log("[OrangeHasPlayer] " + track.lang + " is already selected");
                return;
            }

            var availableTracks = getTracksFromType(type);

            if (availableTracks) {
                for (var i = 0; i < availableTracks.length; i += 1) {
                    if ((track.id === availableTracks[i].id) ||
                        (track.lang === availableTracks[i].lang)) {
                        this.setTrack(type, availableTracks[i]);
                        return;
                    }
                }
            }
        },

        /**
         * Returns the selected track.
         * @method getSelectedTrack
         * @access public
         * @memberof MediaPlayer#
         * @param {String} type - the track type according to MediaPlayer.TRACKS_TYPE (see @link MediaPlayer#TRACKS_TYPE)
         * @return {Track} the selected audio track
         */
        getSelectedTrack: function (type) {
            _isPlayerInitialized();

            if (!type || (type !== MediaPlayer.TRACKS_TYPE.AUDIO && type !== MediaPlayer.TRACKS_TYPE.TEXT)) {
                throw new Error('MediaPlayer Invalid Argument - "type" should be defined and shoud be kind of MediaPlayer.TRACKS_TYPE');
            }

            var selectedTrack = getSelectedTrackFromType(type);

            if (!selectedTrack) {
                return null;
            }

            return { id: selectedTrack.id, lang: selectedTrack.lang };
        },

        /////////// SUBTITLES DISPLAY

        /**
         * Enable / disable subtitles.
         * @method enableSubtitles
         * @access public
         * @memberof MediaPlayer#
         * @param {boolean} enabled - true to enable subtitles, false to hide subtitles. (default false)
         */
        enableSubtitles: function (enabled) {
            _isPlayerInitialized();
            if (typeof enabled !== 'boolean') {
                throw new Error('OrangeHasPlayer.setSubtitleVisibility(): Invalid Arguments');
            }
            subtitlesEnabled = enabled;
            if (streamController) {
                streamController.enableSubtitles(enabled);
            }
        },

        /**
        * function used to retrieve if subtitle is enable or not
        * @method isSubtitlesEnabled
        * @access public
        * @memberof MediaPlayer#
        * @retrun {boolean} true if the download of subtitle is enabled
       */
        isSubtitlesEnabled: function () {
            _isPlayerInitialized();
            return subtitlesEnabled;
        },

        /**
         * Set to true if subtitles are displayed in a div outside video player.
         * @method enableSubtitleExternDisplay
         * @access public
         * @memberof MediaPlayer#
         * @param {boolean} mode - true if subtitles are displayed in a div outside video player
         */
        enableSubtitleExternDisplay: function (mode) {
            this.config.setParams({ 'TextTrackExtensions.displayModeExtern': mode });
        },

        /////////// AUDIO VOLUME

        /**
         * Returns the audio mute status.
         * @method getMute
         * @access public
         * @memberof MediaPlayer#
         * @return {boolean} true if the audio is muted, false otherwise
         */
        getMute: function () {
            _isPlayerInitialized();
            return videoModel.getMute();
        },

        /**
         * Sets the audio mute status.
         * @method setMute
         * @access public
         * @memberof MediaPlayer#
         * @param {boolean} state - true to mute audio, false otherwise
         */
        setMute: function (state) {
            _isPlayerInitialized();
            if (typeof state !== 'boolean') {
                throw new Error('OrangeHasPlayer.setMute(): Invalid Arguments');
            }
            videoModel.setMute(state);
        },

        /**
         * Returns the audio volume level.
         * @method getVolume
         * @access public
         * @memberof MediaPlayer#
         * @return {number} the current audio volume level, from 0.0 (silent) to 1.0 (loudest)
         */
        getVolume: function () {
            _isPlayerInitialized();
            return videoModel.getVolume();
        },

        /**
         * Sets the audio volume level.
         * @method setVolume
         * @access public
         * @memberof MediaPlayer#
         * @param {number} volume - the audio volume level, from 0.0 (silent) to 1.0 (loudest)
         */
        setVolume: function (volume) {
            _isPlayerInitialized();
            if ((typeof volume !== 'number') || volume < 0 || volume > 1) {
                throw new Error('OrangeHasPlayer.setVolume(): Invalid Arguments');
            }

            videoModel.setVolume(volume);
        },

        /////////// TERMINAL ID

        /**
         * Returns the terminal ID.
         * @method getTerminalId
         * @access public
         * @memberof MediaPlayer#
         * @return {string} the terminal ID 
         */
        getTerminalId: function () {
            var browser = fingerprint_browser(),
                os = fingerprint_os();

            return os.name + "-" + os.bits + "-" + browser.name;
        },

        /////////// PLUGINS

        /**
         * Loads a MediaPlayer plugin.
         * @method loadPlugin
         * @access public
         * @memberof MediaPlayer#
         * @param {string} plugin - the plugin object name
         * @param params - the plugin parameters
         */
        loadPlugin: function (plugin, params) {
            var instance;

            if (plugin === undefined) {
                throw new Error('MediaPlayer.loadPlugin(): plugin undefined');
            }

            // Create plugin instance
            instance = new plugin();

            // Check plugin API
            if (instance.name === undefined ||
                instance.version  === undefined ||
                instance.initialized  === undefined ||
                instance.init  === undefined ||
                instance.load  === undefined ||
                instance.stop  === undefined ||
                instance.reset === undefined) {
                throw new Error('MediaPlayer.loadPlugin(): plugin API not compliant');
            }

            if (plugins[instance.name]) {
                // Plugin already loaded
                return;
            }

            this.debug.log("[MediaPlayer] Load plugin '" + instance.name + "' (v" + instance.version + ")");

            // Store plugin
            plugins[instance.name] = instance;

            // Initialize plugin (if player initialized)
            instance.deferInit = Q.defer();
            if (initialized) {
                instance.init(this, params, function () {
                    instance.deferInit.resolve();
                });
            }
        }
    };
};


/**
 * @class
 * @classdesc MediaPlayer is the object used by the webapp to instanciante and control hasplayer.
 */
MediaPlayer.prototype = {
    constructor: MediaPlayer
};


/**
 * Packages declaration
 */

MediaPlayer.dependencies = {};
MediaPlayer.dependencies.protection = {};
MediaPlayer.dependencies.protection.servers = {};
MediaPlayer.utils = {};
MediaPlayer.models = {};
MediaPlayer.modules = {};
MediaPlayer.vo = {};
MediaPlayer.vo.metrics = {};
MediaPlayer.vo.protection = {};
MediaPlayer.rules = {};
MediaPlayer.rules.o = {};
MediaPlayer.di = {};


/**
 * ENUMS
 */
MediaPlayer.PUBLIC_EVENTS = {
    /**
     * The error event is fired when an error occurs.
     * When the error event is fired, the application shall stop the player.
     *
     * @event HasPlayer#error
     * @param {object} event - the event
     * @param {object} event.type - the event type ('error')
     * @param {object} event.data - the event data
     * @param {string} event.data.code - error code
     * @param {string} event.data.message - error message
     * @param {object} event.data.data - error additionnal data
     */
    'error': 'hasplayer',
    /**
    * The warning event is fired when a warning occurs.
    *
    * @event HasPlayer#warning
    * @param {object} event - the event
    * @param {object} event.type - the event type ('warning')
    * @param {object} event.data - the event data
    * @param {string} event.data.code - warning code
    * @param {string} event.data.message - warning message
    * @param {object} event.data.data - warning additionnal data
    */
    'warning': 'hasplayer',
    /**
     * The cueEnter event is fired when a subtitle cue needs to be displayed.
     *
     * @event HasPlayer#cueEnter
     * @param {object} event - the event
     * @param {object} event.type - the event type ('cueEnter')
     * @param {object} event.data - the event data
     * @param {object} event.data.text - the subtitle text
     * @param {string} event.data.style.backgroundColor - the background color
     * @param {string} event.data.style.color - the font color
     * @param {string} event.data.style.fontFamily - the font family
     * @param {string} event.data.style.fontSize - the font size
     */
    'cueEnter': 'hasplayer',

    /**
     * The cueExit event is fired when a subtitle cue needs to be erased.
     *
     * @event HasPlayer#cueExit
     * @param {object} event - the event
     * @param {object} event.type - the event type ('cueExit')
     * @param {object} event.data - the event data
     * @param {object} event.data.text - the subtitle text
     * @param {string} event.data.style.backgroundColor - the background color
     * @param {string} event.data.style.color - the font color
     * @param {string} event.data.style.fontFamily - the font family
     * @param {string} event.data.style.fontSize - the font size
     */
    'cueExit': 'hasplayer',

    /**
     * The manifestUrlUpdate event is fired when the URL of the manifest may have to be refreshed,
     * since the player failed to download the manifest file (URL expiration for example).
     * The application shall therefore provide an updated manifest URL by using the method [refreshManifest]{@link HasPlayer#refreshManifest}
     *
     * @event HasPlayer#manifestUrlUpdate
     * @param {object} event - the event
     * @param {object} event.type - the event type ('manifestUrlUpdate')
     * @param {object} event.data - the event data
     * @param {object} event.data.url - the current manifest url
     */
    'manifestUrlUpdate': 'hasplayer',

    /**
     * The metricChanged event is fired when metrics are refreshed,
     * TBD
     */
    'metricChanged' : 'hasplayer',

    /**
     * The 'play_bitrate' event is fired when the current played bitrate has changed.
     *
     * @event HasPlayer#play_bitrate
     * @param {CustomEvent} event - the event
     * @param {object} event.detail - the event data
     * @param {string} event.detail.type - the stream type ('audio' or 'video')
     * @param {number} event.detail.bitrate - the new bitrate
     * @param {string} event.detail.representationId - the corresponding representation id (from manifest)
     * @param {number} event.detail.time - the current video time
     * @param {number} event.detail.width - in case of video stream, the video width of the representation
     * @param {number} event.detail.height - in case of video stream, the video height of the representation
     */
    'play_bitrate': 'video',

    /**
     * The download_bitrate event is fired when the current downloaded bitrate has changed.
     *
     * @event HasPlayer#download_bitrate
     * @param {CustomEvent} event - the event
     * @param {object} event.detail - the event data
     * @param {string} event.detail.type - the stream type ('audio' or 'video')
     * @param {number} event.detail.bitrate - the new bitrate
     * @param {string} event.detail.representationId - the corresponding representation id (from manifest)
     * @param {number} event.detail.time - the current video time
     * @param {number} event.detail.width - in case of video stream, the video width of the representation
     * @param {number} event.detail.height - in case of video stream, the video height of the representation
     */
    'download_bitrate': 'video',


    /**
     * The bufferLevel_updated event is fired when the buffer level changed.
     *
     * @event HasPlayer#bufferLevel_updated
     * @param {CustomEvent} event - the event
     * @param {object} event.detail - the event data
     * @param {string} event.detail.type - the stream type ('audio' or 'video')
     * @param {number} event.detail.level - the buffer level (in seconds)
     */
    'bufferLevel_updated': 'video',

    /**
     * The state_changed event is fired when the player state changed.
     *
     * @event HasPlayer#state_changed
     * @param {CustomEvent} event - the event
     * @param {object} event.detail - the event data
     * @param {string} event.detail.type - the stream type ('audio' or 'video')
     * @param {string} event.detail.state - the current state ('stopped', 'buffering', 'seeking' or 'playing')
     */
    'state_changed': 'video'

};

/**
 *  expose the track's type available in has manifest. usefull to retrieve tracks list with method MediaPlayer.getTracks(<type>)
 *  @enum 
 */
MediaPlayer.TRACKS_TYPE = {
    AUDIO: "audio",
    TEXT: "text"
};

/**
 * Player parameters object.
 * All parameters values are applied for any stream type. Parameters can be overriden specifically for audio and video track by setting
 * parameters values in the params.audio and params.video objects.
 * @typedef PlayerParams
 * @type Object
 * @property {number}   BufferController.minBufferTimeForPlaying - Minimum buffer level before playing, in seconds (default value = 0)
 * @property {number}   BufferController.minBufferTime - Minimum buffer size, in seconds (default value = 16)
 * @property {number}   ABR.minBandwidth - Minimum bandwidth to be playbacked (default value = -1)
 * @property {number}   ABR.maxBandwidth - Maximum bandwidth to be playbacked (default value = -1)
 * @property {number}   ABR.minQuality - Minimum quality index (start from 0) to be playbacked (default value = -1)
 * @property {number}   ABR.maxQuality - Maximum quality index (start from 0) to be playbacked (default value = -1)
 * @property {boolean}  ABR.switchUpIncrementally - Switch up quality incrementally, or not (default value = false)
 * @property {number}   ABR.switchUpRatioSafetyFactor - Switch up bandwith ratio safety factor (default value = 1.5)
 * @property {boolean}  ABR.latencyInBandwidth - Include (or not) latency in bandwidth (default value = true)
 * @property {number}   ABR.switchLowerBufferTime - Buffer level (in seconds) under which switching down to lowest quality occurs (default value = -1)
 * @property {number}   ABR.switchLowerBufferRatio - Buffer level (as percentage of buffer size) under which switching down to lowest quality occurs (default value = 0.25)
 * @property {number}   ABR.switchDownBufferTime - Buffer level (in seconds) under which switching down quality occur, if unsufficient bandwidth (default value = -1)
 * @property {number}   ABR.switchDownBufferRatio - Buffer level (as percentage of buffer size) under which switching down quality occurs, if unsufficient bandwidth (default value = 0.5)
 * @property {number}   ABR.switchUpBufferTime - Buffer level (in seconds) upper which switching up quality occurs, if sufficient bandwidth (default value = -1)
 * @property {number}   ABR.switchUpBufferRatio - Buffer level (as percentage of buffer size) upper which switching up quality occurs, if sufficient bandwidth (default value = 0.75)
 * @property {number}   ManifestLoader.RetryAttempts - Number of retry attempts for downloading manifest file when it fails (default value = 2)
 * @property {number}   ManifestLoader.RetryInterval - Interval (in milliseconds) between each retry attempts for downloading manifest file (default value = 500)
 * @property {number}   FragmentLoader.RetryAttempts - Number of retry attempts for downloading segment files when it fails (default value = 2)
 * @property {number}   FragmentLoader.RetryInterval - Interval (in milliseconds) between each retry attempts for downloading segment files (default value = 500)
 * @property {Object}   video - Video parameters (parameters for video track)
 * @property {Object}   audio - audio parameters (parameters for audio track)
 */

/** 
 * Static Functions
 */
/**
* Returns the current browser status on MSE support.
* @method hasMediaSourceExtension
* @static
* @return true if MSE is supported, false otherwise
*/
MediaPlayer.hasMediaSourceExtension = function () {

    return new MediaPlayer.utils.Capabilities().supportsMediaSource();
};

/**
 * Returns the current browser status on EME support.
 * @method hasMediaKeysExtension
 * @static
 * @return true if EME is supported, false otherwise
 */
MediaPlayer.hasMediaKeysExtension = function () {
    return new MediaPlayer.utils.Capabilities().supportsMediaKeys();
};
