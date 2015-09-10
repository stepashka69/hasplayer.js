    var orangeHasPlayer = null,
        config = null,
        configMetrics = {
            'name': 'Prisme (local)',
            'activationUrl': '',
            'serverUrl': 'http://localhost:8080/metrics',
            'enable': true,
            'eventsObjectFilter': 'session;realtime',
            'eventTypeSessionFilter': 'error;profil,10,10;usage',
            'eventTypeRealTimeFilter': 'error,10,40,99;profil',
            'dbServerUrl': 'http://localhost:8080/metricsDB',
            'collector': 'HasPlayerCollector',
            'formatter': 'Prisme',
            'sendingTime': 10000
        };

    /********************************************************************************************************************
     *
     *
     *                  Init functions
     *
     *
     **********************************************************************************************************************/
    function createHasPlayer() {
        orangeHasPlayer = new OrangeHasPlayer();
        orangeHasPlayer.init(video);
        orangeHasPlayer.setInitialQualityFor('video', 0);
        orangeHasPlayer.setInitialQualityFor('audio', 0);
        loadHasPlayerConfig('json/hasplayer_config.json');
        //orangeHasPlayer.loadMetricsAgent(configMetrics);

        orangeHasPlayer.setDefaultAudioLang('fra');
        orangeHasPlayer.setDefaultSubtitleLang('fre');

        registerHasPlayerEvents();
    }

    function registerHasPlayerEvents() {
        orangeHasPlayer.addEventListener('error', onError);
        orangeHasPlayer.addEventListener('subtitlesStyleChanged', onSubtitlesStyleChanged);
        orangeHasPlayer.addEventListener('loadeddata', onload);
        orangeHasPlayer.addEventListener('play_bitrate', onPlayBitrateChanged);
        orangeHasPlayer.addEventListener('download_bitrate', onDownloadBitrateChanged);
        orangeHasPlayer.addEventListener('volumechange', onVolumeChange);
        orangeHasPlayer.addEventListener('play', onPlay);
        orangeHasPlayer.addEventListener('pause', onPause);
        orangeHasPlayer.addEventListener('timeupdate', onTimeUpdate);
    }

    function loadHasPlayerConfig(fileUrl) {
        var reqConfig = new XMLHttpRequest();

        reqConfig.onload = function() {
            if (reqConfig.status === 200) {
                config = JSON.parse(reqConfig.responseText);
                if (orangeHasPlayer && config) {
                    orangeHasPlayer.setParams(config);
                }
            }
        };

        reqConfig.open('GET', fileUrl, true);
        reqConfig.setRequestHeader('Content-type', 'application/json');
        reqConfig.send();
    }

    /********************************************************************************************************************
     *
     *
     *                   OrangeHasPlayer Events
     *
     *
     **********************************************************************************************************************/
    /**
     * [onload description]
     * @return {[type]} [description]
     */
    function onload() {
        //handle onload events to get audio, subtitles tracks, etc...
        //init audio tracks
        handleAudioDatas(orangeHasPlayer.getAudioTracks(), orangeHasPlayer.getSelectedAudioTrack());
        //init subtitle tracks
        handleSubtitleDatas(orangeHasPlayer.getSubtitleTracks(), orangeHasPlayer.getSelectedSubtitleTrack());
        //init duration value for VOD content
        handleDuration(orangeHasPlayer.getDuration());
        //init bitrates graph
        handleBitrates(orangeHasPlayer.getVideoBitrates());
    }

    /**
     * [onSubtitlesStyleChanged description]
     * @param  {[type]} style [description]
     */
    function onSubtitlesStyleChanged(style) {
        handleSubtitleStyleChange(style);
    }

    /**
     * [onError description]
     * @param  {[type]} e [description]
     */
    function onError(e) {
        orangeHasPlayer.reset(2);
        handleError(e);
    }

    /**
     * [onPlayBitrateChanged description]
     * @param  {[type]} e [description]
     */
    function onPlayBitrateChanged(e) {
        if (e.detail.type === 'video') {
            handlePlayBitrate(e.detail.bitrate, e.detail.time);
        }
    }

    function onDownloadBitrateChanged(e) {
        if (e.detail.type === 'video') {
            handleDownloadedBitrate(e.detail.bitrate, e.detail.time);
        }
    }

    function onVolumeChange() {
        handleVolumeChange(orangeHasPlayer.getVolume());
    }

    function onPlay() {
        handlePlayState(true);
    }

    function onPause() {
        handlePlayState(false);
    }

    function onTimeUpdate() {
        //update progress bar in GUI.
        if (!orangeHasPlayer.isLive()) {
            handleTimeUpdate(video.currentTime);
        }
    }

    /********************************************************************************************************************
     *
     *
     *                   OrangeHasPlayer function calls
     *
     *
     **********************************************************************************************************************/
    function loadStream(streamInfos) {
        if (!optimizedZappingEnabled) {
            orangeHasPlayer.setInitialQualityFor('video', 0);
            orangeHasPlayer.setInitialQualityFor('audio', 0);
        }
        orangeHasPlayer.load(streamInfos.url, streamInfos.protData);
    }

    function changeAudio(index) {
        orangeHasPlayer.setAudioTrack(audioTracks[index]);
    }

    function changeSubtitle() {
        orangeHasPlayer.setSubtitleTrack(subtitleTracks[subtitleList.selectedIndex]);
    }

    function setPlayerMute() {
        orangeHasPlayer.setMute(!orangeHasPlayer.getMute());
    }

    function setPlayerVolume(value) {
        orangeHasPlayer.setVolume(value);
    }

    function changePlayerState() {
        if (video.paused) {
            orangeHasPlayer.play();
        } else {
            if (orangeHasPlayer.isLive()) {
                orangeHasPlayer.stop();
            } else {
                orangeHasPlayer.pause();
            }
        }
    }

    function setSeekValue(seekTime) {
        orangeHasPlayer.seek(seekTime);
    }
    /**********************************************************************************************************************/
