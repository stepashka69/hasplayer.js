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
MediaPlayer = function() {

    ///////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////// PRIVATE ////////////////////////////////////////////
    var VERSION = '1.3.0_dev',
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
        metricsAgent = {
            ref: null,
            deferInit: null,
            isActivated: false
        },
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
        source = null; // current source played


    // player state and intitialization
    var _isReady = function() {
        return initialized && videoModel.getElement() && source && !resetting;
    }

    var _isPlayerInitialized = function() {
        if (!initialized) {
            throw new Error('MediaPlayer not initialized !!!');
        }
    };

    var _isVideoModelInitialized = function() {
        if (!videoModel.getElement()) {
            throw new Error('MediaPlayer.play(): Video element not attached to MediaPlayer');
        }
    }

    var _isSourceInitialized = function() {
        if (!source) {
            throw new Error('MediaPlayer.play(): Source not attached to MediaPlayer');
        }
    }

    // event connection
    var _connectEvents = function() {
        //this.addEventListener('loadedMetadata', _onloaded.bind(this));
        this.addEventListener('metricsAdded', _metricsAdded.bind(this));
        this.addEventListener('error', _onError.bind(this));
        this.addEventListener('warning', _onWarning.bind(this));
        this.addEventListener('timeupdate', _onTimeupdate.bind(this));
    };

    // event disptach
    var _dispatchBitrateEvent = function(type, value) {
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

    var _metricsAdded = function(e) {
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

    var _onError = function(e) {
        error = e.data;
    };

    var _onWarning = function(e) {
        warning = e.data;
    };

    /**
     * Usefull to dispatch event of quality changed
     */
    var _onTimeupdate = function() {
        // If not in playing state, then do not send 'play_bitrate' events, wait for 'loadeddata' event first
        if (videoModel.getPlaybackRate() === 0) {
            return;
        }
        // Check for video playing quality change
        _detectPlayBitrateChange.call(this, videoQualityChanged);
        // Check for audio playing quality change
        _detectPlayBitrateChange.call(this, audioQualityChanged);
    };

    var _detectPlayBitrateChange = function(streamTab) {
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

    var _cleanStreamTab = function(streamTab, idToRemove) {
        var i = 0;

        for (i = idToRemove.length - 1; i >= 0; i -= 1) {
            streamTab.splice(i, 1);
        }
    };


    /// Private playback functions ///
    var resetAndPlay = function() {
        if (playing && streamController) {
            if (!resetting) {
                resetting = true;

                var teardownComplete = {};
                teardownComplete[MediaPlayer.dependencies.StreamController.eventList.ENAME_TEARDOWN_COMPLETE] = (function() {

                    // Finish rest of shutdown process
                    streamController = null;
                    playing = false;

                    resetting = false;

                    this.debug.log("[MediaPlayer] Player is stopped");

                    if (_isReady.call(this)) {
                        doAutoPlay.call(this);
                    }
                }).bind(this);
                streamController.subscribe(MediaPlayer.dependencies.StreamController.eventList.ENAME_TEARDOWN_COMPLETE, teardownComplete, undefined, true);
                streamController.reset();
            }
        } else {
            if (_isReady.call(this)) {
                doAutoPlay.call(this);
            }
        }
    };

    var doAutoPlay = function() {
        if (_isReady()) {
            play.call(this);
        }
    };

    var play = function() {
        _isPlayerInitialized();
        _isVideoModelInitialized();
        _isSourceInitialized();

        if (!MediaPlayer.supportsMediaSource()) {
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

        streamController.setDefaultAudioLang(defaultAudioLang)
        streamController.setDefaultSubtitleLang(defaultSubtitleLang);
        streamController.enableSubtitles(subtitlesEnabled);
        // TODO restart here !!!
        streamController.load();

    };

    // DIJON initialization
    system.mapValue('system', system);
    system.mapOutlet('system');
    system.injectInto(context);

    return {
        ///////////////////////////////////////////////////////////////////////////////////////////////
        ////////////////////////////////////////// PUBLIC /////////////////////////////////////////////
        debug: undefined,
        eventBus: undefined,
        metricsExt: undefined,
        abrController: undefined,
        metricsModel: undefined,
        uriQueryFragModel: undefined,
        errHandler: undefined,
        config: undefined,

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
        addEventListener: function(type, listener, useCapture) {
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
        removeEventListener: function(type, listener) {
            _isPlayerInitialized();
            if (MediaPlayer.PUBLIC_EVENTS[type] === 'hasplayer') {
                this.eventBus.removeEventListener(type, listener);
            } else {
                videoModel.unlisten(type, listener);
            }
        },

        /**
         * Initialize the player.
         * @method init
         * @access public
         * @memberof MediaPlayer#
         * @param {Object} video - the HTML5 video element used to decode and render the media data
         */
        init: function(video) {
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
        },

        /**
         * Metrics agent parameters object.
         * @typedef MetricsAgentParams
         * @type Object
         * @property {String} name - the metrics agent name
         * @property {boolean} enable - enable state
         * @property {String} activationUrl - the activation url
         * @property {String} serverUrl - the collecter url
         * @property {String} dbServerUrl - the inside events database server (for debug purpose)
         * @property {String} collector - the collector type ('HasPlayer')
         * @property {String} formatter - the formatter type ('CSQoE' or 'PRISME')
         * @property {Integer} sendingTime - the periodic delay (in milliseconds) for sending events to collector
         */

        /**
         * Loads and initializes the metrics agent.
         * @method loadMetricsAgent
         * @access public
         * @memberof OrangeHasPlayer#
         * @param {MetricsAgentParams} parameters - the metrics agent parameters
         */
        loadMetricsAgent: function(parameters) {
            _isPlayerInitialized();

            if (typeof (MetricsAgent) !== 'undefined') {
                metricsAgent.ref = new MetricsAgent(this, videoModel.getElement(), parameters, this.debug);

                metricsAgent.deferInit = Q.defer();
                metricsAgent.ref.init(function(activated) {
                    this.debug.log("Metrics agent state: ", activated);
                    metricsAgent.isActivated = activated;
                    metricsAgent.deferInit.resolve();
                });
            } else {
                throw new Error('OrangeHasPlayer.loadMetricsAgent(): MetricsAgent is undefined');
            }
        },



        /////////// PLAYBACK

        /**
         * Load/open a video stream.
         * @method load
         * @access public
         * @memberof OrangeHasPlayer#
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
        load: function(stream) {
            var config = {
                video: {
                    "ABR.keepBandwidthCondition": true
                },
                audio: {
                    "ABR.keepBandwidthCondition": true
                }
            };

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

            // Wait for MetricsAgent completely intialized before starting a new session
            Q.when(metricsAgent.ref ? metricsAgent.deferInit.promise : true).then((function() {

                if (metricsAgent.ref && metricsAgent.isActivated && url) {
                    metricsAgent.ref.createSession();
                }

                // Set config to set 'keepBandwidthCondition' parameter
                this.setConfig(config);

                error = null;
                warning = null;

                // here we are ready to start playing


                // mediaPlayer.attachSource(url, protData);

                // if (mediaPlayer.getAutoPlay()) {
                //     state = 'PLAYER_RUNNING';
                // }
            }).bind(this));
        },

        /**
         * Stops and resets the player.
         * @method reset
         * @access public
         * @memberof OrangeHasPlayer#
         * @param {number} reason - the reason for stopping the player.
         * Possible values are:
         * <li>0 : stop during streaming (ex: browser has been closed)
         * <li>1 : stop because all the stream has been watched
         * <li>2 : stop after an error
         */
        reset: function(reason) {
            _isPlayerInitialized();
            this.abrController.setAutoSwitchBitrate('video', 0);
            this.abrController.setAutoSwitchBitrate('audio', 0);

            this.metricsModel.addState('video', 'stopped', videoModel.getCurrentTime(), reason);
            this.uriQueryFragModel.reset();
            source = null;
            resetAndPlay();
            if (metricsAgent.ref) {
                metricsAgent.ref.stop();
            }

        },

        /**
         * Enable / disable subtitles.
         * @method enableSubtitles
         * @access public
         * @memberof OrangeHasPlayer#
         * @param {boolean} enabled - true to enable subtitles, false to hide subtitles. (default false)
         */
        enableSubtitles: function(enabled) {
            _isPlayerInitialized();
            if (typeof value !== 'boolean') {
                throw new Error('OrangeHasPlayer.setSubtitleVisibility(): Invalid Arguments');
            }
            subtitlesEnabled = enabled;
            if(streamController){
                streamController.enableSubtitles(enabled);
            }
        },

        ////////////////////////////////////////// GETTER /////////////////////////////////////////////
        /**
         * Returns the version of the player.
         * @method getVersion
         * @access public
         * @memberof OrangeHasPlayer#
         * @return {string} the version of the player
         */
        getVersion: function() {
            return VERSION;
        },

        /**
         * Returns the full version of the player (including git tag).
         * @method getVersionFull
         * @access public
         * @memberof MediaPlayer#
         * @return {string} the version of the player including git tag
         */
        getVersionFull: function() {
            if (GIT_TAG.indexOf("@@") === -1) {
                return VERSION + '_' + GIT_TAG;
            } else {
                return VERSION;
            }
        },

        /**
        * @access public
        * @memberof MediaPlayer#
        * @return date when the hasplayer has been built.
        */
        getBuildDate: function() {
            if (BUILD_DATE.indexOf("@@") === -1) {
                return BUILD_DATE;
            } else {
                return 'Not a builded version';
            }
        },

        /**
         * @access public
         * @memberof MediaPlayer#
         * @return TBD
         */
        getMetricsExt: function() {
            return this.metricsExt;
        },

        /**
         * Returns the Error object for the most recent error
         * @access public
         * @memberof OrangeHasPlayer#
         * @return {object} the Error object for the most recent error, or null if there has not been an error..
        */
        getError: function() {
            return error;
        },

        /**
         * Returns the Warning object for the most recent warning
         * @access public
         * @memberof OrangeHasPlayer#
         * @return {object} the Warning object for the most recent warning, or null if there has not been a warning..
         */
        getWarning: function() {
            return warning;
        },

        /**
         * @access public
         * @memberof MediaPlayer#
         * @return TBD
         */
        getAutoPlay: function() {
            return autoPlay;
        },

        /**
         * @access public
         * @memberof MediaPlayer#
         * @param value - .
         */
        setAutoPlay: function(value) {
            autoPlay = value;
        },

        /**
         * function to set some player configuration parameters
         * @access public
         * @memberof MediaPlayer#
         * @param params - configuration parameters
         * @see {@link http://localhost:8080/OrangeHasPlayer/samples/Dash-IF/hasplayer_config.json}
         *
         */
        setConfig: function(params) {
            if (this.config && params) {
                this.debug.log("[MediaPlayer] set config: " + JSON.stringify(params, null, '\t'));
                this.config.setParams(params);
            }
        },



        /**
         * Sets the default audio language. If the default language is available in the stream,
         * the corresponding audio track is selected. Otherwise, the first declared audio track in the manifest is selected.
         * This function has to be called before any other function 
         * @method setDefaultAudioLang
         * @access public
         * @memberof OrangeHasPlayer#
         * @param {string} lang - the default audio language based on ISO 3166-2
         */
        setDefaultAudioLang: function(language) {
            if (typeof lang !== 'string') {
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
         * @memberof OrangeHasPlayer#
         * @param {string} lang - the default subtitle language based on ISO 3166-2
         */
        setDefaultSubtitleLang: function(language) {
            if (typeof lang !== 'string') {
                throw new Error('OrangeHasPlayer.setDefaultSubtitleLang(): Invalid Arguments');
            }
            defaultSubtitleLang = language;
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
 * Static Functions
 */
/**
* Returns the current browser status on MSE support.
* @method hasMediaSourceExtension
* @static
* @return true if MSE is supported, false otherwise
*/
MediaPlayer.hasMediaSourceExtension = function() {

    return new MediaPlayer.utils.Capabilities().supportsMediaSource();
};

/**
 * Returns the current browser status on EME support.
 * @method hasMediaKeysExtension
 * @static
 * @return true if EME is supported, false otherwise
 */
MediaPlayer.hasMediaKeysExtension = function() {
    return new MediaPlayer.utils.Capabilities().supportsMediaKeys();
};
