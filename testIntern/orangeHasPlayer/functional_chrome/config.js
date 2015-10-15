define({
    testPage: [
        'http://tv-has.orange-labs.fr/orangehasplayer/dev/index.html'
    ],
    errors: [
        {
            stream: 'http://pc-selenium.rd.francetelecom.fr:8084/MSS/VODEW2.1 Test 1/Manifest',
            error: 'MEDIA_ERR_SRC_NOT_SUPPORTED',
            msg: '<video> error event</video>'
        },
        {
            stream: 'http://pc-selenium.rd.francetelecom.fr:8084/MSS/SuperSpeedway PR/Manifest',
            error: 'MEDIA_KEYMESSERR_URL_LICENSER_UNKNOWN',
            msg: 'DRM: No license server URL specified!'
        }
    ]
});
