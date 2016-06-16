/**
TEST_CHANGESUBTITLEVISIBILITY:

- load test page
- for each stream:
    - load stream
    - enable Subtitles
    - test visibility
    - disable Subtitles
    - test visibility
    - repeat N times:
**/
define([
    'intern!object',
    'intern/chai!assert',
    'require',
    'testIntern/config/testsConfig',
    'testIntern/tests/player_functions',
    'testIntern/tests/video_functions',
    'testIntern/tests/tests_functions'
    ], function(registerSuite, assert, require, config, player, video, tests) {

        // Suite name
        var NAME = 'TEST_CHANGESUBTITLEVISIBILITY';

        // Test configuration (see config/testConfig.js)
        var testConfig = config.tests.subtitle.changeSubtitleVisibility,
            streams = testConfig.streams;

        // Test constants
        var PROGRESS_DELAY = 2; // Delay for checking progressing (in s) 
        var ASYNC_TIMEOUT = PROGRESS_DELAY + config.asyncTimeout;


        // Test variables
        var command = null,
            _selectedSubtitleTrack,
            i;

        var test = function (stream) {
            registerSuite({
                name: NAME,

                setup: function() {
                    tests.log(NAME, 'Setup');
                    command = this.remote.get(require.toUrl(config.testPage));
                    command = tests.setup(command);
                    return command;
                },

                play: function() {
                    tests.log(NAME, 'enable subtitles external display');
                    return command.execute(player.enableSubtitleExternDisplay,[true])
                    .then(function () {
                        tests.log(NAME, 'set default subtitles language to '+stream.defaultSubtitleLang);
                        return command.execute(player.setDefaultSubtitleLanguage,[stream.defaultSubtitleLang]);
                    })
                    .then(function () {
                        tests.logLoadStream(NAME, stream);
                        return command.execute(player.loadStream, [stream]);
                    })
                    .then(function () {
                        tests.log(NAME, 'Check if playing after ' + PROGRESS_DELAY + 's.');
                        return tests.executeAsync(command, video.isPlaying, [PROGRESS_DELAY], ASYNC_TIMEOUT);
                    })
                    .then(function() {
                        tests.log(NAME, 'enable subtitles');
                        return command.execute(player.setSubtitlesVisibility,[true]);
                    })
                    .then(function () {
                        tests.log(NAME, 'check subtitles display');
                        return command.sleep(5 * 1000).execute(player.getSubtitlesVisibility);
                    })
                    .then( function (subtitleDisplay) {
                        assert.isTrue(subtitleDisplay === true);
                        tests.log(NAME, 'subtitles visibility ok');
                        return command.execute(player.getSelectedSubtitleLanguage);
                    })
                    .then(function (subtitleTrack) {
                         _selectedSubtitleTrack = subtitleTrack;
                        tests.log(NAME, 'current subtitleTrack lang = '+subtitleTrack.lang);
                        tests.log(NAME, 'default subtitleTrack lang = '+stream.defaultSubtitleLang);
                        assert.isTrue(subtitleTrack.lang === stream.defaultSubtitleLang);
                        return tests.executeAsync(command, player.waitForEvent, ['cueEnter'], config.asyncTimeout);
                    })
                    .then(function (subtitlesData) {
                        for (var i = 0; i < stream.subtitleTracks.length; i++) {
                            if (stream.subtitleTracks[i].lang === _selectedSubtitleTrack.lang) {
                                assert.isTrue(subtitlesData.data.style.backgroundColor === stream.subtitleTracks[i].style.backgroundColor);
                                assert.isTrue(subtitlesData.data.style.color === stream.subtitleTracks[i].style.color);
                                break;
                            }
                        }
                        tests.log(NAME, 'subtitle data style is OK');
                        return command.execute(player.setSubtitlesVisibility,[false]);
                    })
                    .then(function () {
                        tests.log(NAME, 'subtitles visibility hidden');
                        return command.execute(player.getSelectedSubtitleLanguage);
                    })
                    .then(function (subtitleTrack) {
                        assert.isTrue(subtitleTrack === null);
                    });
                }
            });
        };

        for (i = 0; i < streams.length; i++) {
            // setup: load test page and stream
            test(streams[i]);
        }

});