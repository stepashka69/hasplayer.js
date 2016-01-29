define(function(require) {

    var applications = require('./applications');
    var streams = require('./streams');

    return {
        testPage: [
            applications.OrangeHasPlayer.development
        ],

        asyncTimeout: 5,

        testPlay: {
            streams: [ streams.MSS_LIVE_1, streams.MSS_LIVE_2, streams.MSS_VOD_1, streams.MSS_VOD_2 ]
        },

        testZapping: {
            streams: [ streams.MSS_LIVE_1, streams.MSS_LIVE_2, streams.MSS_LIVE_MULTI_AUDIO, streams.MSS_LIVE_SUBT_1, streams.MSS_VOD_1, streams.MSS_VOD_2 ]
        },

        testSeek: {
            streams:  [ streams.MSS_VOD_1, streams.MSS_VOD_2 ],
            seekCount: 5
        },

        testPause: {
            streams:  [ streams.MSS_VOD_1 ],
            pauseCount: 5
        }
    };
});
