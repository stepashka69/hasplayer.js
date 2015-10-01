define([
    'intern!object',
    'intern/chai!assert',
    'intern/dojo/node!leadfoot/helpers/pollUntil',
    'require',
    'testIntern/orangeHasPlayer/functional_common/config'
    ], function(registerSuite, assert, pollUntil, require, config) {

        var command = null;
        var videoCurrentTime = 0;
        var audioTracks = null;

        var getAudioTracks = function () {
            var tmpTracks = orangeHasPlayer.getAudioTracks();
            var tracks = [];

            for(var i = 0; i < tmpTracks.length; ++i) {
                tracks.push({ id: tmpTracks[i].id,
                              lang: tmpTracks[i].lang})
            }

            return tracks;
        };

        var getAudioSelectedTrackId = function () {
            return orangeHasPlayer.getSelectedAudioTrack().id;
        };

        var setAudioTrack = function (track) {
            orangeHasPlayer.setAudioTrack(track);
        };

        var getVideoCurrentTime = function () {
            return document.querySelector('video').currentTime;
        };

        var test_init = function(stream) {

            var url = config.testPage + '?url=' + stream;

            registerSuite({
                name: 'Test multi-audio functionnality',

                setup: function() {
                    console.log('[TEST_MULTI-AUDIO] stream: ' + stream);

                    command = this.remote.get(require.toUrl(url));

                    return command.sleep(2000).execute(getVideoCurrentTime)
                    .then(function(time) {
                        videoCurrentTime = time;
                        assert.ok(videoCurrentTime > 0, 'Test if video has began to play')
                        console.log('[TEST_MULTI-AUDIO] current time = ' + videoCurrentTime);
                    })
                    .execute(getAudioTracks)
                    .then(function (tracks) {
                        if (tracks) {
                            console.log('[TEST_MULTI-AUDIO] tracks count: ' + tracks.length)

                            if (stream === 'http://161.105.176.12/VOD/Arte/C4-51_S1.ism/manifest') {
                                assert.equal(tracks.length, 2, 'Test tracks count for ' + stream);
                            } else if (stream === 'http://2is7server1.rd.francetelecom.com/C4/C4-49_S1.isml/Manifest') {
                                assert.equal(tracks.length, 3, 'Test tracks count for ' + stream);
                            }
                        }
                    });
                },

                'Check playing': function() {
                    console.log('[TEST_MULTI-AUDIO] Wait 5s ...');

                    return command.sleep(5000)
                    .execute(getVideoCurrentTime)
                    .then(function (time) {
                        console.log('[TEST_MULTI-AUDIO] current time = ' + time);
                        assert.ok(time > videoCurrentTime, 'Test if video is still playing');
                        videoCurrentTime = time;
                    });
                }
            });
        };


        var test_setAudioTrack = function(track) {

            registerSuite({
                name: 'Test set multi audio functionnality',

                'Set audio track': function() {

                    console.log('[TEST_MULTI-AUDIO] set audio track ' + track.id);

                    return command.execute(setAudioTrack, [track])
                    .sleep(100)
                    .execute(getAudioSelectedTrackId)
                    .then(function (trackId) {
                        assert.equal(trackId, track.id);
                    });
                },

                'Check playing': function() {
                    console.log('[TEST_MULTI-AUDIO] Wait 5s ...');

                    return command.sleep(5000)
                    .execute(getVideoCurrentTime)
                    .then(function (time) {
                        var delay = time - videoCurrentTime;
                        console.log('[TEST_MULTI-AUDIO] current time = ' + time + ' (' + Math.round(delay*100)/100 + ')');
                        assert.ok(time > videoCurrentTime, 'Test if video is still playing');
                    });
                }
            });
        };

        var i, j;

        for (i = 0; i < config.multiAudio.length; i++) {
            test_init(config.multiAudio[i].stream);
            for (j = 0; j < config.multiAudio[i].tracks.length; j++) {
                test_setAudioTrack(config.multiAudio[i].tracks[j]);
            }
        }

});
