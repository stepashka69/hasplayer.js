/**
TEST_SEEK:

- load test page
- for each stream:
    - load stream
    - repeat N times:
        - get stream duration (OrangeHasPlayer.getDuration())
        - seek at a random position (OrangeHasPlayer.seek())
        - check if <video> is playing and progressing
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

        var NAME = 'TEST_SEEK';
        var PROGRESS_DELAY = 2; // Delay for checking progressing (in s) 
        var SEEK_SLEEP = 200;   // Delay before each seek operation (in ms)
        var ASYNC_TIMEOUT = 5;
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

        var generateSeekPos = function (duration, progressDelay) {
            var pos = Math.round(Math.random() * duration * 100) / 100;
            if (pos > (duration - progressDelay)) {
                pos -= progressDelay;
            }
            if (pos < progressDelay) {
                pos += progressDelay;
            }
            return pos;
        };

        var seek = function (pos) {
            return command.sleep(SEEK_SLEEP)
            .execute(player.getDuration)
            .then(function (duration) {
                tests.log(NAME, 'Duration: ' + duration);
                var seekPos = pos ? pos : generateSeekPos(duration, PROGRESS_DELAY);
                tests.log(NAME, 'Seek: ' + seekPos);
                return command.execute(player.seek, [seekPos]);
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

        var testSeek = function (progressDelay) {

            registerSuite({
                name: NAME,

                seek: function () {
                    return seek()
                    .then(function () {
                        if (progressDelay >= 0) {
                            return isPlaying(progressDelay);
                        }
                    });
                }
            });
        };


        for (i = 0; i < config.testSeek.streams.length; i++) {

            // setup: load test page and stream
            testSetup(config.testSeek.streams[i]);

            // Performs seeks and wait for playing and progressing
            for (j = 0; j < config.testSeek.seekCount; j++) {
                testSeek(PROGRESS_DELAY);
            }

            // Performs seeks and wait for playing before each seek
            for (j = 0; j < config.testSeek.seekCount; j++) {
                testSeek(j < (config.testSeek.seekCount - 1) ? 0 : PROGRESS_DELAY);
            }

            // Performs (fast) seeks, do not wait for playing before each seek
            for (j = 0; j < config.testSeek.seekCount; j++) {
                testSeek(j < (config.testSeek.seekCount - 1) ? -1 : PROGRESS_DELAY);
            }

        }

});
