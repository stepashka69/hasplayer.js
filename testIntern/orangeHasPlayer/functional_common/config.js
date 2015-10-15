define({
    //Test page url
    testPage: [
        'http://tv-has.orange-labs.fr/orangehasplayer/dev/index.html'
    ],
    videoBitrates: [
        {
            stream: 'http://pc-selenium.rd.francetelecom.fr:8084/MSS/Big Buck Bunny/Manifest',
            bitrates: [320000, 680000, 1100000, 1600000, 2100000]
        },
        {
            stream: 'http://pc-selenium.rd.francetelecom.fr:8084/MSS/France2/Manifest',
            bitrates: [226000, 400000, 680000, 1200000, 2100000]
        },
        {
            stream: 'http://2is7server1.rd.francetelecom.com/C4/C4-46_S1.isml/Manifest',
            bitrates: [226000, 416000, 680000, 1200000]
        },
        {
            stream: 'http://pc-selenium.rd.francetelecom.fr:8084/MSS/SuperSpeedway/Manifest',
            bitrates: [230000, 331000, 477000, 688000, 991000, 1427000, 2056000, 2962000]
        },
    ],
    audioTracks: [
        {
            stream: 'http://pc-selenium.rd.francetelecom.fr:8084/MSS/Big Buck Bunny/Manifest',
            audioTracks: [{id: 'audio', lang: null}]
        },
        {
            stream: 'http://pc-selenium.rd.francetelecom.fr:8084/MSS/France2/Manifest',
            audioTracks: [{id: 'audio101_fra', lang: 'fra'}]
        },
        {
            stream: 'http://2is7server1.rd.francetelecom.com/C4/C4-46_S1.isml/Manifest',
            audioTracks: [{id: 'audio101_fra', lang: 'fra'}]
        },
        {
            stream: 'http://pc-selenium.rd.francetelecom.fr:8084/MSS/SuperSpeedway/Manifest',
            audioTracks: [{id: 'audio', lang: null}]
        },
    ],
    //Test Live stream play (playing after 10 seconds with buffering margin of 2 seconds)
    playLive: [
        {stream: 'http://pc-selenium.rd.francetelecom.fr:8084/MSS/France2/Manifest'},
        {stream: 'http://2is7server1.rd.francetelecom.com/C4/C4-46_S1.isml/Manifest'}
    ],
    //Test VOD stream play (playing after 10 seconds with buffering margin of 2 seconds)
    playVod: [
        {stream: 'http://pc-selenium.rd.francetelecom.fr:8084/MSS/SuperSpeedway/Manifest'}
    ],
    //Test VOD stream stop
    stopVod: [
        {stream: 'http://pc-selenium.rd.francetelecom.fr:8084/MSS/SuperSpeedway/Manifest'}
    ],
    //Test Live stream stop
    stopLive: [
        {stream: 'http://pc-selenium.rd.francetelecom.fr:8084/MSS/France2/Manifest'}
    ],
    //Test live and VoD detection and specific methods behavior
    liveOrVod: [
        {stream: 'http://pc-selenium.rd.francetelecom.fr:8084/MSS/France2/Manifest'},
        {stream: 'http://pc-selenium.rd.francetelecom.fr:8084/MSS/SuperSpeedway/Manifest'}
    ],
    //Test Playing, Seek and Loop
    seek: [
        {
            stream: 'http://pc-selenium.rd.francetelecom.fr:8084/MSS/Big Buck Bunny/Manifest',
            duration: 596,
            seekCount:10
        },
        //{stream: 'http://2is7server1.rd.francetelecom.com/VOD/Volver/PIVOT VOLVER_PS_smooth.ism/Manifest'},
        {
            stream: 'http://pc-selenium.rd.francetelecom.fr:8084/MSS/SuperSpeedway/Manifest',
            duration: 121,
            seekCount:10
        }
    ],
    //Test startTime param: seek at start
    startTime: [
        {
            stream: 'http://pc-selenium.rd.francetelecom.fr:8084/MSS/SuperSpeedway/Manifest',
            time: 50
        }
    ],
    //Test Multiaudio change from first track to the second one (for multiaudio videos only)
    //Params correspond to first and second audio tracks (regex that match the audio fragments url for)
    multiAudio: [
        {
            stream: 'http://pc-selenium.rd.francetelecom.fr:8084/MSS/Arte/manifest',
            tracks: [
                {
                    id: 'audio102_deu',
                    lang: 'audio102_deu'
                },
                {
                    id: 'audio101_fra',
                    lang: 'audio101_fra'
                }
            ]
        }/*,
        {
            stream: 'http://2is7server1.rd.francetelecom.com/C4/C4-49_S1.isml/Manifest',
            tracks: [
                {
                    id: 'audio102_deu',
                    lang: 'deu'
                },
                {
                    id: 'audio101_fra',
                    lang: 'fra'
                }
            ]
        }*/
    ],
    subtitles: [
        {
            stream: 'http://pc-selenium.rd.francetelecom.fr:8084/MSS/Arte/manifest',
            tracks: [
                {
                    id: 'textstream_fra',
                    lang: 'fra'
                },
                {
                    id: 'textstream_fre',
                    lang: 'fre'
                }
            ]
        }
    ],
    volume: [
        {stream: 'http://pc-selenium.rd.francetelecom.fr:8084/MSS/France2/Manifest'},
        {stream: 'http://pc-selenium.rd.francetelecom.fr:8084/MSS/Big Buck Bunny/Manifest'}
    ],
    events: [
        {stream: 'http://pc-selenium.rd.francetelecom.fr:8084/MSS/Big Buck Bunny/Manifest'}
    ],
    errors: [
        {
            stream: 'http://pc-selenium.rd.francetelecom.fr:8084/bad_url',
            error: 'DOWNLOAD_ERR_MANIFEST',
            msg: 'Failed loading manifest: http://pc-selenium.rd.francetelecom.fr:8084/bad_url no retry attempts left'
        },
        {
            stream: 'http://pc-selenium.rd.francetelecom.fr:8084/HLS/ch1 - Manifest missing/Manifest',
            error: 'DOWNLOAD_ERR_MANIFEST',
            msg: 'Failed loading manifest: http://pc-selenium.rd.francetelecom.fr:8084/HLS/ch1 - Manifest missing/Manifest no retry attempts left'
        },
        {
            stream: 'http://pc-selenium.rd.francetelecom.fr:8084/MSS/France2 - Manifest Error/Manifest',
            error: 'MANIFEST_ERR_PARSE',
            msg: 'parsing the manifest failed : [MssParser] Failed to parse manifest!!'
        },
        {
            stream: 'http://pc-selenium.rd.francetelecom.fr:8084/MSS/France2- Unknown Manifest type/Manifest',
            error: 'MANIFEST_ERR_PARSE',
            msg: 'parsing the manifest failed : manifest cannot be parsed, protocol is unsupported!'
        },
        {
            stream: 'http://pc-selenium.rd.francetelecom.fr:8084/MSS/France2 - Audio Quality Not Available Error/Manifest',
            error: 'DOWNLOAD_ERR_CONTENT',
            msg: 'audio: Failed to load a request at startTime = 2246462.6478438'
        },
        {
            stream: 'http://pc-selenium.rd.francetelecom.fr:8084/MSS/France2 - Audio Unsupported Codec/Manifest',
            error: 'MANIFEST_ERR_CODEC',
            msg: 'Audio Codec (audio/mp4;codecs="mp4a.40.0") is not supported.'
        },
        {
            stream: 'http://pc-selenium.rd.francetelecom.fr:8084/MSS/Arte - Wrong audio codec data/manifest',
            error: 'MANIFEST_ERR_CODEC',
            msg: 'Audio Codec (audio/mp4;codecs="mp4a.40.0") is not supported.'
        },
        {
            stream: 'http://pc-selenium.rd.francetelecom.fr:8084/MSS/France2 - Video FourCC Unsupported/Manifest',
            error: 'MANIFEST_ERR_CODEC',
            msg: 'Video Codec (video/mp4;codecs="undefined") is not supported.'
        },
        {
            stream: 'http://pc-selenium.rd.francetelecom.fr:8084/MSS/France2 - Video FourCC empty/Manifest',
            error: 'MANIFEST_ERR_CODEC',
            msg: 'Video Codec (video/mp4;codecs="undefined") is not supported.'
        },
        {
            stream: 'http://pc-selenium.rd.francetelecom.fr:8084/MSS/France2 - Audio FourCC empty/Manifest',
            error: 'MANIFEST_ERR_CODEC',
            msg: 'Audio Codec (audio/mp4;codecs="undefined") is not supported.'
        },
        /*{
            stream: 'http://pc-selenium.rd.francetelecom.fr:8084/MSS/France2 - No Stream/Manifest',
            error: 'MANIFEST_ERR_NOSTREAM',
            msg: 'No streams to play.'
        },*/
        {
            stream: 'http://pc-selenium.rd.francetelecom.fr:8084/MSS/France2 - Truncated segment/Manifest',
            error: 'MEDIA_ERR_DECODE',
            msg: '<video> error event</video>'
        }
    ]
});
