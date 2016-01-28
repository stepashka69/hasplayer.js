
define(function () {

    return {

        play: function () {
            document.querySelector('video').play();
        },

        stop: function () {
            document.querySelector('video').stop();
        },

        getCurrentTime: function() {
            return document.querySelector('video').currentTime;
        },

        getDuration: function() {
            return document.querySelector('video').duration;
        },

        seek: function (time) {
            document.querySelector('video').currentTime = time;
        },

        isPaused: function () {
            return document.querySelector('video').isPaused;
        },

        isPlaying: function (done) {
            var video = document.querySelector('video'),
                onPlaying = function(){
                    video.removeEventListener('playing', onPlaying);
                    done(true);
                };
            video.addEventListener('playing', onPlaying);
            if(!video.paused && video.playbackRate > 0){
                video.removeEventListener('playing', onPlaying);
                done(true);
            }
        },

        isProgressing: function(time, done){
            var video = document.querySelector('video'),
                startingTime=-1,
                onTimeUpdate = function() {
                    if (startingTime < 0) {
                        startingTime = video.currentTime;
                    } else {
                        if (video.currentTime >= startingTime + time){
                            video.removeEventListener('timeupdate', onTimeUpdate);
                            done(true);
                        }
                    }
                };
            video.addEventListener('timeupdate', onTimeUpdate);
        }

    };
});

