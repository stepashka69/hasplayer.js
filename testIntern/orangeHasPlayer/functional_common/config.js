define({
    //Test page url
    testPage: [
        'http://tv-has.orange-labs.fr/orangehasplayer/dev/index.html'
    ],
    videoBitrates: [
        {
            stream: 'http://2is7server1.rd.francetelecom.com/VOD/BBB-SD/big_buck_bunny_1080p_stereo.ism/Manifest',
            bitrates: [320000, 680000, 1100000, 1600000, 2100000]
        },
        {
            stream: 'http://2is7server1.rd.francetelecom.com/C4/C4-46_S2.isml/Manifest',
            bitrates: [226000, 400000, 680000, 1200000, 2100000]
        },
        {
            stream: 'http://2is7server1.rd.francetelecom.com/C4/C4-46_S1.isml/Manifest',
            bitrates: [226000, 416000, 680000, 1200000]
        },
        {
            stream: 'http://playready.directtaps.net/smoothstreaming/SSWSS720H264/SuperSpeedway_720.ism/Manifest',
            bitrates: [230000, 331000, 477000, 688000, 991000, 1427000, 2056000, 2962000]
        },
    ],
    audioTracks: [
        {
            stream: 'http://2is7server1.rd.francetelecom.com/VOD/BBB-SD/big_buck_bunny_1080p_stereo.ism/Manifest',
            audioTracks: [{id: 'audio', lang: null}]
        },
        {
            stream: 'http://2is7server1.rd.francetelecom.com/C4/C4-46_S2.isml/Manifest',
            audioTracks: [{id: 'audio102_qad', lang: 'qad'}, {id: 'audio101_fra', lang: 'fra'}]
        },
        {
            stream: 'http://2is7server1.rd.francetelecom.com/C4/C4-46_S1.isml/Manifest',
            audioTracks: [{id: 'audio101_fra', lang: 'fra'}]
        },
        {
            stream: 'http://playready.directtaps.net/smoothstreaming/SSWSS720H264/SuperSpeedway_720.ism/Manifest',
            audioTracks: [{id: 'audio', lang: null}]
        },
    ],
    //Test Live stream play (playing after 10 seconds with buffering margin of 2 seconds)
    playLive: [
        {stream: 'http://2is7server1.rd.francetelecom.com/C4/C4-46_S2.isml/Manifest'},
        {stream: 'http://2is7server1.rd.francetelecom.com/C4/C4-46_S1.isml/Manifest'}
    ],
    //Test VOD stream play (playing after 10 seconds with buffering margin of 2 seconds)
    playVod: [
        {stream: 'http://playready.directtaps.net/smoothstreaming/SSWSS720H264/SuperSpeedway_720.ism/Manifest'}
    ],
    //Test VOD stream stop
    stopVod: [
        {stream: 'http://playready.directtaps.net/smoothstreaming/SSWSS720H264/SuperSpeedway_720.ism/Manifest'}
    ],
    //Test Live stream stop
    stopLive: [
        {stream: 'http://2is7server1.rd.francetelecom.com/C4/C4-46_S2.isml/Manifest'}
    ],
    //Test live and VoD detection and specific methods behavior
    liveOrVod: [
        {stream: 'http://2is7server1.rd.francetelecom.com/C4/C4-46_S2.isml/Manifest'},
        {stream: 'http://playready.directtaps.net/smoothstreaming/SSWSS720H264/SuperSpeedway_720.ism/Manifest'}
    ],
    //Test Playing, Seek and Loop
    seek: [
        {
            stream: 'http://2is7server1.rd.francetelecom.com/VOD/BBB-SD/big_buck_bunny_1080p_stereo.ism/Manifest',
            duration: 596,
            seekCount:10
        },
        //{stream: 'http://2is7server1.rd.francetelecom.com/VOD/Volver/PIVOT VOLVER_PS_smooth.ism/Manifest'},
        {
            stream: 'http://playready.directtaps.net/smoothstreaming/SSWSS720H264/SuperSpeedway_720.ism/Manifest',
            duration: 121,
            seekCount:10
        }
    ],
    //Test startTime param: seek at start
    startTime: [
        {
            stream: 'http://playready.directtaps.net/smoothstreaming/SSWSS720H264/SuperSpeedway_720.ism/Manifest',
            time: 50
        }
    ],
    //Test Multiaudio change from first track to the second one (for multiaudio videos only)
    //Params correspond to first and second audio tracks (regex that match the audio fragments url for)
    multiAudio: [
        {
            stream: 'http://161.105.176.12/VOD/Arte/C4-51_S1.ism/manifest',
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
        },
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
        }
    ],
    subtitles: [
        {
            stream: 'http://161.105.176.12/VOD/Arte/C4-51_S1.ism/manifest',
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
        {stream: 'http://2is7server1.rd.francetelecom.com/C4/C4-46_S2.isml/Manifest'},
        {stream: 'http://2is7server1.rd.francetelecom.com/VOD/BBB-SD/big_buck_bunny_1080p_stereo.ism/Manifest'}
    ],
});
