define(function(require) {

    var intern = require('intern');

    var seleniumConfigs = require('./config/selenium');
    var browsersConfig = require('./config/browsers');
    var applications = require('./config/applications');
    var platforms = require('./config/platforms');
    var streams = require('./config/streams');
    var testsConfig = require('./config/testsConfig');

    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Selenium configuration

    var seleniumConfig = seleniumConfigs.remote;

    var conf = {
        // Browsers to run integration testing against. Note that version numbers must be strings if used with Sauce
        // OnDemand. Options that will be permutated are browserName, version, platform, and platformVersion; any other
        // capabilities options specified for an environment will be copied as-is
        environments: browsersConfig.all,

        // Maximum number of simultaneous integration tests that should be executed on the remote WebDriver service
        maxConcurrency: 1,

        // Functional test suite(s) to run in each browser once non-functional tests are completed
        functionalSuites: [
            'testIntern/tests/authent/authent',
            'testIntern/tests/play/play',
            'testIntern/tests/play/zapping',
            'testIntern/tests/play/seek',
            'testIntern/tests/play/pause',
            'testIntern/tests/api/getVideoBitrates',
            'testIntern/tests/error/errorManifest',
            'testIntern/tests/api/getAudioLanguages',
            'testIntern/tests/api/getSubtitleLanguages',
            'testIntern/tests/play/trickMode'
        ],

        // The amount of time, in milliseconds, an asynchronous test can run before it is considered timed out. By default this value is 30 seconds.
        defaultTimeout: 60000,

        // A regular expression matching URLs to files that should not be included in code coverage analysis
        excludeInstrumentation : /^tests|bower_components|node_modules|testIntern/
    };

    // Selenium configuration from command line
    if (intern.args.selenium) {
        seleniumConfig = seleniumConfigs[intern.args.selenium];
    }

    if (intern.args.browsers) {
        conf.environments = browsersConfig[intern.args.browsers];
    }

    conf = Object.assign(conf, seleniumConfig);
    console.log("Selenium configuration:\n", conf);


    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Tests configuration parameters

    // Tests configuration from command line

    // application=<development|master>
    testsConfig.testPage = intern.args.application ? [applications.OrangeHasPlayer[intern.args.application]] : [applications.OrangeHasPlayer.development];

    // platform=<prod|qualif>
    testsConfig.platform = intern.args.platform ? platforms[intern.args.platform] : platforms.prod;

    // drm=<true|false>
    testsConfig.drm = intern.args.drm ? (intern.args.drm !== 'false') : true;

    // Modify streams tvmUrl according to selected platform
    for (var stream in streams) {
        if (streams[stream].tvmUrl && streams[stream].tvmUrl.indexOf('{platform_url}') !== -1) {
            streams[stream].tvmUrl = streams[stream].tvmUrl.replace('{platform_url}', testsConfig.platform.streams_base_url);
        }
    }
    console.log("Intern:\n", testsConfig);

    return conf;
});
