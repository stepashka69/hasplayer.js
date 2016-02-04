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
    'testIntern/orangeHasPlayer/functional_common/config',
    'testIntern/tests/player_functions',
    'testIntern/tests/video_functions',
    'testIntern/tests/tests_functions'
    ], function(registerSuite, assert, pollUntil, require, config, player, video, tests) {

        var command = null;

     

        var test = function(stream) {
            var url = config.testPage;

            registerSuite({
                name: 'Test playing Live streams',

                setup: function() {
                    console.log("[TEST_PLAYLIVE] SETUP");
                    command = this.remote.get(require.toUrl(url));
                    command = tests.setup(command);
                    return command;
                },

                loadStream: function(){
                    console.log("[TEST_PLAYLIVE] LoadStream", stream);
                    command.execute(player.loadStream, [stream]);
                    return command;
                },

                checkIfPlaying: function() {
                    console.log("[TEST_PLAYLIVE] checkIfPlaying");
                    return command.executeAsync(video.isPlaying).then(function(isPlaying){
                        assert.isTrue(isPlaying);
                    });
                },

                checkIfAlwaysPlaying: function(){
                    var time = 10;
                    console.log("[TEST_PLAYLIVE] checkIfPlaying after", time, "seconds");
                
                    return tests.executeAsync(command, video.stillPlaying, [10], 15000).then(
                        function(stillPlaying){
                            assert.isTrue(stillPlaying);
                        }, function(){
                            assert.fail(false, true, "An arror occured it semms stream is playing for time");
                        });
                }
            });
        };

        var i = 0,
            len = config.playLive.length;

        for (i; i < len; i++) {
            test(config.playLive[i].stream);
        }
});
