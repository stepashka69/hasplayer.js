
define([], function () {
    return {

        loadStream: function(stream) {
            orangeHasPlayer.load(stream.url);
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

        seek: function(pos) {
            orangeHasPlayer.seek(pos);
        },
    };
});
