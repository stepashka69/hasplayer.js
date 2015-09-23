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
    'testIntern/config'
    ], function(registerSuite, assert, pollUntil, require, config) {

        var command = null;
        var videoCurrentTime = 0;

        var getVideoCurrentTime = function() {
            return document.querySelector("video").currentTime;
        };

        var tests = function(stream) {

            var url = config.testPage + "?url=" + stream;

            registerSuite({
                name: 'Test playing streams',

                'Initialize the test': function() {
                    console.log("[TEST_PLAY] stream: " + stream);

                    command = this.remote.get(require.toUrl(url));

                    return command.execute(getVideoCurrentTime)
                    .then(function (time) {
                        videoCurrentTime = time;
                        console.log("[TEST_PLAY] current time = " + videoCurrentTime);
                    });
                },

                'Check if playing': function() {
                    console.log('[TEST_PLAY] Wait 5s ...');

                    return command.sleep(5000)
                    .execute(getVideoCurrentTime)
                    .then(function (time) {
                        console.log("[TEST_PLAY] current time = " + time);
                        assert.ok(time > videoCurrentTime);
                        videoCurrentTime = time;
                    });
                },

                'Check playing time after 10 sec.': function() {
                    console.log('[TEST_PLAY] Wait 10s ...');

                    return command.sleep(10000)
                    .execute(getVideoCurrentTime)
                    .then(function (time) {
                        var delay = time - videoCurrentTime;
                        console.log("[TEST_PLAY] current time = " + time + " (" + Math.round(delay*100)/100 + ")");
                        assert.ok(delay >= 9); // 9 for sleep precision
                    });
                }
            });
        };

        var i = 0,
            len = config.play.length;

        for (i; i < len; i++) {
            tests(config.play[i].stream);
        }
});
