define(function(require){

    var seleniumConfig = require('./config/seleniumRemote');
    var browsersConfig = require('./config/browsers');

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
            'testIntern/tests/error/downloadErrManifest',
            'testIntern/tests/play/trickMode'
        ],

        // The amount of time, in milliseconds, an asynchronous test can run before it is considered timed out. By default this value is 30 seconds.
        defaultTimeout: 60000,

        // A regular expression matching URLs to files that should not be included in code coverage analysis
        excludeInstrumentation : /^tests|bower_components|node_modules|testIntern/
    };

    // Check if some parameters are redefined in command line
    process.argv.forEach(function (val, index, array) {
        var param = val.split('='),
            name,
            value;

        if (param.length !== 2) {
            return;
        }

        name = param[0];
        value = param[1];

        switch (name) {
            case 'browsers':
                conf.environments = browsersConfig[value];
                break;
            case 'selenium':
                switch (value) {
                    case 'local':
                        seleniumConfig = require('./config/seleniumLocal');
                        break;
                    case 'remote':
                        seleniumConfig = require('./config/seleniumRemote');
                        break;
                }
        }
    });

    conf = Object.assign(conf, seleniumConfig);

    console.log(conf);

    return conf;
});
