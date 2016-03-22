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
         ERROR_ASYNC_TIMEOUT = 60
     
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

     
     var test = function(stream) {

          registerSuite({
                name: NAME,

                setup: function() {
                    tests.logLoadStream(NAME, stream);
                    return  command.execute(player.loadStream, [stream]);
                },
                
                teardown: function() {
                    return tests.executeAsync(command, proxy.resetRules, [proxyConfig.url], ASYNC_TIMEOUT);
                },

                'received video warn code': function() {
                        var not_found = proxyConfig.rules.not_found;
                            not_found.pattern = stream.video_fragment_pattern;
                        return tests.executeAsync(command, proxy.resetRules, [proxyConfig.url], ASYNC_TIMEOUT)
                       .then(tests.executeAsync.bind(null, command, proxy.executeRule, [not_found, proxyConfig.url], ASYNC_TIMEOUT))
                       .then(tests.executeAsync.bind(null,command, player.getWarningCode, [],ASYNC_TIMEOUT)
                       .then(function(warnCode){
                            assert.strictEqual(warnCode, testConfig.warnCode);
                        });
                },
                
                'received video error code': function() {
                    return tests.executeAsync(command, player.getErrorCode,[], ERROR_ASYNC_TIMEOUT)
                    .then(function(errorCode) {
                        assert.strictEqual(errorCode, testConfig.errorCode);
                    });
                },
                
                
            });
     };
     
     testSetup();
     // execute test on each streams
     for (var i = 0; i < streams.length; i++) {
         test(streams[i]);
     }
});