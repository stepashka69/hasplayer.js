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
        var videoCurrentTime = 0;

        var loadStream = function(stream) {
            orangeHasPlayer.load(stream);
        };

        var getVideoCurrentTime = function () {
            return orangeHasPlayer.getPosition();
        };

        var seek = function (time) {
            try {
                orangeHasPlayer.seek(time);
            } catch(err) {
                return err.message;
            }
        };

        var test_init = function(stream) {

            var url = config.testPage;

            registerSuite({
                name: 'Test seeking functionnality',

                setup: function() {
                    command = this.remote.get(require.toUrl(url));
                    return command.sleep(500).execute(loadStream, [stream]);
                },

                'Initialize the test': function() {
                    console.log('[TEST_SEEK] stream: ' + stream);

                    return command.execute(getVideoCurrentTime)
                    .then(function(time) {
                        videoCurrentTime = time;
                        console.log('[TEST_SEEK] current time = ' + videoCurrentTime);
                    });
                },

                'Check playing': function() {
                    console.log('[TEST_SEEK] Check playing (wait 5s ...)');

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

                    console.log('[TEST_SEEK] Do seek to ' + seekTime + 's...');

                    return command.execute(seek, [seekTime])
                    .execute(getVideoCurrentTime)
                    // Wait for current time > 30, i.e. seek has been done and video is playing
                    .then(pollUntil(
                        function (seekTime) {
                            var time = document.querySelector('video').currentTime;
                            return (time >= seekTime) ? true : null;
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
                    console.log('[TEST_SEEK] Check playing (wait 2s ...)');

                    return command.sleep(2000)
                    .execute(getVideoCurrentTime)
                    .then(function (time) {
                        console.log('[TEST_SEEK] current time = ' + time);
                        assert.ok(time >= videoCurrentTime);
                        videoCurrentTime = time;
                    });
                }
            });
        };

        var test_seek_over_duration = function(stream, streamDuration) {
            var url = config.testPage;

            registerSuite({
                name: 'Test seek over duration',

                setup: function() {
                    command = this.remote.get(require.toUrl(url));
                    return command.sleep(500).execute(loadStream, [stream]);
                },

                'Get current time': function() {
                    console.log('[TEST_SEEK] stream: ' + stream);

                    return command.execute(getVideoCurrentTime)
                    .then(function(time) {
                        videoCurrentTime = time;
                        console.log('[TEST_SEEK] current time = ' + videoCurrentTime);
                    });
                },

                'Seek over duration': function() {
                    console.log("[TEST_SEEK] Seek over duration");

                    return command.sleep(2000).execute(seek, [1000])
                    .then(function(errMsg) {
                        return assert.equal(errMsg, 'OrangeHasPlayer.seek(): seek value not correct');
                    })
                    .execute(getVideoCurrentTime)
                    .then(function(time) {
                        var delay = time - streamDuration;
                        console.log("[TEST_SEEK] time: " + time)
                        videoCurrentTime = time;
                        assert.ok(delay < 1);
                    });
                }
            });
        }

        var test_seek_to_zero = function(stream) {
            var url = config.testPage;

            registerSuite({
                name: 'Test seek to zero',

                setup: function() {
                    command = this.remote.get(require.toUrl(url));
                    return command.sleep(500).execute(loadStream, [stream]);
                },

                'Get current time': function() {
                    console.log('[TEST_SEEK] stream: ' + stream);

                    return command.execute(getVideoCurrentTime)
                    .then(function(time) {
                        videoCurrentTime = time;
                        console.log('[TEST_SEEK] current time = ' + videoCurrentTime);
                    });
                },

                'Seek to zero': function() {
                    console.log("[TEST_SEEK] Seek to zero");

                    return command.sleep(2000).execute(seek, [0])
                    .execute(getVideoCurrentTime)
                    .then(function(time) {
                        var delay = time;
                        console.log("[TEST_SEEK] time: " + time)
                        videoCurrentTime = time;
                        assert.ok(delay < 1);
                    });
                }
            });
        }

        var test_seek_under_zero = function(stream) {
            var url = config.testPage;

            registerSuite({
                name: 'Test seek under zero',

                setup: function() {
                    command = this.remote.get(require.toUrl(url));
                    return command.sleep(500).execute(loadStream, [stream]);
                },

                'Get current time': function() {
                    console.log('[TEST_SEEK] stream: ' + stream);

                    return command.execute(getVideoCurrentTime)
                    .then(function(time) {
                        videoCurrentTime = time;
                        console.log('[TEST_SEEK] current time = ' + videoCurrentTime);
                    });
                },

                'Seek under zero': function() {
                    console.log("[TEST_SEEK] Seek under zero");

                    return command.execute(seek, [-1])
                    .then(function(errMsg) {
                        return assert.equal(errMsg, 'OrangeHasPlayer.seek(): seek value not correct');
                    })
                    .execute(getVideoCurrentTime)
                    .then(function(time) {
                        console.log("[TEST_SEEK] time: " + time)
                        videoCurrentTime = time;
                        assert.ok(time < 1 && time >= 0);
                    });
                }
            });
        }

        var test_repeat_seek_nodelay = function(seekTime) {

            registerSuite({
                name: 'Test seeking functionnality',

                'Do seek with no delay': function() {

                    console.log('[TEST_SEEK] Seek to ' + seekTime + 's...');

                    return command.execute(seek, [seekTime])
                    .sleep(100)
                    .then(function () {
                        return command.execute(getVideoCurrentTime)
                        .then(function (time) {
                            var delay = time - seekTime
                            console.log('[TEST_SEEK] current time = ' + time + ', delay: ' + delay);
                            assert.ok(delay < 0.5);
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

                'Do seek with delay': function() {

                    console.log('[TEST_SEEK] Seek to ' + seekTime + 's...');

                    return command.execute(seek, [seekTime])
                    .sleep(100)
                    .then(function () {
                        return command.execute(getVideoCurrentTime)
                        .then(function (time) {
                            console.log('[TEST_SEEK] current time = ' + time);
                            assert.ok((time - seekTime) < 1);
                            videoCurrentTime = time;
                            return true;
                        });
                    }, function (error) {
                        assert.ok(false, '[TEST_SEEK] Failed to seek');
                    }).sleep(3000).execute(getVideoCurrentTime)
                    .then(function (time) {
                        console.log('[TEST_SEEK] current time = ' + time);
                        assert.ok(time > videoCurrentTime, 'Test if video plays after seek');
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
                test_seek(randomSeekPosition, config.seek[i].duration);
            }

            /*randomSeekPosition = Math.round(Math.random() * config.seek[i].duration * 100) / 100;
            for (j = 0; j < config.seek[i].seekCount; j++) {
                test_repeat_seek_nodelay(randomSeekPosition);
            }*/

            randomSeekPosition = Math.round(Math.random() * (config.seek[i].duration - 5) * 100) / 100;
            for (j = 0; j < config.seek[i].seekCount; j++) {
                test_repeat_seek_delay(randomSeekPosition);
            }

            test_seek_over_duration(config.seek[i].stream, config.seek[i].duration);
            test_seek_to_zero(config.seek[i].stream);
            test_seek_under_zero(config.seek[i].stream);
        }
});
