/**
TEST_ENDEDVENT:

- for each stream:
    - load test page
    - load stream (OrangeHasPlayer.load())
    - wait for stream to be loaded
    - seek near the end of the stream and check if ended event is sent
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
        var NAME = 'TEST_ENDEDVENT';

        // Test configuration (see config/testConfig.js)
        var testConfig = config.tests.api.endedEvent,
            streams = testConfig.streams;

        // Test constants

        // Test variables
        var command = null;

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

        var test = function(stream, trickModeEnabled) {

            registerSuite({
                name: NAME,

                loadStream: function() {
                    tests.logLoadStream(NAME, stream);
                    return command.execute(player.loadStream, [stream]);
                },

                getEndEvent: function() {
                    return tests.executeAsync(command, player.waitForEvent, ['loadeddata'], config.asyncTimeout)
                    .then(function(loaded) {
                        assert.isTrue(loaded);
                        return command.execute(player.getDuration);
                    })
                    .then(function (duration) {
                        return tests.executeAsync(command, player.seek, [duration - 5], config.asyncTimeout);
                    })
                    .then(function () {
                        if(trickModeEnabled){
                            tests.log(NAME, "detect ended event in trick mode");
                            return command.execute(player.setTrickModeSpeed, [2]);
                        } else {
                            tests.log(NAME, "detect ended event in normal mode");
                            return command.execute(player.getMute);
                        }
                    })
                    .then(function () {                            
                        return tests.executeAsync(command, player.waitForEvent, ['ended'], config.asyncTimeout);
                    })
                    .then(function(ended) {
                        assert.isTrue(ended);
                    });
                }
            });
        };

        // Setup (load test page)
        testSetup();

        for (var i = 0; i < streams.length; i++) {
            test(streams[i], i%2 === 0? true:false);
        }
});
