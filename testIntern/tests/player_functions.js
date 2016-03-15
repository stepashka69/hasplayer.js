
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

        seek: function(pos, done) {
            var onSeeked = function() {
                    orangeHasPlayer.removeEventListener('seeked', onSeeked);
                    done(true);
                };

            orangeHasPlayer.addEventListener('seeked', onSeeked);
            orangeHasPlayer.seek(pos);
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

        waitForEvent: function (event, done) {
            var onEventHandler = function() {
                    orangeHasPlayer.removeEventListener(event, onEventHandler);
                    done(true);
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
