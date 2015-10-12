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

        var getPlayerTimePosition = function() {
            return orangeHasPlayer.getPosition();
        };

        var play = function () {
            orangeHasPlayer.play();
        };

        var stop = function () {
            orangeHasPlayer.stop();
        };

        var isPaused = function () {
            return document.querySelector('video').paused;
        };

        var doStop = function(stopDuration) {
            return command
            .execute(stop)
            .execute(isPaused)
            .then(function(paused){
                return assert.ok(paused, 'The video must be paused.');
            })
            .execute(getVideoCurrentTime)
            .then(function(time) {
                return videoCurrentTime = time;
            })
            .execute(getPlayerTimePosition)
            .then(function(time) {
                return assert.equal(time, videoCurrentTime, 'Video time and player time should be equal.')
            })
            .sleep(stopDuration)
            .execute(getPlayerTimePosition)
            .then(function(time) {
                return assert.equal(time, videoCurrentTime, 'Player time should have not changed since stop.')
            });
        };

        var doPlay = function(playDuration) {
            return command
            .execute(play).sleep(playDuration)
            .execute(isPaused)
            .then(function(paused){
                return assert.ok(!paused, 'The video must be playing.');
            }).sleep(200)
            .execute(getVideoCurrentTime)
            .then(function(time) {
                return assert.ok(time > videoCurrentTime, 'Video time should increase (current time: ' + time + ', previous time: ' + videoCurrentTime + ').');
            })
            .execute(getPlayerTimePosition)
            .then(function(time) {
                return assert.ok(time > videoCurrentTime, 'Player time should increase (current time: ' + time + ', previous time: ' + videoCurrentTime + ').');
            });
        };

        var doPlayStop = function(stopDuration, playDuration) {
            return doStop(stopDuration).then(function() {
                return doPlay(playDuration);
            });
        };

        var tests = function(stream) {
            var url = config.testPage;

            registerSuite({
                name: 'Stop in VoD',

                setup: function() {
                    command = this.remote.get(require.toUrl(url));
                    return command.execute(loadStream, [stream]);
                },

                'Check playing': function() {
                    console.log('[TEST_STOP_VOD] Wait 5s ...');

                    return command.sleep(5000)
                    .execute(getVideoCurrentTime)
                    .then(function (time) {
                        console.log('[TEST_STOP_VOD] current time = ' + time);
                        assert.ok(time > 0, 'Video should be playing');
                        videoCurrentTime = time;
                    });
                },

                'Do stop': function() {
                    return doStop(2000);
                },

                'Do play': function() {
                    return doPlay(1000);
                }
            });
        };

        var test_multiple_stops = function(stream, stopDuration, playDuration) {
            var url = config.testPage;

            registerSuite({
                name: 'Stop in VoD',

                setup: function() {
                    console.log('[TEST_STOP_VOD] Init multipe stops test (stop duration: ' + stopDuration + 'ms, play duration: ' + playDuration + 'ms).')
                    command = this.remote.get(require.toUrl(url));
                    return command.execute(loadStream, [stream]);
                },

                'Check playing': function() {
                    console.log('[TEST_STOP_VOD] Wait 5s ...');

                    return command.sleep(5000)
                    .execute(getVideoCurrentTime)
                    .then(function (time) {
                        console.log('[TEST_STOP_VOD] current time = ' + time);
                        assert.ok(time > 0, 'Video should be playing');
                        videoCurrentTime = time;
                    });
                },

                'Do multiple play stop': function() {
                    var result = null;

                    for (var i = 0; i < 5; ++i) {
                        if (result === null) {
                            result = doPlayStop(stopDuration, playDuration);
                        } else {
                            result = result.then(function() {
                                return doPlayStop(stopDuration, playDuration);
                            });
                        }
                    }

                    return result;
                }
            });
        };

        var i = 0,
        len = config.stopVod.length;

        for (i; i < len; i++) {
            tests(config.stopVod[i].stream);
            test_multiple_stops(config.stopVod[i].stream, 2000, 1000);
            test_multiple_stops(config.stopVod[i].stream, 250, 250);
            test_multiple_stops(config.stopVod[i].stream, 50, 50);
            test_multiple_stops(config.stopVod[i].stream, 0, 0);
        }
});
