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

        var getVideoCurrentTime = function() {
            return document.querySelector('video').currentTime;
        };

        var test_init = function() {
            var url = config.testPage;

            registerSuite({
                name: 'Init zapping test',

                setup: function() {
                    command = this.remote.get(require.toUrl(url));
                }
            });
        };

        var test_zapping = function(stream) {
            registerSuite({
                name: 'Test zapping',

                setup: function() {
                    console.log('[TEST_ZAPPING] Zapping for stream: ' + stream);
                    return command.sleep(500).execute(loadStream, [stream]);
                },

                'Get current time': function() {
                    return command.sleep(2000).execute(getVideoCurrentTime)
                    .then(function (time) {
                        videoCurrentTime = time;
                        console.log('[TEST_ZAPPING] current time = ' + videoCurrentTime);
                    });
                },

                'Check if playing': function() {
                    console.log('[TEST_ZAPPING] Check if playing ...');

                    return command.sleep(2000)
                    .execute(getVideoCurrentTime)
                    .then(function (time) {
                        console.log('[TEST_ZAPPING] current time = ' + time);
                        assert.ok(time > videoCurrentTime);
                        videoCurrentTime = time;
                    });
                }
            });
        };

        var i = 0,
        len = config.zapping.length;

        test_init();

        for (i; i < len; i++) {
            test_zapping(config.zapping[i].stream);
        }
});
