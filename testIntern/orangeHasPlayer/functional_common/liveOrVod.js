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

        var getPlayerTimePosition = function() {
            return orangeHasPlayer.getPosition();
        };

        var getVideoDuration = function() {
            var duration = orangeHasPlayer.getDuration();
            return duration === Infinity ? 'Infinity' : duration;
        };

        var isLive = function () {
            return orangeHasPlayer.isLive();
        };

        var test_live = function(stream) {
            var url = config.testPage;

            registerSuite({
                name: 'Stop in VoD',

                setup: function() {
                    command = this.remote.get(require.toUrl(url));
                    return command.execute(loadStream, [stream]);
                },

                'Check is live': function() {
                    console.log('[TEST_LIVE_OR_VOD] Wait 5s ...');

                    return command.sleep(5000)
                    .execute(isLive)
                    .then(function (live) {
                        return assert.ok(live, 'Stream is live.');
                    });
                },

                'Check time': function() {
                    return command
                    .execute(getPlayerTimePosition)
                    .then(function(time) {
                        return assert.equal(time, null, 'Player time must be null.');
                    });
                },

                'Check duration': function() {
                    return command
                    .execute(getVideoDuration)
                    .then(function(duration) {
                        return assert.equal(duration, 'Infinity', 'Stream must be infinity.');
                    });
                }
            });
        };

        var test_vod = function(stream, stopDuration, playDuration) {
            var url = config.testPage;

            registerSuite({
                name: 'Stop in VoD',

                setup: function() {
                    command = this.remote.get(require.toUrl(url));
                    return command.execute(loadStream, [stream]);
                },

                'Check is VOD': function() {
                    console.log('[TEST_LIVE_OR_VOD] Wait 5s ...');

                    return command.sleep(5000)
                    .execute(isLive)
                    .then(function (live) {
                        return assert.ok(!live, 'Stream is VOD.');
                    });
                },

                'Check time': function() {
                    return command
                    .execute(getPlayerTimePosition)
                    .then(function(time) {
                        return assert.ok(time > 0, 'Player time must a positive number.');
                    });
                },

                'Check duration': function() {
                    return command
                    .execute(getVideoDuration)
                    .then(function(duration) {
                        return assert.ok(duration > 0, 'Stream must be infinity.');
                    });
                }
            });
        };

        test_live(config.liveOrVod[0].stream);
        test_vod(config.liveOrVod[1].stream);
});
