
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

        var NAME = 'TEST_ZAPPING';
        var PROGRESS_DELAY = 5; // Delay for checking progressing (in s) 
        var SEEK_PLAY = 500;    // Delay before each play operation (in ms)
        var ASYNC_TIMEOUT = 5;
        var i;

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

        var testSetup = function () {
            registerSuite({
                name: NAME,

                setup: function() {
                    tests.log(NAME, 'Setup');
                    command = this.remote.get(require.toUrl(config.testPage));
                    command = tests.setup(command);
                    return command;
                }
            });
        };

        var testZapping = function (stream, progressDelay) {

            registerSuite({
                name: NAME,

                zapping: function () {
                    tests.logLoadStream(NAME, stream);
                    return command.sleep(SEEK_PLAY)
                    .execute(player.loadStream, [stream])
                    .then(function () {
                        if (progressDelay >= 0) {
                            return isPlaying(progressDelay);
                        }
                    });
                }
            });
        };

        var streams = config.testZapping.streams;

        // Setup (load test page)
        testSetup();

        // Zapping (change stream after some progressing)
        for (i = 0; i < streams.length; i++) {
            testZapping(streams[i], PROGRESS_DELAY);
        }

        // Zapping (change stream as soon as playing)
        for (i = 0; i < streams.length; i++) {
            testZapping(streams[i], i < (streams.length - 1) ? 0 : PROGRESS_DELAY);
        }

        // Fast zapping (change stream without waiting for playing)
        for (i = 0; i < streams.length; i++) {
            testZapping(streams[i], i < (streams.length - 1) ? -1 : PROGRESS_DELAY);
        }

});
