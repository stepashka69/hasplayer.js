define(function(require) {

    var applications = require('./applications');
    var streams = require('./streams');

    return {
        testPage: [
            applications.OrangeHasPlayer.development
        ],

        playLive: {
            streams: [ streams.MSS_LIVE_1, streams.MSS_LIVE_2 ]
        },

        seek: {
            streams:  [ streams.MSS_VOD_1, streams.MSS_VOD_2 ],
            positions: [ 35, 10, 83, 23 ]
        }

    };
});
