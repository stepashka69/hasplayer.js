

define([
    'intern!object',
    'intern/chai!assert',
    'intern/dojo/node!leadfoot/helpers/pollUntil',
    'require',
    'testIntern/config'
    ], function(registerSuite, assert, pollUntil, require, config) {

        var command = null;
        var videoCurrentTime = 0;

        var getVideoCurrentTime = function() {
            return document.querySelector('video').currentTime;
        };

        var tests = function(stream, startTime) {

            var url = config.testPage + '?url=' + stream + '#s=' + startTime;

            registerSuite({
                name: 'Test playing streams with start time',

                'Initialize the test': function() {
                    console.log('[TEST_START-TIME] stream: ' + stream);
                    console.log('[TEST_START-TIME] startTime: ' + startTime);

                    command = this.remote.get(require.toUrl(url));

                    return command.execute(getVideoCurrentTime)
                    .then(function (time) {
                        videoCurrentTime = time;
                        assert.equal(time, 0, 'The player should not have began to play yet.')
                        console.log('[TEST_START-TIME] current time = ' + videoCurrentTime);
                    });
                },

                'Check playing time': function() {
                    console.log('[TEST_START-TIME] Check if playing is > ' + startTime);

                    return command.then(pollUntil(
                        function (_startTime) {
                            var time = document.querySelector('video').currentTime;
                            return (time > _startTime) ? true : null;
                        }, [startTime], 10000))
                    .then(function () {
                        return command.execute(getVideoCurrentTime)
                        .then(function (time) {
                            console.log('[TEST_START-TIME] current time = ' + time);
                            assert.ok(time > videoCurrentTime, 'Test if player has played');
                            videoCurrentTime = time;
                        });
                    }, function (error) {
                        assert.ok(false, '[TEST_START-TIME] Failed to start at time ' + startTime);
                    });
                }
            });
        };

        var i = 0,
            len = config.startTime.length;

        for (i; i < len; i++) {
            tests(config.startTime[i].stream, config.startTime[i].time);
        }
});
