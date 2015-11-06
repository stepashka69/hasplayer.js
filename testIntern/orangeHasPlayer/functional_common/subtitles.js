/*
    http://selenium-release.storage.googleapis.com/2.43/selenium-server-standalone-2.43.0.jar
    http://chromedriver.storage.googleapis.com/2.9/chromedriver_win32.zip
    http://selenium-release.storage.googleapis.com/2.43/IEDriverServer_x64_2.43.0.zip
    */

//java -jar selenium-server-standalone-2.43.0.jar -Dwebdriver.ie.driver=D:\selenium\IEDriverServer.exe -Dwebdriver.chrome.driver=D:\selenium\chromedriver.exe

// D:\FTRD\workspace\dash-js>node node_modules/intern/runner.js config=testIntern/intern

define([
    'intern!object',
    'intern/chai!assert',
    'intern/dojo/node!leadfoot/helpers/pollUntil',
    'require',
    'testIntern/orangeHasPlayer/functional_common/config'
    ], function(registerSuite, assert, pollUntil, require, config) {

        var command = null;

        var loadStream = function(stream) {
            orangeHasPlayer.load(stream);
        };

        var getSubtitleTracks = function() {
           return orangeHasPlayer.getSubtitleTracks();
        };

        var getSelectedSubtitleTrack = function() {
            return orangeHasPlayer.getSelectedSubtitleTrack();
        };

        var setSubtitleTrack = function(track) {
            return orangeHasPlayer.setSubtitleTrack(track);
        };

        var setDefaultSubtitleTrack = function(track) {
            orangeHasPlayer.setDefaultSubtitleLang(track.lang);
        };

        var getSubtitleVisibility = function() {
            return orangeHasPlayer.getSubtitleVisibility();
        };

        var getVideoSubtitleVisibility = function() {
            return document.querySelector('video').textTracks[0].mode;
        };

        var setSubtitleVisibility = function (visible) {
            orangeHasPlayer.setSubtitleVisibility(visible);
        };

        var equal = function(x, y) {
            if (typeof x !== typeof y) return false;
            if (x instanceof Array && y instanceof Array && x.length !== y.length) return false;
            if (typeof x === 'object') {
                for (var p in x) if (x.hasOwnProperty(p)) {
                    if (typeof x[p] === 'function' && typeof y[p] === 'function') continue;
                    if (x[p] instanceof Array && y[p] instanceof Array && x[p].length !== y[p].length) return false;
                    if (typeof x[p] !== typeof y[p]) return false;
                    if (typeof x[p] === 'object' && typeof y[p] === 'object') { if (!equal(x[p], y[p])) return false; } else
                    if (x[p] !== y[p]) return false;
                }
            } else return x === y;
            return true;
        };

        var test_subtitleTracks = function(stream, tracks) {
            var url = config.testPage;

            registerSuite({
                name: 'Test subtitles',

                setup: function() {
                    command = this.remote.get(require.toUrl(url));
                    return command.sleep(500).execute(loadStream, [stream]);
                },

                'Check subtitle tracks': function() {
                    console.log('[TEST_SUBTITLE_TRACKS] Check subtitle tracks');
                    return command.sleep(3000)
                    .execute(getSubtitleTracks)
                    .then(function (subtitleTracks) {
                        var equality = equal(subtitleTracks.sort(), tracks.sort());
                        return assert.ok(equality, 'Subtitle tracks should match.');
                    });
                },

                'Check selected subtitle track': function() {
                    console.log('[TEST_SUBTITLE_TRACKS] Check selected subtitle track');
                    return command
                    .execute(getSelectedSubtitleTrack)
                    .then(function (subtitleTrack) {
                        var equality = equal(subtitleTrack, tracks[1]);
                        return assert.ok(equality, 'Selected subtitles should be "fre".');
                    });
                },

                'Set subtitle tracks': function() {
                    console.log('[TEST_SUBTITLE_TRACKS] Set subtitle track');
                    return command
                    .execute(setSubtitleTrack, [tracks[0]])
                    .execute(getSelectedSubtitleTrack)
                    .then(function (subtitleTrack) {
                        var equality = equal(subtitleTrack, tracks[0]);
                        return assert.ok(equality, 'Selected subtitles should be "fre".');
                    });
                }
            });
        };

        var test_defaultsubtitleTracks = function(stream, tracks) {
            var url = config.testPage;

            registerSuite({
                name: 'Test set default subtitles',

                setup: function() {
                    command = this.remote.get(require.toUrl(url));
                },

                'Set default subtitles': function() {
                    console.log('[TEST_SUBTITLE_TRACKS] Check selected subtitle track');
                    return command
                    .execute(setDefaultSubtitleTrack, [tracks[0]])
                    .execute(loadStream, [stream])
                    .sleep(5000)
                    .execute(getSelectedSubtitleTrack)
                    .then(function (subtitleTrack) {
                        var equality = equal(subtitleTrack, tracks[0]);
                        return assert.ok(equality, 'Selected subtitle should be "fre".');
                    });
                }
            });
        };

        var test_subtitles_visibility = function(stream) {
            var url = config.testPage;

            registerSuite({
                name: 'Test set default subtitles',

                setup: function() {
                    command = this.remote.get(require.toUrl(url));
                    return command.sleep(500).execute(loadStream, [stream]);
                },

                'Get initial subtitles visibility': function() {
                    console.log('[TEST_SUBTITLE_TRACKS] Get initial subtitles visibility');
                    return command
                    .sleep(2000)
                    .execute(getVideoSubtitleVisibility)
                    .then(function (visibility) {
                        return assert.equal(visibility, 'showing', 'The subtitles should be shown (video tag).')
                    })
                    .execute(getSubtitleVisibility)
                    .then(function(visibility) {
                        return assert.ok(visibility, 'The subtitles should be shown (proxy).');
                    });
                },

                'Set subtitles visibility to false': function() {
                    console.log('[TEST_SUBTITLE_TRACKS] Set subtitles visibility to false');
                    return command
                    .execute(setSubtitleVisibility, [false])
                    .sleep(2000)
                    .execute(getVideoSubtitleVisibility)
                    .then(function(visibility) {
                        return assert.equal(visibility, 'hidden', 'The subtitles should be shown (video tag).')
                    })
                    .execute(getSubtitleVisibility)
                    .then(function(visibility) {
                        return assert.ok(!visibility, 'The subtitles should be shown (proxy).');
                    });
                },

                'Set subtitles visibility to true': function() {
                    console.log('[TEST_SUBTITLE_TRACKS] Set subtitles visibility to true');
                    return command
                    .execute(setSubtitleVisibility, [true])
                    .execute(getVideoSubtitleVisibility)
                    .then(function(visibility) {
                        return assert.equal(visibility, 'showing', 'The subtitles should be shown (video tag).')
                    })
                    .execute(getSubtitleVisibility)
                    .then(function(visibility) {
                        return assert.ok(visibility, 'The subtitles should be shown (proxy).');
                    });
                }
            });
        };

        var i = 0,
        len = config.subtitles.length;

        for (i; i < len; i++) {
            test_subtitleTracks(config.subtitles[i].stream, config.subtitles[i].tracks);
            test_defaultsubtitleTracks(config.subtitles[i].stream, config.subtitles[i].tracks);
            test_subtitles_visibility(config.subtitles[i].stream);
        }
});
