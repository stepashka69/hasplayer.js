// Learn more about configuring this file at <https://github.com/theintern/intern/wiki/Configuring-Intern>.
// These default settings work OK for most people. The options that *must* be changed below are the
// packages, suites, excludeInstrumentation, and (if you want functional tests) functionalSuites.
define({
    // The port on which the instrumenting proxy will listen
    proxyPort: 3555,

    // A fully qualified URL to the Intern proxy
    proxyUrl: 'http://PC-selenium.rd.francetelecom.fr:3555',
    tunnel: 'NullTunnel',
    tunnelOptions: {
        hostname: 'PC-selenium.rd.francetelecom.fr',
        port: '4444',
        verbose: true
    },

    // Default desired capabilities for all environments. Individual capabilities can be overridden by any of the
    // specified browser environments in the `environments` array below as well. See
    // https://code.google.com/p/selenium/wiki/DesiredCapabilities for standard Selenium capabilities and
    // https://saucelabs.com/docs/additional-config#desired-capabilities for Sauce Labs capabilities.
    // Note that the `build` capability will be filled in with the current commit ID from the Travis CI environment
    // automatically
    capabilities: {
        'selenium-version': '2.44.0'
    },

    // Browsers to run integration testing against. Note that version numbers must be strings if used with Sauce
    // OnDemand. Options that will be permutated are browserName, version, platform, and platformVersion; any other
    // capabilities options specified for an environment will be copied as-is
    environments: [
        { browserName: 'chrome', /*version: '2.11', */platform: 'WIN8_1' },
        { browserName: 'internet explorer', /*version: '11', */platform: 'WIN8_1' }
    ],

    // Maximum number of simultaneous integration tests that should be executed on the remote WebDriver service
    maxConcurrency: 1,

    reporters: ['runner'],

    // Functional test suite(s) to run in each browser once non-functional tests are completed
    functionalSuites: [
        'testIntern/orangeHasPlayer/functional_common/buildInfos',
        'testIntern/orangeHasPlayer/functional_common/videoBitrates',
        //'testIntern/orangeHasPlayer/functional_common/startTime',
        'testIntern/orangeHasPlayer/functional_common/liveOrVod',
        'testIntern/orangeHasPlayer/functional_common/playLive',
        'testIntern/orangeHasPlayer/functional_common/playVod',
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
        'testIntern/orangeHasPlayer/functional_common/errors'
    ],

    // A regular expression matching URLs to files that should not be included in code coverage analysis
    excludeInstrumentation : /^tests|bower_components|node_modules|testIntern/
});
