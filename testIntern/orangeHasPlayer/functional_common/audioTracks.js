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
        var videoCurrentTime = 0;

        var getAudioTracks = function() {
            var tmpTracks = orangeHasPlayer.getAudioTracks();
            var tracks = [];
            for (var i = 0; i < tmpTracks.length; ++i) {
                tracks.push(tmpTracks[i]);
            }
            return tracks;
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

        var test_videobitrates = function(stream, tracks) {
            var url = config.testPage + '?url=' + stream;

            registerSuite({
                name: 'Get audio tracks',

                setup: function() {
                    command = this.remote.get(require.toUrl(url));
                },

                'Check audio tracks': function() {
                    console.log('[TEST_AUDIO_TRACKS] check audio tracks');
                    return command.sleep(3000)
                    .execute(getAudioTracks)
                    .then(function (audioTracks) {
                        var equality = equal(audioTracks.sort(), tracks.sort());
                        return assert.ok(equality, 'Bitrates should match: ' + audioTracks + ' != ' + tracks);
                    });
                }
            });
        };

        var i = 0,
        len = config.audioTracks.length;

        for (i; i < len; i++) {
            test_videobitrates(config.audioTracks[i].stream, config.audioTracks[i].audioTracks);
        }
});
