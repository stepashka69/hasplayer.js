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

        var loadStream = function(stream) {
            orangeHasPlayer.load(stream);
        };

        var addEventListener = function(type, listener, useCapture) {
           if(!document.events_spy) {
               document.events_spy = [];
               document.events_listeners = [];
           }

           document.events_spy[type] = 0;
           document.events_listeners[type] = function() {
                document.events_spy[type]++;
           }

           orangeHasPlayer.addEventListener(type, document.events_listeners[type]);
        };

        var removeEventListener = function(type) {
            return orangeHasPlayer.removeEventListener(type, document.events_listeners[type]);
        };

        var getEventsCount = function(type) {
            return document.events_spy[type];
        };

        var test_control_events = function(stream, tracks) {
            var url = config.testPage;

            registerSuite({
                name: 'Test events',

                setup: function() {
                    command = this.remote.get(require.toUrl(url));
                    return command.sleep(500).execute(loadStream, [stream]);
                },

                'Test pause event': function() {
                    console.log('[TEST_EVENTS] Test pause event');
                    return command
                    .sleep(5000)
                    .execute(addEventListener, ['pause'])
                    .then(function () {
                        return command.execute(function() {
                            orangeHasPlayer.pause();
                        })
                        .then(function() {
                            return command.execute(getEventsCount, ['pause']);
                        });
                    })
                    .then(function(eventCount) {
                        assert.ok(eventCount === 1, 'Proxy should have raised exactly 1 pause event.')
                    });
                },

                'Test play event': function() {
                    console.log('[TEST_EVENTS] Test play event');
                    return command
                    .sleep(1000)
                    .execute(addEventListener, ['play'])
                    .then(function () {
                        return command.execute(function() {
                            orangeHasPlayer.play();
                        })
                        .then(function() {
                            return command.execute(getEventsCount, ['play']);
                        });
                    })
                    .then(function(eventCount) {
                        assert.ok(eventCount === 1, 'Proxy should have raised exactly 1 play event.')
                    });
                },

                'Remove events listeners': function() {
                    console.log('[TEST_EVENTS] Remove events listeners...');
                    return command
                    .execute(removeEventListener, ['play'])
                    .then(function () {
                        return command.execute(removeEventListener, ['pause']);
                    });
                },

                'Test removed pause event listener': function() {
                    console.log('[TEST_EVENTS] Test removed pause event listener');
                    return command
                    .sleep(5000)
                    .execute(addEventListener, ['pause'])
                    .then(function () {
                        return command.execute(function() {
                            orangeHasPlayer.pause();
                        })
                        .then(function() {
                            return command.execute(getEventsCount, ['pause']);
                        });
                    })
                    .then(function(eventCount) {
                        assert.ok(eventCount === 1, 'Proxy should not have raised any more pause event.')
                    });
                },

                'Test removed play event listener': function() {
                    console.log('[TEST_EVENTS] Test removed play event listener');
                    return command
                    .sleep(1000)
                    .execute(addEventListener, ['play'])
                    .then(function () {
                        return command.execute(function() {
                            orangeHasPlayer.play();
                        })
                        .then(function() {
                            return command.execute(getEventsCount, ['play']);
                        });
                    })
                    .then(function(eventCount) {
                        assert.ok(eventCount === 1, 'Proxy should note have raised any more play event.')
                    });
                }
            });
        };

        var test_playbitrate_event = function(stream, tracks) {
            var url = config.testPage;

            registerSuite({
                name: 'Test play_bitrate events',

                setup: function() {
                    command = this.remote.get(require.toUrl(url));
                    return command.sleep(500).execute(loadStream, [stream]);
                },

                'Test play_bitrate event': function() {
                    console.log('[TEST_EVENTS] Test play_bitrate event');
                    return command
                    .execute(addEventListener, ['play_bitrate'])
                    .sleep(5000)
                    .then(function () {
                        return command.execute(getEventsCount, ['play_bitrate']);
                    })
                    .then(function(eventCount) {
                        assert.ok(eventCount > 1, 'Proxy should have raised at least 1 play_bitrate event.')
                    });
                }
            });
        };

        var test_downloadbitrate_event = function(stream, tracks) {
            var url = config.testPage;

            registerSuite({
                name: 'Test download_bitrate events',

                setup: function() {
                    command = this.remote.get(require.toUrl(url));
                    return command.sleep(500).execute(loadStream, [stream]);
                },

                'Test play_bitrate event': function() {
                    console.log('[TEST_EVENTS] Test download_bitrate event');
                    return command
                    .execute(addEventListener, ['download_bitrate'])
                    .sleep(5000)
                    .then(function () {
                        return command.execute(getEventsCount, ['download_bitrate']);
                    })
                    .then(function(eventCount) {
                        assert.ok(eventCount > 1, 'Proxy should have raised at least 1 download_bitrate event.')
                    });
                }
            });
        };

        var i = 0,
        len = config.events.length;

        for (i; i < len; i++) {
            test_control_events(config.events[i].stream);
            test_playbitrate_event(config.events[i].stream);
            test_downloadbitrate_event(config.events[i].stream);
        }
});
