module.exports = function(grunt) {

    grunt.config.set('rootpath',        '../');
    grunt.config.set('preprocesspath',  '../build/.tmp/preprocess');
    grunt.config.set('path',            '../dist');
    grunt.config.set('samples',         '../samples');
    grunt.config.set('appDemoPlayer',   '../samples/DemoPlayer');
    grunt.config.set('app4Ever',        '../samples/4Ever');
    grunt.config.set('appDashif',       '../samples/Dash-IF');
    grunt.config.set('appABRTest',      '../samples/ABRTest/');
    grunt.config.set('orangeHasPlayer', '../samples/OrangeHasplayerDemo/');

    var proxy = grunt.option('proxy');


    grunt.registerTask('build', 'build', function() {

        if (proxy) {
            console.log('Build HasPlayer with proxy');
        } else {
            console.log('Build HasPlayer without proxy');
        }

        grunt.task.run('build_hasplayer');

        if (proxy) {
            console.log('Build Orange Has Player samples');
            grunt.task.run('build_orange_hasplayer');
        } else {
            console.log('Build dashif samples');
            grunt.task.run('build_dashif');
        }

        grunt.task.run('clean:end');
    });

    grunt.registerTask('build_hasplayer', [
        'clean:start',              // Empty folder
        'preprocess:multifile',     // Preprocess files
        'replace:sourceForBuild',   // Prepare source file for hasplayer.js
        'targethtml:hasplayer',     // Take the list element only for the build in index.html
        'revision',                 // Get git info
        'useminPrepare:hasplayer',  // Get files in blocks tags
        'concat:generated',         // Merge all the files in one for each blocks
        'cssmin:generated',         // Minify the CSS in blocks (none)
        'umd:all',                  // package in universal module definition
        'uglify:generated',         // Uglify the JS in blocks
        'uglify:min',               // Minify the hasplayer.js into hasplayer.min.js
        'replace:infos',            // Add the git info in files
        'replace:copyright'         // Add the copyright
    ]);

    grunt.registerTask('build_dashif', [
        'copy',                   // Copy HTML files
        'replace:sourceByBuild',    // Replace source by call for hasplayer.js
        'targethtml:dashif',        // Take the list element only for the build in index.html
        'revision',                 // Get git info
        'useminPrepare:dashif',     // Get files in blocks tags
        'concat:generated',       // Merge all the files in one for each blocks
        'uglify:generated',         // Uglify the JS in blocks
        'cssmin:generated',       // Minify the CSS in blocks (none)
        'json',                     // Get the json files into a json.js
        'uglify:json',              // Minify the json.js file
        'concat:jsonToIndex',       // Merge the json.js file with index.js
        'usemin:playerSrc',         // Replace the tags blocks by the result
        'usemin:dashif',            // Replace the tags blocks by the result
        'htmlbuild:dist',           // Inline the CSS
        'htmlmin:main',             // Minify the HTML
        'replace:dashifInfos',      // Add the git info in files
        'replace:dashifNoCopyright',// Remove tag from files where no copyright is needed
        'replace:chromecastId'     // Change to Online APP_ID for chromecast
    ]);

    grunt.registerTask('build_orange_hasplayer', [
        'concat:generated'
    ]);
};
