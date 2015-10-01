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

        var getVideoCurrentTime = function() {
            return document.querySelector('video').currentTime;
        };

        var pause = function () {
            orangeHasPlayer.pause();
        };

        var play = function () {
            orangeHasPlayer.play();
        };

        var isPaused = function () {
            return document.querySelector('video').paused;
        };

        var doPlayPause = function(pauseDuration, playDuration) {
            return command.execute(pause).sleep(pauseDuration)
                    .execute(isPaused)
                    .then(function (paused) {
                        console.log("[TEST_PAUSE] is paused: " + paused);
                        return assert.ok(paused === true);
                    }).execute(play).sleep(playDuration)
                    .execute(isPaused)
                    .then(function (paused) {
                        console.log("[TEST_PAUSE] is paused: " + paused);
                        return assert.ok(paused === false);
                    });
        };

        var tests = function(stream) {

            var url = config.testPage + '?url=' + stream;

            registerSuite({
                name: 'Test pause stream',

                'Initialize the test': function() {
                    console.log('[TEST_PAUSE] stream: ' + stream);

                    command = this.remote.get(require.toUrl(url));

                    return command.execute(getVideoCurrentTime)
                    .then(function (time) {
                        videoCurrentTime = time;
                        console.log('[TEST_PAUSE] current time = ' + videoCurrentTime);
                    });
                },

                'Check if playing': function() {
                    console.log('[TEST_PAUSE] Wait 5s ...');

                    return command.sleep(5000)
                    .execute(getVideoCurrentTime)
                    .then(function (time) {
                        console.log('[TEST_PAUSE] current time = ' + time);
                        assert.ok(time > videoCurrentTime);
                        videoCurrentTime = time;
                    });
                },

                'Check if paused': function() {
                    console.log('[TEST_PAUSE] do a pause command');

                    return command.execute(pause)
                    .execute(isPaused)
                    .then(function (resu) {
                        console.log('[TEST_PAUSE] pause state = ' + resu);
                        assert.ok(resu === true);
                        console.log('[TEST_PAUSE] restart ');
                        command.execute(play);
                    });
                },

                'Check playing time after 20 sec.': function() {
                    console.log('[TEST_PAUSE] Wait 20s ...');

                    return command.sleep(20000)
                    .execute(getVideoCurrentTime)
                    .then(function (time) {
                        videoCurrentTime = time;
                        console.log('[TEST_PAUSE] current time = ' + time);
                    });
                },

                'Check playing time after 2 sec.': function() {
                    console.log('[TEST_PAUSE] Wait 2s ...');

                    return command.sleep(2000)
                    .execute(getVideoCurrentTime)
                    .then(function (time) {
                        console.log('[TEST_PAUSE] current time = ' + time);
                        assert.ok(time > videoCurrentTime);
                        console.log('[TEST_PAUSE] after pause command, stream is always playing');
                    });
                }
            });

        };

        var test_multiple_play_pause = function(stream, pauseDuration, playDuration) {

            var url = config.testPage + '?url=' + stream;

            registerSuite({
                name: 'Test multiple pause stream',

                'Initialize the test': function() {
                    console.log('[TEST_PAUSE] stream: ' + stream);

                    command = this.remote.get(require.toUrl(url));

                    return command.sleep(2000).execute(getVideoCurrentTime)
                    .then(function (time) {
                        assert.ok(time > 0);
                        videoCurrentTime = time;
                        console.log('[TEST_PAUSE] current time = ' + videoCurrentTime);
                    });
                },

                'Do multiple play pause': function() {
                    var result = null;

                    for (var i = 0; i < 5; ++i) {
                        if (result === null) {
                            result = doPlayPause(pauseDuration, playDuration);
                        } else {
                            result = result.then(function() {
                                return doPlayPause(pauseDuration, playDuration);
                            });
                        }
                    }

                    return result;
                }
            });
        };

        var i = 0,
            len = config.seek.length;

        for (i; i < len; i++) {
            tests(config.seek[i].stream);
            test_multiple_play_pause(config.seek[i].stream, 1000, 2000);
            test_multiple_play_pause(config.seek[i].stream, 250, 250);
            test_multiple_play_pause(config.seek[i].stream, 50, 50);
            test_multiple_play_pause(config.seek[i].stream, 0, 0);
        }
});
