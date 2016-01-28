
define([], function () {
    return {

        loadStream: function(stream) {
            orangeHasPlayer.load(stream.url);
        },

        getDuration: function() {
            return orangeHasPlayer.getDuration();
        },

        seek: function(pos) {
            orangeHasPlayer.seek(pos);
        }

    };
});
