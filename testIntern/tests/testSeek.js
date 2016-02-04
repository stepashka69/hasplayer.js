/**
TEST_SEEK:

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

        var command = null;

        var NAME = 'TEST_SEEK';
        var PROGRESS_DELAY = 2; // Delay for checking progressing (in s) 
        var SEEK_SLEEP = 200;   // Delay before each seek operation (in ms)
        var streamDuration = 0;
        var i, j;

        var generateSeekPos = function () {
            var pos = Math.round(Math.random() * streamDuration * 100) / 100;
            if (pos > (streamDuration - PROGRESS_DELAY)) {
                pos -= PROGRESS_DELAY;
            }
            if (pos < PROGRESS_DELAY) {
                pos += PROGRESS_DELAY;
            }
            return pos;
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
                        return tests.executeAsync(command, video.isPlaying, [PROGRESS_DELAY], (PROGRESS_DELAY + config.asyncTimeout));
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

        var testSeek = function (progressDelay) {

            registerSuite({
                name: NAME,

                seek: function () {
                    var seekPos;

                    return command.sleep(SEEK_SLEEP)
                    .then(function () {
                        seekPos = generateSeekPos();
                        tests.log(NAME, 'Seek: ' + seekPos);
                        return command.execute(player.seek, [seekPos]);
                    })
                    .then(function () {
                        if (progressDelay >= 0) {
                            tests.log(NAME, 'Check if playing');
                            return tests.executeAsync(command, video.isPlaying, [0], config.asyncTimeout)
                            .then(function (playing) {
                                assert.isTrue(playing);
                                return command.execute(video.getCurrentTime);
                            })
                            .then(function (time) {
                                tests.log(NAME, 'Check current time ' + time);
                                assert.isTrue(time >= seekPos);
                                if (progressDelay >= 0) {
                                    tests.log(NAME, 'Check if playing after ' + progressDelay + 's.');
                                    return tests.executeAsync(command, video.isPlaying, [progressDelay], (progressDelay + config.asyncTimeout))
                                    .then(function(playing) {
                                        assert.isTrue(playing);
                                    });
                                }
                            });
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
