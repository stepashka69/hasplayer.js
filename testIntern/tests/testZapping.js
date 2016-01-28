
define([
    'intern!object',
    'intern/chai!assert',
    'intern/dojo/node!leadfoot/helpers/pollUntil',
    'require',
    'testIntern/config/testsConfig',
    'testIntern/tests/player_functions',
    'testIntern/tests/video_functions',
    'testIntern/tests/tests_functions'
    ], function(registerSuite, assert, pollUntil, require, config, player, video, tests) {

        var command = null;

        var test = function(streams) {

            var NAME = 'TEST_ZAPPING';
            var PROGRESS_DELAY = 5;
            var ASYNC_TIMEOUT = 5;

            var testZapping = function(command, i, progressDelay) {
                tests.log(NAME, 'Load stream ' + streams[i].name + ' (' + streams[i].url + ')');
                return command.execute(player.loadStream, [streams[i].url])
                .executeAsync(video.isPlaying)
                .then(function(isPlaying) {
                    assert.isTrue(isPlaying);
                })
                .then(function () {
                    return tests.executeAsync(command, video.isProgressing, [progressDelay], (progressDelay + ASYNC_TIMEOUT));
                })
                .then(
                    function(progressing) {
                        if (i < (streams.length - 1)) {
                            return testZapping(command, i+1, progressDelay);
                        } else {
                            assert.isTrue(progressing);
                        }
                    }, function(){
                        assert.ok(false);
                    }
                );
            };

            var testReset = function(command, i) {
                tests.log(NAME, 'Load stream ' + streams[i].name + ' (' + streams[i].url + ')');
                return command.execute(player.loadStream, [streams[i].url])
                .sleep(500)
                .then(function() {
                    if (i < (streams.length - 1)) {
                        return testReset(command, i+1);
                    } else {
                        return command.executeAsync(video.isPlaying)
                        .then(function(isPlaying) {
                            assert.isTrue(isPlaying);
                        });
                    }
                });
            };

            registerSuite({
                name: NAME,

                setup: function() {
                    tests.log(NAME, 'Setup');
                    command = this.remote.get(require.toUrl(config.testPage));
                    command = tests.setup(command);
                    return command;
                },

                zapping: function () {
                    return testZapping(command, 0, PROGRESS_DELAY);
                },

                fastZapping: function () {
                    return testZapping(command, 0, 0);
                },

                fastReset: function () {
                    return testReset(command, 0);
                }
            });
        };

        test(config.testZapping.streams);

});
