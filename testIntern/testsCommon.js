define(function(require){

    var seleniumConfig = require('./config/seleniumLocal');
    var browsersConfig = require('./config/browsers');

    var conf = {
        // Browsers to run integration testing against. Note that version numbers must be strings if used with Sauce
        // OnDemand. Options that will be permutated are browserName, version, platform, and platformVersion; any other
        // capabilities options specified for an environment will be copied as-is
        environments: browsersConfig.chrome,

        // Maximum number of simultaneous integration tests that should be executed on the remote WebDriver service
        maxConcurrency: 1,

        // Functional test suite(s) to run in each browser once non-functional tests are completed
        functionalSuites: [
            // 'testIntern/tests/play/play',
            // 'testIntern/tests/play/zapping',
            // 'testIntern/tests/play/seek',
            'testIntern/tests/play/pause',
            // 'testIntern/tests/api/getVideoBitrates',
            // 'testIntern/tests/error/downloadErrManifest',
        ],

        // The amount of time, in milliseconds, an asynchronous test can run before it is considered timed out. By default this value is 30 seconds.
        defaultTimeout: 60000,

        // A regular expression matching URLs to files that should not be included in code coverage analysis
        excludeInstrumentation : /^tests|bower_components|node_modules|testIntern/
    };

    conf = Object.assign(conf, seleniumConfig);

    return conf;
});
