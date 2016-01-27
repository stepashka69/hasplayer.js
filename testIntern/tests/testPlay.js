
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
            var DELAY = 10;

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
                    command.execute(player.loadStream, [stream.url]);
                    return command;
                },

                checkIfPlaying: function() {
                    return command.executeAsync(video.isPlaying).then(function(isPlaying){
                        assert.isTrue(isPlaying);
                    });
                },

                checkIfAlwaysPlaying: function() {
                    return tests.executeAsync(command, video.stillPlaying, [DELAY], DELAY).then(
                        function(stillPlaying){
                            assert.isTrue(stillPlaying);
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
