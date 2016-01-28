/**
TEST_PAUSE:

- load test page
- for each stream:
    - load stream
    - repeat N times:
        - (resume the player (OrangeHasPlayer.play()))
        - wait for N seconds
        - pause the player (OrangeHasPlayer.pause())
        - check if <video> is paused
        - wait for N seconds
        - check if <video> is not progressing
**/

define([
    'intern!object',
    'intern/chai!assert',
    'require',
    'testIntern/config/testsConfig',
    'testIntern/tests/player_functions',
    'testIntern/tests/video_functions',
    'testIntern/tests/tests_functions'
    ], function(registerSuite, assert, require, config, player, video, tests) {

        var command = null;

        var NAME = 'TEST_PAUSE';
        var PROGRESS_DELAY = 2; // Delay for checking progressing (in s) 
        var ASYNC_TIMEOUT = 5;  // Asynchronous additional delay for checking progressing 
        var PAUSE_SLEEP = 2000; // Delay before each pause operation (in ms)
        var i, j;

        var isPlaying = function (progressDelay) {
            return command.executeAsync(video.isPlaying)
            .then(function(isPlaying) {
                if (progressDelay > 0) {
                    return tests.executeAsync(command, video.isProgressing, [progressDelay], (progressDelay + ASYNC_TIMEOUT))
                    .then(function(progressing) {
                        assert.isTrue(progressing);
                    }, function() {
                        assert.ok(false);
                    });
                } else {
                    assert.isTrue(isPlaying);
                }
            });
        };
        
        var testSetup = function (stream) {
            registerSuite({
                name: NAME,

                setup: function() {
                    tests.log(NAME, 'Setup');
                    command = this.remote.get(require.toUrl(config.testPage));
                    command = tests.setup(command);
                    return command;
                },

                play: function() {
                    tests.logLoadStream(NAME, stream);
                    return command.execute(player.loadStream, [stream])
                    .then(function () {
                        return isPlaying(PROGRESS_DELAY);
                    });
                }
            });
        };

        var testPause = function () {

            registerSuite({
                name: NAME,

                pause: function () {
                    var currentTime = 0;

                    return command.execute(player.play)
                    .sleep(PAUSE_SLEEP)
                    .execute(player.pause)
                    .execute(video.isPaused)
                    .then(function (paused) {
                        assert.isTrue(paused);
                        return command.execute(video.getCurrentTime);
                    })
                    .then(function (time) {
                        currentTime = time;
                        return command.sleep(PAUSE_SLEEP);
                    })
                    .then(function () {
                        return command.execute(video.getCurrentTime);
                    })
                    .then(function (time) {
                        assert.equal(time, currentTime);
                    });
                }
            });
        };


        for (i = 0; i < config.testPause.streams.length; i++) {

            // setup: load test page and stream
            testSetup(config.testPause.streams[i]);

            // Performs pause tests
            for (j = 0; j < config.testPause.pauseCount; j++) {
                testPause();
            }
        }

});
