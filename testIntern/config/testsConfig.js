define(function(require) {

    var applications = require('./applications');
    var streams = require('./streams');

    return {
        testPage: [
            applications.OrangeHasPlayer.development
        ],

        asyncTimeout: 10,

        tests : {

            play: {
                play: {
                    streams: [ streams.MSS_LIVE_1, streams.MSS_LIVE_2, streams.MSS_VOD_1, streams.MSS_VOD_2 ]
                },

                zapping: {
                    streams: [ streams.MSS_LIVE_1, streams.MSS_LIVE_2, streams.MSS_LIVE_MULTI_AUDIO, streams.MSS_LIVE_SUBT_1, streams.MSS_VOD_1, streams.MSS_VOD_2 ]
                },

                seek: {
                    streams:  [ streams.MSS_VOD_1, streams.MSS_VOD_2 ],
                    seekCount: 5
                },

                pause: {
                    streams:  [ streams.MSS_VOD_1 ],
                    pauseCount: 5
                }
            },

            api: {
                getVideoBitrates: {
                    streams:  [ streams.MSS_LIVE_1, streams.MSS_VOD_1 ]
                }
            },

            error: {
                downloadErrManifest: {
                    streams: [ streams.MSS_LIVE_MANIFEST_ERROR ]
                }
            }
        }
    };
});
