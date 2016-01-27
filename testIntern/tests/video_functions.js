
define(function () {


    return {

        getVideo: function () {
            return document.querySelector('video');
        },

        play: function () {
            this.getVideo().play();
        },

        stop: function () {
            this.getVideo().stop();
        },

        getCurrentTime: function() {
            return document.querySelector('video').currentTime;
        },

        seek: function (time) {
            getVideo().currentTime = time;
        },

        isPaused: function () {
            return getVideo().isPaused;
        },

        isPlaying: function (done) {
            var vid = document.querySelector('video'),
                onPlaying = function(){
                    vid.removeEventListener('playing', onPlaying);
                    done(true);
                };
            vid.addEventListener('playing', onPlaying);
            if(!vid.paused && vid.playbackRate >0){
                vid.removeEventListener('playing', onPlaying);
                done(true);
            }
        },

        stillPlaying: function(time, done){
            var vid = document.querySelector('video'),
                startingTime=-1,
                onTimeUpdate = function(){
                    if(startingTime<0){
                        startingTime = vid.currentTime;
                    }else{
                        if(vid.currentTime >= startingTime + time){
                            vid.removeEventListener('timeupdate', onTimeUpdate);
                            done(true);
                        }
                    }
                };
            vid.addEventListener('timeupdate', onTimeUpdate);
        }

    };
});

