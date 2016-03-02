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
    'testIntern/tests/tests_functions',
    'testIntern/tests/authent_functions'
    ], function(registerSuite, assert, require, config,tests, authent) {

        // Suite name
        var NAME = 'TEST_AUTHENT';

        // Test configuration (see config/testConfig.js)
        var testConfig = config.tests.authent.authent;
        
        // Test variables
        var command = null;
        
        var test = function(stream) {

            registerSuite({
                name: NAME,

                setup: function() {
                    tests.log(NAME, 'Setup');
                    command = this.remote;
                    return command;
                },

          

                authentificate: function() {
                    return authent.connectUser(command, testConfig.environment)
                    .then(function(text) {
                        assert.equal(text, "OK","user is authenticated if value is OK");
                    }, function(){
                        assert.isTrue(false);
                    });
                }
            });
        };
        
        test();
});
