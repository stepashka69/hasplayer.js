define({
    //Test page url
    testPage: [
        'http://tv-has.orange-labs.fr/orangehasplayer/dev/index.html'
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
    ]
});
