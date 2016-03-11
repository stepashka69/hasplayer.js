/**
TEST_AUTHENT:

- Authenticate to platform
**/

define([
    'intern!object',
    'intern/chai!assert',
    'require',
    'testIntern/config/streams',
    'testIntern/config/testsConfig',
    'testIntern/tests/tests_functions',
    'testIntern/tests/authent_functions'
    ], function(registerSuite, assert, require, streams, config, tests, authent) {

        // Suite name
        var NAME = 'TEST_AUTHENT';

        // Test configuration (see config/testConfig.js)
        //var testConfig = config.tests.authent.authent;
        
        // Test variables
        var command = null;


        var setStreamsUrl = function () {
            for (var stream in streams) {
                if (streams[stream].url.indexOf('{platform_url}') !== -1) {
                    streams[stream].url = streams[stream].url.replace('{platform_url}', config.platform.streams_base_url);
                }
            }
        };
        
        var test = function() {

            registerSuite({
                name: NAME,

                setup: function() {
                    tests.log(NAME, 'Setup');
                    command = this.remote;
                    return command;
                },

                authentificate: function() {
                    return authent.connectUser(command, config.platform)
                    .then(function(text) {
                        assert.equal(text, "OK", "user is authenticated if value is OK");
                    }, function(){
                        assert.isTrue(false);
                    });
                }
            });
        };
        
        // Set streams url according to platform
        setStreamsUrl();

        test();
});
