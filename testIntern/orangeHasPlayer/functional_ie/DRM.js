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
    'testIntern/demoPlayer/functional_ie/config'
    ], function(registerSuite, assert,pollUntil, require, config){

        var getCurrentTime = function() {
            return orangeHasPlayer.getPosition();
        }

        var isPaused = function() {
            return document.querySelector('video').paused;
        }

        var command = null;

        var tests = function(i) {

            var url = config.testPage + '?url=' + config.DRM[i].stream;

            registerSuite({
                name: 'Sequence of playing a DRM stream',

                setup: function() {
                    console.log('[TEST_DRM] INIT');
                    command = this.remote.get(require.toUrl(url));

                    return command.execute(getCurrentTime)
                    .then(function(time) {
                        console.log('[TEST_DRM] Time is: ' + time);
                        return assert.equal(time, 0);
                    }).execute(isPaused)
                    .then(function(paused) {
                        console.log('[TEST_DRM] Video is ' + (paused ? 'paused' : 'playing'));
                        return assert.ok(isPaused, 'Video should be paused');
                    });
                },

                'contentPlaying': function() {
                    return command.sleep(5000)
                    .execute(getCurrentTime)
                    .then(function(time) {
                        console.log('[TEST_DRM] Time is: ' + time);
                        return assert.ok(time > 0, 'playing');
                    });
                },

                'contentStillPlaying': function() {

                    return command.sleep(5000)
                    .execute(getCurrentTime)
                    .then(function(time) {
                        console.log('[TEST_DRM] Time is: ' + time);
                        return assert.ok(time > 5, 'playing');
                    });
                }
            });
        };

        var i = 0,
        len = config.DRM.length;

        for (i; i < len; i++) {
            tests(i);
        }
    }
);
