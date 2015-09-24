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
    'testIntern/config'
    ], function(registerSuite, assert, pollUntil, require, config) {

        var command = null;
        var videoCurrentTime = 0;

        var getVideoCurrentTime = function () {
            return document.querySelector('video').currentTime;
        };

        var seek = function (time) {
            document.querySelector('video').currentTime = time;
        };

        var test_init = function(stream) {

            var url = config.testPage + '?url=' + stream;

            registerSuite({
                name: 'Test seeking functionnality',

                'Initialize the test': function() {
                    console.log('[TEST_SEEK] stream: ' + stream);

                    command = this.remote.get(require.toUrl(url));

                    return command.execute(getVideoCurrentTime)
                    .then(function(time) {
                        videoCurrentTime = time;
                        console.log('[TEST_SEEK] current time = ' + videoCurrentTime);
                    });
                },

                'Check playing': function() {
                    console.log('[TEST_SEEK] Wait 5s ...');

                    return command.sleep(5000)
                    .execute(getVideoCurrentTime)
                    .then(function (time) {
                        console.log('[TEST_SEEK] current time = ' + time);
                        assert.ok(time > videoCurrentTime);
                        videoCurrentTime = time;
                    });
                }
            });
        };


        var test_seek = function(seekTime) {

            registerSuite({
                name: 'Test seeking functionnality',

                'Do seek': function() {

                    console.log('[TEST_SEEK] Seek to ' + seekTime + 's...');

                    return command.execute(seek, [seekTime])
                    // Wait for current time > 30, i.e. seek has been done and video is playing
                    .then(pollUntil(
                        function (seekTime) {
                            var time = document.querySelector('video').currentTime;
                            return (time > seekTime) ? true : null;
                        }, [seekTime], 10000))
                    .then(function () {
                        return command.execute(getVideoCurrentTime)
                        .then(function (time) {
                            console.log('[TEST_SEEK] current time = ' + time);
                            videoCurrentTime = time;
                        });
                    }, function (error) {
                        assert.ok(false, '[TEST_SEEK] Failed to seek');
                    });
                },

                'Check playing': function() {
                    console.log('[TEST_SEEK] Wait 2s ...');

                    return command.sleep(2000)
                    .execute(getVideoCurrentTime)
                    .then(function (time) {
                        var delay = time - videoCurrentTime;
                        console.log('[TEST_SEEK] current time = ' + time + ' (' + Math.round(delay*100)/100 + ')');
                        assert.ok(delay >= 1.5);
                    });
                }
            });
        };

        var test_repeat_seek_nodelay = function(seekTime) {

            registerSuite({
                name: 'Test seeking functionnality',

                'Do seek with no delay': function() {

                    console.log('[TEST_SEEK] Seek to ' + seekTime + 's...');

                    return command.execute(seek, [seekTime])
                    .then(pollUntil(
                        function (seekTime) {
                            var time = document.querySelector('video').currentTime;
                            return (time > seekTime) ? true : null;
                        }, [seekTime], 10000))
                    .then(function () {
                        return command.execute(getVideoCurrentTime)
                        .then(function (time) {
                            console.log('[TEST_SEEK] current time = ' + time);
                            assert.ok((time - seekTime) < 0.5);
                            videoCurrentTime = time;
                        });
                    }, function (error) {
                        assert.ok(false, '[TEST_SEEK] Failed to seek');
                    });
                }
            });
        };

        var test_repeat_seek_delay = function(seekTime) {

            registerSuite({
                name: 'Test seeking functionnality',

                'Do seek with no delay': function() {

                    console.log('[TEST_SEEK] Seek to ' + seekTime + 's...');

                    return command.execute(seek, [seekTime])
                    .then(pollUntil(
                        function (seekTime) {
                            var time = document.querySelector('video').currentTime;
                            return (time > seekTime) ? true : null;
                        }, [seekTime], 10000))
                    .then(function () {
                        return command.execute(getVideoCurrentTime)
                        .then(function (time) {
                            console.log('[TEST_SEEK] current time = ' + time);
                            assert.ok((time - seekTime) < 0.5);
                            videoCurrentTime = time;
                            return true;
                        });
                    }, function (error) {
                        assert.ok(false, '[TEST_SEEK] Failed to seek');
                    }).sleep(2000).execute(getVideoCurrentTime)
                    .then(function (time) {
                        console.log('[TEST_SEEK] current time = ' + time);
                        assert.ok((time - videoCurrentTime) > 1.5, 'Test if video plays after seek');
                        videoCurrentTime = time;
                        return true;
                    });
                }
            });
        };

        var i, j,
            randomSeekPosition = 0;

        for (i = 0; i < config.seek.length; i++) {
            test_init(config.seek[i].stream);
            for (j = 0; j < config.seek[i].seekCount; j++) {
                // Generate a random seek time
                randomSeekPosition = Math.round(Math.random() * config.seek[i].duration * 100) / 100;
                test_seek(randomSeekPosition);
            }

            randomSeekPosition = Math.round(Math.random() * config.seek[i].duration * 100) / 100;
            for (j = 0; j < config.seek[i].seekCount; j++) {
                test_repeat_seek_nodelay(randomSeekPosition);
            }

            randomSeekPosition = Math.round(Math.random() * config.seek[i].duration * 100) / 100;
            for (j = 0; j < config.seek[i].seekCount; j++) {
                test_repeat_seek_delay(randomSeekPosition);
            }
        }
});
