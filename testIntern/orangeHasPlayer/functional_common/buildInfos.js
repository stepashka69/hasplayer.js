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
        var tests = function() {
            var url = config.testPage;

            registerSuite({
                name: 'Build infos',

                setup: function() {
                    command = this.remote.get(require.toUrl(url));
                },

                'Check version': function() {
                    return command
                    .execute(function() {
                        return orangeHasPlayer.getVersion();
                    })
                    .then(function (version) {
                        console.log('[TEST_BUILD_INFOS] version: ' + version);
                        var regex = /\d\.\d\.\d/;
                        var matches = version.match(regex);
                        assert.ok(matches, 'Build version must match the pattern X.X.X');
                        assert.equal(matches.length, 1, 'Build version pattern must match only once.');
                        assert.equal(matches[0], version, 'Build version pattern match must be equal to the original string.');
                    });
                },

                'Check full version': function() {
                    return command
                    .execute(function() {
                        return orangeHasPlayer.getVersionFull();
                    })
                    .then(function (fullVersion) {
                        console.log('[TEST_BUILD_INFOS] version: ' + fullVersion);
                        var regex = /\d\.\d\.\d_dev_[a-f0-9]{7}/;
                        var matches = fullVersion.match(regex);
                        assert.ok(matches, 'Build version must match the pattern X.X.X_dev_abcdef0');
                        assert.equal(matches.length, 1, 'Build version pattern must match only once.');
                        assert.equal(matches[0], fullVersion, 'Build version pattern match must be equal to the original string.');
                    });
                },

                'Check build date': function() {
                    return command
                    .execute(function() {
                        return orangeHasPlayer.getBuildDate();
                    })
                    .then(function (buildDate) {
                        console.log('[TEST_BUILD_INFOS] build date: ' + buildDate);
                        var regex = /\d{1,2}\.\d{1,2}\.\d{4}_\d{1,2}:\d{1,2}:\d{1,2}/;
                        var matches = buildDate.match(regex);
                        assert.ok(matches, 'Build version must match the pattern jj.mm.aaaa_hh:mm:ss');
                        assert.equal(matches.length, 1, 'Build version pattern must match only once.');
                        assert.equal(matches[0], buildDate, 'Build version pattern match must be equal to the original string.');
                    });
                }
            });
        };

        tests();
});
