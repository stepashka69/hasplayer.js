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
        var videoVolume = 0;
        var videoMuted = null;

        var loadStream = function(stream) {
            orangeHasPlayer.load(stream);
        };

        var getVolume = function() {
            return orangeHasPlayer.getVolume();
        };

        var getVideoVolume = function() {
            return document.querySelector('video').volume;
        };

        var getMute = function() {
            return orangeHasPlayer.getMute();
        };

        var getVideoMute = function() {
            return document.querySelector('video').muted;
        };

        var setVolume = function(volume) {
            try {
                orangeHasPlayer.setVolume(volume);
            }
            catch (err) {
                return err.message;
            }
        };

        var setMute = function(muted) {
            orangeHasPlayer.setMute(muted);
        };

        var test_volume = function(stream) {
            var url = config.testPage;

            registerSuite({
                name: 'Test volume',

                setup: function() {
                    command = this.remote.get(require.toUrl(url));
                    return command.execute(loadStream, [stream]).sleep(3000);
                },

                'Check initial video volume': function() {
                    console.log('[TEST_VOLUME] Check initial video volume');
                    return command
                    .execute(getVideoVolume)
                    .then(function (volume) {
                        videoVolume = volume;
                        return assert.equal(volume, 1, 'Initial video volume level should be 1.');
                    });
                },

                'Check initial proxy volume': function() {
                    console.log('[TEST_VOLUME] Check initial proxy volume');
                    return command
                    .execute(getVolume)
                    .then(function (volume) {
                        return assert.equal(volume, 1, 'Initial proxy volume level should be 1.');
                    });
                },

                'Set volume to valid level': function() {
                    console.log('[TEST_VOLUME] Set volume to valid level 0.42');
                    return command
                    .execute(setVolume, [0.42])
                    .then(function() {
                        return command.execute(getVideoVolume);
                    })
                    .then(function(volume) {
                        videoVolume = volume;
                        return command.execute(getVolume);
                    })
                    .then(function (volume) {
                        assert.equal(volume, 0.42, 'The proxy volume level should be 0.42');
                        return assert.equal(volume, videoVolume, 'Video tag volume and proxy volume should match.');
                    });
                },

                'Set volume to max level': function() {
                    console.log('[TEST_VOLUME] Set volume to max level 1');
                    return command
                    .execute(setVolume, [1])
                    .then(function() {
                        return command.execute(getVideoVolume);
                    })
                    .then(function(volume) {
                        videoVolume = volume;
                        return command.execute(getVolume);
                    })
                    .then(function (volume) {
                        assert.equal(volume, 1, 'The proxy volume level should be 1');
                        return assert.equal(volume, videoVolume, 'Video tag volume and proxy volume should match.');
                    });
                },

                'Set volume to min level': function() {
                    console.log('[TEST_VOLUME] Set volume to min level 0');
                    return command
                    .execute(setVolume, [0])
                    .then(function() {
                        return command.execute(getVideoVolume);
                    })
                    .then(function(volume) {
                        videoVolume = volume;
                        return command.execute(getVolume);
                    })
                    .then(function (volume) {
                        assert.equal(volume, 0, 'The proxy volume level should be 0');
                        return assert.equal(volume, videoVolume, 'Video tag volume and proxy volume should match.');
                    });
                },

                'Set volume over max level': function() {
                    console.log('[TEST_VOLUME] Set volume over max level (1337)');
                    return command
                    .execute(setVolume, [1337])
                    .then(function(errMsg) {
                        assert.ok(errMsg === 'OrangeHasPlayer.setVolume(): Invalid Arguments', 'Message is: ' + errMsg);
                        return command.execute(getVideoVolume);
                    })
                    .then(function(volume) {
                        videoVolume = volume;
                        return command.execute(getVolume);
                    })
                    .then(function (volume) {
                        assert.equal(volume, 0, 'The proxy volume level should be 0');
                        return assert.equal(volume, videoVolume, 'Video tag volume and proxy volume should match.');
                    });
                },

                'Set volume under min level': function() {
                    console.log('[TEST_VOLUME] Set volume under min level (-1)');
                    return command
                    .execute(setVolume, [-1])
                    .then(function(errMsg) {
                        assert.ok(errMsg === 'OrangeHasPlayer.setVolume(): Invalid Arguments', 'Message is: ' + errMsg);
                        return command.execute(getVideoVolume);
                    })
                    .then(function(volume) {
                        videoVolume = volume;
                        return command.execute(getVolume);
                    })
                    .then(function (volume) {
                        assert.equal(volume, 0, 'The proxy volume level should be 0');
                        return assert.equal(volume, videoVolume, 'Video tag volume and proxy volume should match.');
                    });
                }
            });
        };

        var test_mute = function(stream) {
            var url = config.testPage;

            registerSuite({
                name: 'Test volume',

                setup: function() {
                    command = this.remote.get(require.toUrl(url));
                    return command.execute(loadStream, [stream]).sleep(3000);
                },

                'Check initial video mute': function() {
                    console.log('[TEST_VOLUME] Check initial video mute');
                    return command
                    .execute(getVideoMute)
                    .then(function (muted) {
                        return assert.equal(muted, false, 'Initial video mute state should be false.');
                    });
                },

                'Check initial proxy mute': function() {
                    console.log('[TEST_VOLUME] Check initial proxy mute');
                    return command
                    .execute(getMute)
                    .then(function (muted) {
                        return assert.equal(muted, false, 'Initial mute state should be false.');
                    });
                },

                'Mute': function() {
                    console.log('[TEST_VOLUME] Mute');
                    return command
                    .execute(setMute, [true])
                    .then(function() {
                        return command.execute(getVideoMute);
                    })
                    .then(function(muted) {
                        videoMuted = muted;
                        return command.execute(getMute);
                    })
                    .then(function (muted) {
                        assert.equal(muted, true, 'The proxy should be muted');
                        return assert.equal(muted, videoMuted, 'Video tag and proxy volume should say "muted".');
                    });
                },

                'Unmute': function() {
                    console.log('[TEST_VOLUME] Unmute');
                    return command
                    .execute(setMute, [false])
                    .then(function() {
                        return command.execute(getVideoMute);
                    })
                    .then(function(muted) {
                        videoMuted = muted;
                        return command.execute(getMute);
                    })
                    .then(function (muted) {
                        assert.equal(muted, false, 'The proxy should not be muted');
                        return assert.equal(muted, videoMuted, 'Video tag and proxy volume should not say "muted".');
                    });
                }
            });
        };

        var i = 0,
        len = config.volume.length;

        for (i; i < len; i++) {
            test_volume(config.volume[i].stream);
            test_mute(config.volume[i].stream);
        }
});
