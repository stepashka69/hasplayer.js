define(function(require) {

    var applications = require('./applications');
    var streams = require('./streams');

    return {
        testPage: [
            applications.OrangeHasPlayer.development
        ],

        testPlay: {
            streams: [ streams.MSS_LIVE_1, streams.MSS_LIVE_2, streams.MSS_VOD_1, streams.MSS_VOD_2 ]
        },

        testZapping: {
            streams: [ streams.MSS_LIVE_1, streams.MSS_LIVE_2, streams.MSS_VOD_1, streams.MSS_VOD_2 ]
        },

        testSeek: {
            streams:  [ streams.MSS_VOD_1, streams.MSS_VOD_2 ],
            positions: [ 35, 10, 83, 23 ]
        }

    };
});
