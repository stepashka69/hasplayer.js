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
    var context,
        mediaPlayer,
        video,
        isFullScreen = false,
        isSubtitleVisible = true,
        audiotracks = [],
        subtitletracks = [],
        videoQualityChanged = [],
        videoBitrates = null,
        downloadedBdthValue = undefined,
        defaultAudioLang = 'und',
        defaultSubtitleLang = 'und',
        selectedAudioTrack = null,
        selectedSubtitleTrack = null,
        metricsAgent = undefined,
        state = 'UNINITIALIZED';

    var _isPlayerInitialized = function() {
        if (state === 'UNINITIALIZED') {
            throw new Error('OrangeHasPlayer.hasMediaSourceExtension(): Must not be in UNINITIALIZED state');
        }
    };

    var _onloaded = function(e) {
        if (video.textTracks.length > 0) {
            isSubtitleVisible === true ? video.textTracks[0].mode = 'showing' : video.textTracks[0].mode = 'hidden';
        }
    };

    var _dispatchBitrateEvent = function(type, value) {
        var event = document.createEvent("CustomEvent");
        event.initCustomEvent(type, false, false, {
            bitrate: value.switchedQuality,
            time : video.currentTime,
            width : value.width,
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
    };

    var _metricChanged = function(e) {
        var metricsExt,
            repSwitch,
            httpRequests,
            httpRequest,
            metrics;

        _isPlayerInitialized();
        metricsExt = mediaPlayer.getMetricsExt();

        if (e.data.stream == "video") {
            metrics = mediaPlayer.getMetricsFor("video");
            if (metrics && metricsExt) {
                repSwitch = metricsExt.getCurrentRepresentationSwitch(metrics);
                httpRequests = metricsExt.getHttpRequests(metrics);
                httpRequest = (httpRequests.length > 0) ? httpRequests[httpRequests.length - 1] : null;

                videoBitrates = metricsExt.getBitratesForType("video");

                // case of downloaded quality change
                if ((httpRequest !== null) && (videoBitrates[httpRequest.quality] != downloadedBdthValue)) {
                    downloadedBdthValue = videoBitrates[httpRequest.quality];
                    videoQualityChanged.push({
                        mediaStartTime: httpRequest.startTime,
                        switchedQuality: videoBitrates[httpRequest.quality],
                        downloadStartTime: httpRequest.trequest,
                        width: metricsExt.getVideoWidthForRepresentation(repSwitch.to),
                        height: metricsExt.getVideoHeightForRepresentation(repSwitch.to)
                    });
                    _dispatchBitrateEvent('download_bitrate', videoQualityChanged[videoQualityChanged.length-1]);
                }
            }
        }
    };

    /**
     * load a video stream with stream url and protection datas.
     * @method init
     * @access public
     * @memberof OrangeHasPlayer#
     * @param videoElement - an HTML5 video element used to decode and show media data.
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
     * load a video stream with stream url and protection datas.
     * @method load
     * @access public
     * @memberof OrangeHasPlayer#
     * @param url - manifest video url(Dash, Smooth or Hls manifest).
     * @param protData - informations about protection (back url and custom data are stored in a json object).
     */
    this.load = function(url, protData) {
        audiotracks = [];
        subtitletracks = [];

        downloadedBdthValue = undefined;
        videoQualityChanged = [];

        _isPlayerInitialized();

        if (metricsAgent && url) {
            metricsAgent.createSession();
        }

        //init default audio language
        mediaPlayer.setDefaultAudioLang(defaultAudioLang);
        //init default subtitle language
        mediaPlayer.setDefaultSubtitleLang(defaultSubtitleLang);
        mediaPlayer.attachSource(url, protData);
        if (mediaPlayer.getAutoPlay()) {
            state = 'PLAYER_RUNNING';
        }
    };

    /**
     * play the current content. If auto play value equals to true, this call isn't necessary after the load command.
     * @method play
     * @access public
     * @memberof OrangeHasPlayer#
     */
    this.play = function() {
        _isPlayerInitialized();

        if (state === "PLAYER_STOPPED" || state === "PLAYER_PAUSED") {
            video.play();
        } else {
            mediaPlayer.play();
        }

        state = 'PLAYER_RUNNING';
    };

    /**
     * Seek the content to the specify value. In VOD, this function have to test
     * if the value is between 0 and content duration.
     * In LIVE, this function will be used to move in the DVR window.
     * @method seek
     * @access public
     * @memberof OrangeHasPlayer#
     * @param time - time value in seconds.
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
     * Call the pause command on video element.
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
     * set the HasPlayer auto play to value.
     * @method setAutoPlay
     * @access public
     * @memberof OrangeHasPlayer#
     * @param value - auto play value.
     */
    this.setAutoPlay = function(value) {
        _isPlayerInitialized();
        mediaPlayer.setAutoPlay(value);
    };

    /**
     * get if the HasPlayer has enabled the auto play. Default value is true
     * @method getAutoPlay
     * @access public
     * @memberof OrangeHasPlayer#
     * @return auto play value
     */
    this.getAutoPlay = function() {
        _isPlayerInitialized();
        return mediaPlayer.getAutoPlay();
    };

    /**
     * used to stop streaming and seek to 0. After this call, a play command, without changing url, restarts
     * streaming from the beginning.
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
     * Reset HasPlayer data : stop downloading chunks elements, current url and protection data values set to null.
     * @method reset
     * @access public
     * @memberof OrangeHasPlayer#
     */
    this.reset = function() {
        _isPlayerInitialized();
        mediaPlayer.reset();
        if (metricsAgent) {
            metricsAgent.stop();
        }
    };

    /**
     * register events on either video or MediaPlayer element
     * @method addEventListener
     * @access public
     * @memberof OrangeHasPlayer#
     * @param type - event type, current video events and play_bitrate, download_bitrate events. On MediaPlayer class,
     * there is also error and subtitlesStyleChanged events.
     * @param listener - callback name.
     */
    this.addEventListener = function(type, listener) {
        switch (type) {
            case "error":
            case "subtitlesStyleChanged":
                mediaPlayer.addEventListener(type, listener);
                break;
            case "play_bitrate":
            case "download_bitrate":
                video.addEventListener(type, listener);
                break;
            default:
                video.addEventListener(type, listener);
        }
    };

    /**
     * unregister events on either video or MediaPlayer element
     * @method removeEventListener
     * @access public
     * @memberof OrangeHasPlayer#
     * @param type - event type, current video events and play_bitrate, download_bitrate events. On MediaPlayer class,
     * there is also error and subtitlesStyleChanged events.
     * @param listener - callback name.
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

    /**
     * get audio tracks array from adaptive manifest
     * @method getAudioTracks
     * @access public
     * @memberof OrangeHasPlayer#
     * @return audio tracks array
     */
    this.getAudioTracks = function() {
        var i = 0,
            mediaPlayerAudioTracks;

        _isPlayerInitialized();
        mediaPlayerAudioTracks = mediaPlayer.getAudioTracks();
        for (i = 0; i < mediaPlayerAudioTracks.length; i++) {
            audiotracks.push({
                id: mediaPlayerAudioTracks[i].id,
                lang: mediaPlayerAudioTracks[i].lang
            });
        }
        return audiotracks;
    };

    /**
     * set current audio track
     * @method setAudioTrack
     * @access public
     * @memberof OrangeHasPlayer#
     * @param audioTrack - current audio track.
     */
    this.setAudioTrack = function(audioTrack) {
        var i = 0,
            mediaPlayerAudioTracks;

        _isPlayerInitialized();
        mediaPlayerAudioTracks = mediaPlayer.getAudioTracks();
        for (i = 0; i < mediaPlayerAudioTracks.length; i++) {
            if ((audioTrack.id === mediaPlayerAudioTracks[i].id) ||
                (audioTrack.lang === mediaPlayerAudioTracks[i].lang)) {
                mediaPlayer.setAudioTrack(mediaPlayerAudioTracks[i]);
                return;
            }
        }

        throw new Error('OrangeHasPlayer.setAudioTrack():' + audioTrack.lang + 'is unknown');
    };

    /**
     * set current subtitle track
     * @method setSubtitleTrack
     * @access public
     * @memberof OrangeHasPlayer#
     * @param subtitleTrack - current subtitle track.
     */
    this.setSubtitleTrack = function(subtitleTrack) {
        var i = 0,
            mediaPlayerSubtitleTracks;

        _isPlayerInitialized();
        mediaPlayerSubtitleTracks = mediaPlayer.getSubtitleTracks();
        for (i = 0; i < mediaPlayerSubtitleTracks.length; i++) {
            if ((subtitleTrack.id === mediaPlayerSubtitleTracks[i].id) ||
                (subtitleTrack.lang === mediaPlayerSubtitleTracks[i].lang)) {
                mediaPlayer.setSubtitleTrack(mediaPlayerSubtitleTracks[i]);
                return;
            }
        }

        throw new Error('OrangeHasPlayer.setSubtitleTrack():' + subtitleTrack.lang + 'is unknown');
    };

    /**
     * get subtitle tracks array from adaptive manifest
     * @method getSubtitleTracks
     * @access public
     * @memberof OrangeHasPlayer#
     * @return subtitle tracks array
     */
    this.getSubtitleTracks = function() {
        var i = 0,
            mediaPlayerSubtitleTracks;

        _isPlayerInitialized();
        mediaPlayerSubtitleTracks = mediaPlayer.getSubtitleTracks();
        for (i = 0; i < mediaPlayerSubtitleTracks.length; i++) {
            subtitletracks.push({
                id: mediaPlayerSubtitleTracks[i].id,
                lang: mediaPlayerSubtitleTracks[i].lang
            });
        }
        return subtitletracks;
    };

    /**
     * set parameters on HasPlayer
     * @method setParams
     * @access public
     * @memberof OrangeHasPlayer#
     * @param config - json config to set.
     */
    this.setParams = function(config) {
        _isPlayerInitialized();
        mediaPlayer.setConfig(config);
    };

    /**
     * get video bitrates array from adaptive manifest
     * @method getVideoBitrates
     * @access public
     * @memberof OrangeHasPlayer#
     * @return video bitrates array
     */
    this.getVideoBitrates = function() {
        _isPlayerInitialized();
        return videoBitrates;
    };

    /**
     * get current media duration
     * @method getDuration
     * @access public
     * @memberof OrangeHasPlayer#
     * @return media duration in seconds, infinity for live content
     */
    this.getDuration = function() {
        _isPlayerInitialized();
        return video.duration;
    };

    /**
     * get position for the current media
     * @method getPosition
     * @access public
     * @memberof OrangeHasPlayer#
     * @return position in seconds
     */
    this.getPosition = function() {
        _isPlayerInitialized();
        if (!this.isLive()) {
            return video.currentTime;
        } else {
            return undefined;
        }
    };

    /**
     * used by webapp to notify HasPlayer that size of the main div has changed.
     * @method fullscreenChanged
     * @access public
     * @memberof OrangeHasPlayer#
     * @param value - the new fullscreen value
     */
    this.fullscreenChanged = function(value) {
        isFullScreen = !isFullScreen;
    };

    /**
     * @method getVersion
     * @access public
     * @memberof OrangeHasPlayer#
     * @return player version
     */
    this.getVersion = function() {
        _isPlayerInitialized();
        return mediaPlayer.getVersion();
    };

    /**
     * get the HAS version
     * @method getVersionHAS
     * @access public
     * @memberof OrangeHasPlayer#
     * @return hasplayer version
     */
    this.getVersionHAS = function() {
        _isPlayerInitialized();
        return mediaPlayer.getVersionHAS();
    };

    /**
     * get the full version (with git tag, only at build)
     * @method getVersionFull
     * @access public
     * @memberof OrangeHasPlayer#
     * @return full hasplayer version
     */
    this.getVersionFull = function() {
        _isPlayerInitialized();
        return mediaPlayer.getVersionFull();
    };

    /**
     * @method getBuildDate
     * @access public
     * @memberof OrangeHasPlayer#
     * @return date when the hasplayer has been built.
     */
    this.getBuildDate = function() {
        _isPlayerInitialized();
        return mediaPlayer.getBuildDate();
    };

    /**
     * get current quality for a stream
     * @method getQualityFor
     * @access public
     * @memberof OrangeHasPlayer#
     * @param  type - stream type, video or audio.
     * @return current quality for the selected type.
     */
    this.getQualityFor = function(type) {
        _isPlayerInitialized();
        return mediaPlayer.getQualityFor(type);
    };

    /**
     * get mute status.
     * @method getMute
     * @access public
     * @memberof OrangeHasPlayer#
     * @return true if player is mute, false otherwise
     */
    this.getMute = function() {
        _isPlayerInitialized();
        return video.muted;
    };

    /**
     * change the mute property of the player.
     * @method setMute
     * @access public
     * @memberof OrangeHasPlayer#
     * @param state - new mute state, true or false.
     */
    this.setMute = function(state) {
        _isPlayerInitialized();
        if (typeof state !== 'boolean') {
            throw new Error('OrangeHasPlayer.setMute(): Invalid Arguments');
        }
        video.muted = state;
    };

    /**
     * change volume level.
     * @method setVolume
     * @access public
     * @memberof OrangeHasPlayer#
     * @param volume - volume level, value is between 0 and 1.
     */
    this.setVolume = function(volume) {
        _isPlayerInitialized();
        if ((typeof volume !== 'number') || (volume < 0 && volume > 1)) {
            throw new Error('OrangeHasPlayer.setVolume(): Invalid Arguments');
        }

        video.volume = volume;
    };

    /**
     * get volume level
     * @method getVolume
     * @access public
     * @memberof OrangeHasPlayer#
     * @return current volume level between 0 and 1. Volume and mute are two differents attributes, volume level could be
     * 0,5 and mute property setted to true.
     */
    this.getVolume = function() {
        _isPlayerInitialized();
        return video.volume;
    };

    /**
     * give information to web app, to know if current stream is a live stream or not.
     * @method isLive
     * @access public
     * @memberof OrangeHasPlayer#
     * @return true if current stream is a live stream, false otherwise.
     */
    this.isLive = function() {
        _isPlayerInitialized();
        return video.duration !== Number.POSITIVE_INFINITY ? false : true;
    };

    /**
     * enable or disable debug informations.
     * @method setDebug
     * @access public
     * @memberof OrangeHasPlayer#
     * @param value - true, if debug has to be enabled, false otherwise.
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
     * Change Subtitles visibility
     * @method setSubtitleVisibility
     * @access public
     * @memberof OrangeHasPlayer#
     * @param  value - true to set textTraks mode to showing, false to set textTraks mode to hidden.
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
     * get Subtitles visibility.
     * @method getSubtitleVisibility
     * @access public
     * @memberof OrangeHasPlayer#
     * @return visibility - true if subtitles are showing, false otherwise.
     */
    this.getSubtitleVisibility = function() {
        _isPlayerInitialized();

        return isSubtitleVisible;
    };

    /**
     * set the default audio language. If the current language is available in the stream,
     * the audio track will be activated. By default, the first audio track is selected.
     * @method
     * @access public
     * @memberof OrangeHasPlayer#
     * @param value - language value is based on ISO 3166-2, for instance 'eng'.
     */
    this.setDefaultAudioLang = function(value) {
        if (typeof value !== 'string') {
            throw new Error('OrangeHasPlayer.setDefaultAudioLang(): Invalid Arguments');
        }
        defaultAudioLang = value;
    };

    /**
     * set the default subtitle language. If the current language is available in the stream,
     * the subtitle track will be activated. By default, the first subtitle track is selected.
     * @method setDefaultSubtitleLang
     * @access public
     * @memberof OrangeHasPlayer#
     * @param value - language value is based on ISO 3166-2, for instance 'eng'.
     */
    this.setDefaultSubtitleLang = function(value) {
        if (typeof value !== 'string') {
            throw new Error('OrangeHasPlayer.setDefaultSubtitleLang(): Invalid Arguments');
        }
        defaultSubtitleLang = value;
    };

    /**
     * get the current selected audio track. It's useful if the default language has not been detected
     * in the manifest stream.
     * @method getSelectedAudioTrack
     * @access public
     * @memberof OrangeHasPlayer#
     * @return current selected audio track
     */
    this.getSelectedAudioTrack = function() {
        var i = 0,
            selectedTrack;

        _isPlayerInitialized();

        selectedTrack = mediaPlayer.getSelectedAudioTrack();

        for (i = 0; i < audiotracks.length; i++) {
            if (audiotracks[i].id === selectedTrack.id ||
                audiotracks[i].lang === selectedTrack.lang) {
                selectedAudioTrack = audiotracks[i];
                return selectedAudioTrack;
            }
        }
        return null;
    };

    /**
     * get the current selected subtitle track. It's useful if the default language has not been detected
     * in the manifest stream.
     * @method getSelectedSubtitleTrack
     * @access public
     * @memberof OrangeHasPlayer#
     * @return current selected subtitle track
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

    /**
     * load metrics Agent with the parameters values.
     * @method loadMetricsAgent
     * @access public
     * @memberof OrangeHasPlayer#
     * @param  parameters -  {json} parameters The parameters.
     *                       @param {String} parameters.name
     *                       @param {String} parameters.activationUrl
     *                       @param {String} parameters.serverUrl
     *                       @param {String} parameters.dbServerUrl
     *                       @param {String} parameters.collector
     *                       @param {String} parameters.formatter
     *                       @param {Integer} parameters.sendingTime
     */
    this.loadMetricsAgent = function(parameters) {
        _isPlayerInitialized();

        if (typeof(MetricsAgent) !== 'undefined') {
            metricsAgent = new MetricsAgent(mediaPlayer, video, parameters, mediaPlayer.getDebug());

            metricsAgent.init(function(activated) {
                console.log("Metrics agent state: ", activated);
            });
        }else{
            throw new Error('OrangeHasPlayer.loadMetricsAgent(): MetricsAgent is undefined');
        }
    };
};

/**
 * give the current browser status on MSE support.
 * @method hasMediaSourceExtension
 * @static
 * @return true if MSE is supported, false otherwise.
 */
OrangeHasPlayer.hasMediaSourceExtension = function() {
    return new MediaPlayer.utils.Capabilities().supportsMediaSource();
};

/**
 * give the current browser status on EME support.
 * @method hasMediaKeysExtension
 * @static
 * @return true if EME is supported, false otherwise.
 */
OrangeHasPlayer.hasMediaKeysExtension = function() {
    return new MediaPlayer.utils.Capabilities().supportsMediaKeys();
};
