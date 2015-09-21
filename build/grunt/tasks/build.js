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

    grunt.registerTask('build', 'Main build task', function() {
        var proxy = grunt.option('proxy');

        grunt.task.run('build_hasplayer');

        //grunt.task.run('clean:end');

        //delete grunt.config.useminPrepare.generated;
        //delete grunt.config.usemin.generated;
        //console.log('####' + JSON.stringify(grunt.config()));
        //grunt.config.data.concat.generated = null;
        //console.log('####' + JSON.stringify(grunt.config('usemin')));

        //delete grunt.config.uglify.generated;
        //delete grunt.config.data.cssmin.generated;

        //grunt.task.clearQueue();

        if (proxy) {
            grunt.task.run('build_orange_hasplayer');
        } else {
            grunt.task.run('build_dashif');
        }

        //grunt.task.run('clean:end');
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
        'replace:copyright',        // Add the copyright
        'clean:end'
    ]);

    grunt.registerTask('build_dashif', [
        'copy:dashif',               // Copy HTML files
        'replace:sourceByBuild',     // Replace source by call for hasplayer.js
        'targethtml:dashif',         // Take the list element only for the build in index.html
        'revision',                  // Get git info
        'useminPrepare:dashif',      // Get files in blocks tags
        'concat:generated',          // Merge all the files in one for each blocks
        'uglify:generated',          // Uglify the JS in blocks
        'cssmin:generated',          // Minify the CSS in blocks (none)
        'json:main',                      // Get the json files into a json.js
        'uglify:json',               // Minify the json.js file
        'concat:jsonToIndex',        // Merge the json.js file with index.js
        'usemin:playerSrc',          // Replace the tags blocks by the result
        'usemin:dashif',             // Replace the tags blocks by the result
        'htmlbuild:dist',            // Inline the CSS
        'htmlmin:main',              // Minify the HTML
        'replace:dashifInfos',       // Add the git info in files
        'replace:dashifNoCopyright', // Remove tag from files where no copyright is needed
        'replace:chromecastId',      // Change to Online APP_ID for chromecast
        'clean:end'
    ]);

    grunt.registerTask('build_orange_hasplayer', [
        'copy:orangeHasplayer',                  // Copy HTML files
        'replace:sourceByBuildOrangeHasPlayer',  // Replace source by call for hasplayer.js
        'targethtml:orangeHasplayer',            // Take the list element only for the build in index.html
        'revision',                              // Get git info
        'useminPrepare:orangeHasPlayer',         // Get files in blocks tags
        'concat:generated',                      // Merge all the files in one for each blocks
        'uglify:generated',                      // Uglify the JS in blocks
        'cssmin:generated',                      // Minify the CSS in blocks (none)
        'json:orangeHasplayer',
        'uglify:json',
        'concat:jsonToOrangeHasPlayer',
        'usemin:playerSrc',                      // Replace the tags blocks by the result
        'usemin:orangeHasplayer',                // Replace the tags blocks by the result
        'htmlbuild:orangeHasplayerDist',         // Inline the CSS
        'htmlmin:orangeHasplayer',               // Minify the HTML
        'replace:orangeHasplayerInfos',          // Add the git info in files
        'replace:orangeHasplayerNoCopyright',    // Remove tag from files where no copyright is needed
        'clean:end'
    ]);
};
