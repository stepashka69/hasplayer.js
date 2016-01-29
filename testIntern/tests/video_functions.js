
define(function () {

    return {

        play: function () {
            document.querySelector('video').play();
        },

        pause: function () {
            document.querySelector('video').pause();
        },

        stop: function () {
            document.querySelector('video').stop();
        },

        seek: function (time) {
            document.querySelector('video').currentTime = time;
        },

        getCurrentTime: function() {
            return document.querySelector('video').currentTime;
        },

        getDuration: function() {
            return document.querySelector('video').duration;
        },

        isPaused: function () {
            return document.querySelector('video').paused;
        },

        isPlaying: function (delay, done) {
            var video = document.querySelector('video'),
                startTime = -1,
                onPlaying = function() {
                    video.removeEventListener('playing', onPlaying);
                    isProgressing(delay, done);
                },
                onTimeUpdate = function() {
                    if (startTime < 0) {
                        startTime = video.currentTime;
                    } else {
                        if (video.currentTime >= startTime + delay) {
                            video.removeEventListener('timeupdate', onTimeUpdate);
                            done(true);
                        }
                    }
                },
                isProgressing = function(delay, done) {
                    if (delay <= 0) {
                        done(true);
                    } else {
                        video.addEventListener('timeupdate', onTimeUpdate);
                    }
                };

            video.addEventListener('playing', onPlaying);
            if (!video.paused && video.playbackRate > 0) {
                video.removeEventListener('playing', onPlaying);
                isProgressing(delay, done);
            }
        }

    };
});

