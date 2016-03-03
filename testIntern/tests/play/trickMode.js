/**
TEST_TRICKMODE:

- load test page
- for each stream:
    - load stream
    - get stream duration (OrangeHasPlayer.getDuration())
    - repeat N times:
        - seek at a random position (OrangeHasPlayer.seek())
        - check if <video> is playing at new position
        - check if <video> is progressing
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

        // Suite name
        var NAME = 'TEST_TRICKMODE';

        // Test configuration (see config/testConfig.js)
        var testConfig = config.tests.play.trickMode,
            streams = testConfig.streams;

        // Test constants
        var PROGRESS_DELAY = 2; // Delay for checking progressing (in s) 
        var ASYNC_TIMEOUT = PROGRESS_DELAY + config.asyncTimeout;


        // Test variables
        var command = null,
            streamDuration = 0,
            i, j;

        var generateTrickModeSpeed = function () {
            var speed = Math.round(Math.random() * 100);
            return speed;
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
                        tests.log(NAME, 'Check if playing after ' + PROGRESS_DELAY + 's.');
                        return tests.executeAsync(command, video.isPlaying, [PROGRESS_DELAY], ASYNC_TIMEOUT);
                    })
                    .then(function(playing) {
                        assert.isTrue(playing);
                        return command.execute(player.getDuration);
                    })
                    .then(function (duration) {
                        streamDuration = duration;
                        tests.log(NAME, 'Duration: ' + duration);
                    });
                }
            });
        };

        var test = function () {

            registerSuite({
                name: NAME,

                fastForward: function () {
                    var speed = generateTrickModeSpeed(),
                        videoTimeBeforeTrickMode,
                        timeBeforeTrickMode,
                        videoTimeAfterTrickMode,
                        timeAfterTrickMode;
                    
                    return command.sleep(PROGRESS_DELAY * 1000).execute(video.getCurrentTime)
                    .then(function (time) {
                        timeBeforeTrickMode = new Date().getTime();
                        videoTimeBeforeTrickMode = time;
                        return command.execute(player.setTrickModeSpeed, [speed]);
                    })
                    .then(function () {
                        return command.sleep(PROGRESS_DELAY * 6 * 1000).execute(player.setTrickModeSpeed, [1]);
                    })
                    .then(function () {
                        timeAfterTrickMode = new Date().getTime();
                        return command.execute(video.getCurrentTime);
                    })
                    .then(function (time) {
                        videoTimeAfterTrickMode = time;

                        var deltaTime = (timeAfterTrickMode - timeBeforeTrickMode) / 1000,
                            deltaVideoTime = videoTimeAfterTrickMode - videoTimeBeforeTrickMode,
                            calculatedSpeed = deltaVideoTime / deltaTime,
                            delta = 2;

                        tests.log(NAME, 'trickMode end calculated Speed = '+ calculatedSpeed+ " for wanted Speed = "+speed);
                        assert.isTrue((calculatedSpeed >= speed-delta) && (calculatedSpeed <= speed+delta));
                    });
                }
            });
        };


        for (i = 0; i < streams.length; i++) {

            // setup: load test page and stream
            testSetup(streams[i]);

            // Performs trick play with differents speeds
            for (j = 0; j < testConfig.trickCount; j++) {
                test();
            }
        }

});
