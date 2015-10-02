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

        var tests = function(stream) {
            var url = config.testPage + '?url=' + stream;

            registerSuite({
                name: 'Stop in VoD',

                setup: function() {
                    command = this.remote.get(require.toUrl(url));
                },

                'Check playing': function() {
                    console.log('[TEST_PLAYVOD] Wait 5s ...');

                    return command.sleep(5000)
                    .execute(getVideoCurrentTime)
                    .then(function (time) {
                        console.log('[TEST_PLAYVOD] current time = ' + time);
                        assert.ok(time > 0, 'Video should be playing');
                        videoCurrentTime = time;
                    });
                },

                'Do stop': function() {
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
                    .sleep(2)
                    .execute(getPlayerTimePosition)
                    .then(function(time) {
                        return assert.equal(time, videoCurrentTime, 'Player time should have not changed since stop.')
                    });
                },

                'Do play': function() {
                    return command
                    .execute(play).sleep(100)
                    .execute(isPaused)
                    .then(function(paused){
                        return assert.ok(!paused, 'The video must be playing.');
                    })
                    .execute(getVideoCurrentTime)
                    .then(function(time) {
                        assert.ok(time > videoCurrentTime);
                        return videoCurrentTime = time;
                    })
                    .execute(getPlayerTimePosition)
                    .then(function(time) {
                        return assert.ok(time > videoCurrentTime);
                    })
                }
            });
        };

        var i = 0,
        len = config.stopVod.length;

        for (i; i < len; i++) {
            tests(config.stopVod[i].stream);
        }
});
