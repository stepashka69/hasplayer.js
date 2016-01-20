// Learn more about configuring this file at <https://github.com/theintern/intern/wiki/Configuring-Intern>.
// These default settings work OK for most people. The options that *must* be changed below are the
// packages, suites, excludeInstrumentation, and (if you want functional tests) functionalSuites.
define(function(require){


    var seleniumConfig = require('../seleniumConfig/configDistant');


    var conf = {
        // Browsers to run integration testing against. Note that version numbers must be strings if used with Sauce
        // OnDemand. Options that will be permutated are browserName, version, platform, and platformVersion; any other
        // capabilities options specified for an environment will be copied as-is
        environments: [
            { browserName: 'chrome', /*version: '2.11', */platform: 'WINDOWS' },
            { browserName: 'internet explorer', /*version: '11', */platform: 'WINDOWS' },
            { browserName: 'MicrosoftEdge', platform: 'WINDOWS' }
        ],

        // Maximum number of simultaneous integration tests that should be executed on the remote WebDriver service
        maxConcurrency: 1,

        // Functional test suite(s) to run in each browser once non-functional tests are completed
        functionalSuites: [
            /*'testIntern/orangeHasPlayer/functional_common/buildInfos',
            'testIntern/orangeHasPlayer/functional_common/videoBitrates',
            //'testIntern/orangeHasPlayer/functional_common/startTime',
            'testIntern/orangeHasPlayer/functional_common/liveOrVod',*/
            'testIntern/orangeHasPlayer/functional_common/playLive',
            /*'testIntern/orangeHasPlayer/functional_common/playVod',
            'testIntern/orangeHasPlayer/functional_common/zapping',
            'testIntern/orangeHasPlayer/functional_common/pause',
            'testIntern/orangeHasPlayer/functional_common/stopVod',
            'testIntern/orangeHasPlayer/functional_common/stopLive',
            'testIntern/orangeHasPlayer/functional_common/seek',
            'testIntern/orangeHasPlayer/functional_common/multiAudio',
            'testIntern/orangeHasPlayer/functional_common/audioTracks',
            'testIntern/orangeHasPlayer/functional_common/subtitles',
            'testIntern/orangeHasPlayer/functional_common/volume',
            'testIntern/orangeHasPlayer/functional_common/events',
            'testIntern/orangeHasPlayer/functional_common/errors'*/
        ],

        // A regular expression matching URLs to files that should not be included in code coverage analysis
        excludeInstrumentation : /^tests|bower_components|node_modules|testIntern/
    };

    conf = Object.assign(conf, seleniumConfig);

    return conf;
});
