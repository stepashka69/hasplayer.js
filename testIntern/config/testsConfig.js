define(function(require) {

    var applications = require('./applications');
    var platforms = require('./platforms');
    var streams = require('./streams');

    return {
        testPage: [
            applications.OrangeHasPlayer.development
        ],

        asyncTimeout: 10,

        drm: true,

        platform: platforms.qualif,

        tests : {

            play: {
                play: {
                    streams: [
                        streams.MSS_LIVE_1,
                        streams.MSS_LIVE_2,
                        streams.MSS_VOD_1,
                        streams.MSS_VOD_2
                    ]
                },
                
                playDrm: {
                    streams: [
                        streams.MSS_LIVE_1,
                        streams.MSS_LIVE_DRM_1,
                        streams.MSS_VOD_1,
                        streams.MSS_LIVE_DRM_2,
                        streams.MSS_VOD_2
                    ]
                },

                zapping: {
                    streams: [
                        streams.MSS_LIVE_1,
                        streams.MSS_LIVE_2,
                        streams.MSS_LIVE_MULTI_AUDIO,
                        streams.MSS_LIVE_SUBT_1,
                        streams.MSS_VOD_1,
                        streams.MSS_VOD_2
                    ]
                },
                
                zappingDrm:{
                    streams: [
                        streams.MSS_LIVE_1,
                        streams.MSS_LIVE_DRM_1,
                        streams.MSS_LIVE_2,
                        streams.MSS_LIVE_MULTI_AUDIO,
                        streams.MSS_LIVE_DRM_2,
                        streams.MSS_LIVE_SUBT_1,
                        streams.MSS_VOD_1,
                        streams.MSS_VOD_2
                    ]
                },

                seek: {
                    streams: [
                        streams.MSS_VOD_1,
                        streams.MSS_VOD_2,
                        streams.MSS_VOD_3
                    ],
                    seekCount: 5
                },

                pause: {
                    streams: [
                        streams.MSS_VOD_1
                    ],
                    pauseCount: 5
                },

                trickMode: {
                    streams: [
                        streams.MSS_VOD_3
                    ]
                },
            },

            api: {
                getVideoBitrates: {
                    streams: [
                        streams.MSS_LIVE_1,
                        streams.MSS_VOD_1
                    ]
                }
            },

            error: {
                errorManifest: {
                    streams: [
                        streams.MSS_LIVE_UNKNOWN_MANIFEST_TYPE_ERROR,
                        streams.MSS_LIVE_MANIFEST_ERROR,
                        streams.MSS_LIVE_MALFORMED_MANIFEST_ERROR,
                        streams.MSS_LIVE_UNSUPPORTED_AUDIO_CODEC_ERROR,
                        streams.MSS_VOD_WRONG_AUDIO_CODEC_ERROR,
                        streams.MSS_LIVE_EMPTY_VIDEO_FOURCC_ERROR,
                        streams.MSS_LIVE_VIDEO_FOURCC_UNSUPPORTED_ERROR,
                        streams.HLS_LIVE_MANIFEST_MISSING_ERROR
                    ],
                    expectedErrorCode: [
                        'MANIFEST_ERR_PARSE',
                        'DOWNLOAD_ERR_MANIFEST',
                        'MANIFEST_ERR_PARSE',
                        'MEDIA_ERR_CODEC_UNSUPPORTED',
                        'MEDIA_ERR_CODEC_UNSUPPORTED',
                        'MEDIA_ERR_CODEC_UNSUPPORTED',
                        'MEDIA_ERR_CODEC_UNSUPPORTED',
                        'MANIFEST_ERR_PARSE'
                    ]
                }
            }
        }
    };
});
