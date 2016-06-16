
define([], function () {
    return {

        loadStream: function(stream) {
            // console.log('load stream', stream);
            if(stream.tvmUrl) {
                streamsPanel.loadTVMSource(stream, function(tvmStream) {
                    orangeHasPlayer.load(tvmStream.url, tvmStream.protData);
                })
            } else {
                orangeHasPlayer.load(stream.url, stream.protData);
            }
        },

        getDuration: function() {
            return orangeHasPlayer.getDuration();
        },

        play: function() {
            orangeHasPlayer.play();
        },

        pause: function() {
            orangeHasPlayer.pause();
        },

        stop: function() {
            orangeHasPlayer.stop();
        },

        seek: function(pos, done) {
            var onSeeked = function() {
                    orangeHasPlayer.removeEventListener('seeked', onSeeked);
                    done(true);
                };

            orangeHasPlayer.addEventListener('seeked', onSeeked);
            orangeHasPlayer.seek(pos);
        },

        setMute: function(isMute) {
            orangeHasPlayer.setMute(isMute);
        },

        getMute: function() {
            return orangeHasPlayer.getMute();
        },

        setTrickModeSpeed: function(speed) {
            orangeHasPlayer.setTrickModeSpeed(speed);
        },

        getTrickModeSpeed: function(speed) {
            return orangeHasPlayer.getTrickModeSpeed();
        },

        getVideoBitrates: function() {
            return orangeHasPlayer.getVideoBitrates();
        },

        getAudioLanguages: function() {
            return orangeHasPlayer.getTracks(MediaPlayer.TRACKS_TYPE.AUDIO);
        },

        getSelectedAudioLanguage: function() {
            return orangeHasPlayer.getSelectedTrack(MediaPlayer.TRACKS_TYPE.AUDIO);
        },

        setSelectedAudioLanguage: function(audioTrack) {
            orangeHasPlayer.selectTrack(MediaPlayer.TRACKS_TYPE.AUDIO,audioTrack);
        },

        setDefaultAudioLanguage: function(lang) {
            orangeHasPlayer.setDefaultAudioLang(lang);
        },

        getSubtitleLanguages: function() {
            return orangeHasPlayer.getTracks(MediaPlayer.TRACKS_TYPE.TEXT);
        },

        getSelectedSubtitleLanguage: function() {
            return orangeHasPlayer.getSelectedTrack(MediaPlayer.TRACKS_TYPE.TEXT);
        },

        setSelectedSubtitleLanguage: function(subtitleTrack) {
            orangeHasPlayer.selectTrack(MediaPlayer.TRACKS_TYPE.TEXT,subtitleTrack);
        },

        setSubtitlesVisibility: function(state) {
            orangeHasPlayer.enableSubtitles(state);
        },

        getSubtitlesVisibility: function() {
            return orangeHasPlayer.isSubtitlesEnabled();
        },

        enableSubtitleExternDisplay: function(state) {
            orangeHasPlayer.enableSubtitleExternDisplay(state);
        },

        setDefaultSubtitleLanguage: function(lang) {
            orangeHasPlayer.setDefaultSubtitleLang(lang);
        },

        isLive: function() {
            return orangeHasPlayer.isLive();
        },

        getDVRWindowRange: function() {
            return orangeHasPlayer.getDVRWindowRange();
        },

        waitForEvent: function (event, done) {
            var onEventHandler = function(param) {
                    orangeHasPlayer.removeEventListener(event, onEventHandler);
                    done(param ? param : true);
                };

            orangeHasPlayer.addEventListener(event, onEventHandler);
        },

        getErrorCode: function (done) {
            var error = orangeHasPlayer.getError(),
                onError = function(err) {
                    orangeHasPlayer.removeEventListener('error', onError);
                    done(err.data.code);
                };

            if (error) {
                done(error.code);
            } else {
                orangeHasPlayer.addEventListener('error', onError);
            }
        },

        getWarningCode: function(done){
            var warning = orangeHasPlayer.getWarning(),
                onWarning = function(warn){
                    orangeHasPlayer.removeEventListener('warning', onWarning);
                    done(warn.data.code);
                }
                if(warning){
                    done(warning.data.code);
                }else{
                    orangeHasPlayer.addEventListener('warning', onWarning);
                }
        }
    };
});
