define({
    //Test page url
    testPage: [
        'http://tv-has.orange-labs.fr/hasplayer_orange/dev/player.html'
    ],
    //Test Live stream play (playing after 10 seconds with buffering margin of 2 seconds)
    play: [
        {stream: 'http://pc-selenium.rd.francetelecom.fr:8084/MSS/France2/Manifest'},
        {stream: 'http://2is7server1.rd.francetelecom.com/C4/C4-46_S1.isml/Manifest'}
    ],
    //Test DRM stream play (on IE only)
    DRM: [
        {stream: 'http://pc-selenium.rd.francetelecom.fr:8084/MSS/SuperSpeedway PR/Manifest'}
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
                    urlPattern: 'audio102_deu'
                },
                {
                    id: 'audio101_fra',
                    urlPattern: 'audio101_fra'
                }
            ]
        }/*,
        {
            stream: 'http://2is7server1.rd.francetelecom.com/C4/C4-49_S1.isml/Manifest',
            tracks: [
                {
                    id: 'audio102_deu',
                    urlPattern: 'audio102_deu'
                },
                {
                    id: 'audio101_fra',
                    urlPattern: 'audio101_fra'
                }
            ]
        }*/
    ]
});
