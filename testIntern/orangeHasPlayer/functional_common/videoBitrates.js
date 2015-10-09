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

        var loadStream = function(stream) {
            orangeHasPlayer.load(stream);
        };

        var getVideoBitrates = function() {
            return orangeHasPlayer.getVideoBitrates();
        };

        var equalsArray = function(a, b) {
            var i = a.length;
            if (i != b.length) return false;
            while (i--) {
                if (a[i] !== b[i]) return false;
            }
            return true;
        };

        var test_videobitrates = function(stream, bitrates) {
            var url = config.testPage;

            registerSuite({
                name: 'Get video bitrates',

                setup: function() {
                    command = this.remote.get(require.toUrl(url));
                    return command.execute(loadStream, [stream]);
                },

                'Check bitrates': function() {
                    console.log('[TEST_VIDEO_BITRATES] check video bitrates');
                    return command.sleep(3000)
                    .execute(getVideoBitrates)
                    .then(function (videoBitrates) {
                        var equality = equalsArray(videoBitrates.sort(), bitrates.sort());
                        return assert.ok(equality, 'Bitrates should match: ' + videoBitrates + ' != ' + bitrates);
                    });
                }
            });
        };

        var i = 0,
        len = config.videoBitrates.length;

        for (i; i < len; i++) {
            test_videobitrates(config.videoBitrates[i].stream, config.videoBitrates[i].bitrates);
        }
});
