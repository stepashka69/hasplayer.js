
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

        var test = function(stream) {

            var NAME = 'TEST_PLAY';
            var PROGRESS_DELAY = 10;
            var ASYNC_TIMEOUT = 15;

            registerSuite({
                name: NAME,

                setup: function() {
                    tests.log(NAME, 'Setup');
                    command = this.remote.get(require.toUrl(config.testPage));
                    command = tests.setup(command);
                    return command;
                },

                loadStream: function() {
                    tests.log(NAME, 'Load stream ' + stream.name + ' (' + stream.url + ')');
                    return command.execute(player.loadStream, [stream.url]);
                },

                checkIfPlaying: function() {
                    return command.executeAsync(video.isPlaying)
                    .then(function(isPlaying) {
                        assert.isTrue(isPlaying);
                    });
                },

                checkProgressing: function() {
                    return tests.executeAsync(command, video.isProgressing, [PROGRESS_DELAY], ASYNC_TIMEOUT)
                    .then(function(progressing) {
                        assert.isTrue(progressing);
                    }, function(){
                        assert.ok(false);
                    });
                }
            });
        };

        for (var i = 0; i < config.testPlay.streams.length; i++) {
            test(config.testPlay.streams[i]);
        }
});
