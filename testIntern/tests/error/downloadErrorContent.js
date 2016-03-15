/**
 * TEST downloadErrorContent
 * 
 * Fo each streams : 
 *      - load streams
 *      - play content
 *      - execute rule on proxy to error video / audio
 *      - check the raise of DOWNLOAD_ERROR_CONTENT warning and error
 */
define(['intern!object',
    'intern/chai!assert',
    'require',
    'testIntern/config/testsConfig',
    'testIntern/config/proxy',
    'testIntern/tests/proxy_functions',
    'testIntern/tests/player_functions',
    'testIntern/tests/video_functions',
    'testIntern/tests/tests_functions'
    ], function(registerSuite, assert, require, config ,proxyConfig, proxy, player, video, tests ) {
    
    // Suite name    
    var NAME = 'TEST DOWNLOAD_ERROR_CONTENT';
    
    // Test configuration (see config/testConfig.js)
    var testConfig = config.tests.error.downloadErrorContent,
        streams = testConfig.streams;
    
     // Test variables
     var command = null,
         ASYNC_TIMEOUT = config.asyncTimeout,
         ruleId= null;
     
     var test = function(stream){
          registerSuite({
                name: NAME,

                setup: function(){
                    tests.log(NAME, 'setup');
                    command = this.remote.get(require.toUrl(config.testPage));
                    command = tests.setup(command);
                    return command;
                },


                videoError: function() {
                    tests.logLoadStream(NAME, stream);
                    var not_found = proxyConfig.rules.not_found;
                        not_found.pattern = stream.video_fragment_pattern;
                        console.log("not found", not_found);
                    return tests.executeAsync(command, proxy.executeRule, [not_found, proxyConfig.url], ASYNC_TIMEOUT)
                    .then(function(id) {
                        if(id){
                            ruleId = id;
                            console.info("ruleId", ruleId);
                           return tests.executeAsync(command, player.getWarning, [],ASYNC_TIMEOUT);
                        }else{
                            assert.fail("cannot execute rule on proxy test failed");
                        }
                    })
                    .then(function(warnCode){
                        console.info("warnCode");
                        assert.strictEqual(warnCode, testConfig.warnCode);
                    });
                }
            });
     };
     
     // execute test on each streams
     for (var i = 0; i < streams.length; i++) {
         test(streams[i]);
     }
});