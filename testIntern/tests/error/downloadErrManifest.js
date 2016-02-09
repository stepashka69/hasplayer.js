/**
TEST_PLAY:

- for each stream:
    - load test page
    - load stream (OrangeHasPlayer.load())
    - check if <video> is playing
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
        var NAME = 'TEST_ERROR_DOWNLOAD_ERR_MANIFEST';

        // Test configuration (see config/testConfig.js)
        var testConfig = config.tests.error.downloadErrManifest,
            streams = testConfig.streams;

        // Test constants
        var ASYNC_TIMEOUT = config.asyncTimeout;
        var ERROR_CODE = "DOWNLOAD_ERR_MANIFEST";

        // Test variables
        var command = null;

        var test = function(stream) {

            registerSuite({
                name: NAME,

                setup: function() {
                    tests.log(NAME, 'Setup');
                    command = this.remote.get(require.toUrl(config.testPage));
                    command = tests.setup(command);
                    return command;
                },

                loadStream: function() {
                    tests.logLoadStream(NAME, stream);
                    return command.execute(player.loadStream, [stream]);
                },

                getErrorCode: function() {
                    return tests.executeAsync(command, player.getErrorCode, [], ASYNC_TIMEOUT)
                    .then(function(errorCode) {
                        tests.log(NAME, 'Error: ' + errorCode);
                        assert.strictEqual(errorCode, ERROR_CODE);
                    });
                }
            });
        };

        for (var i = 0; i < streams.length; i++) {
            test(streams[i]);
        }
});
