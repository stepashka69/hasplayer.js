/*
    http://selenium-release.storage.googleapis.com/2.43/selenium-server-standalone-2.43.0.jar
    http://chromedriver.storage.googleapis.com/2.9/chromedriver_win32.zip
    http://selenium-release.storage.googleapis.com/2.43/IEDriverServer_x64_2.43.0.zip
    */

//java -jar selenium-server-standalone-2.43.0.jar -Dwebdriver.ie.driver=D:\selenium\IEDriverServer.exe -Dwebdriver.chrome.driver=D:\selenium\chromedriver.exe

// D:\FTRD\workspace\dash-js>node node_modules/intern/runner.js config=testIntern/intern

define([
    'intern!object',
    'intern/chai!assert',
    'intern/dojo/node!leadfoot/helpers/pollUntil',
    'require',
    'testIntern/orangeHasPlayer/functional_common/config'
    ], function(registerSuite, assert, pollUntil, require, config) {

        var command = null;

        var getErrorType = function() {
            return document.getElementById('titleError').innerHTML;
        };

        var getErrorMessage = function() {
            return document.getElementById('smallMessageError').innerHTML;
        };

        var test_errors = function(stream, errorType, errorMsg) {
            var url = config.testPage + '?url=' + stream;

            registerSuite({
                name: 'Test errors',

                setup: function() {
                    command = this.remote.get(require.toUrl(url));
                },

                'Test error type': function() {
                    console.log('[TEST_ERRORS] Test ' + errorType + ' error');
                    return command.sleep(2000)
                    .execute(getErrorType)
                    .then(function(error) {
                        return assert.equal(error, errorType);
                    });
                },

                'Test error msg': function() {
                    console.log('[TEST_ERRORS] Test ' + errorType + ' error message');
                    return command
                    .execute(getErrorMessage)
                    .then(function(msg) {
                        return assert.equal(msg, errorMsg);
                    });
                }
            });
        };

        var i = 0,
        len = config.errors.length;

        for (i; i < len; i++) {
            test_errors(config.errors[i].stream, config.errors[i].error, config.errors[i].msg);
        }
});
