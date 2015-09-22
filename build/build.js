var execSync = require('child_process').execSync;
var args = process.argv.slice(2);

var buildHasplayer = function () {
    console.log('+-----------------------------------------+\n' +
                '|               Build HasPlayer           |\n' +
                '+-----------------------------------------+\n');
    execSync('grunt build_hasplayer ' + args.join(' '), { stdio: 'inherit'});
}

var buildOrangeHasPlayer = function() {
    console.log('+-----------------------------------------+\n' +
                '|      Build Orange HasPlayer sample      |\n' +
                '+-----------------------------------------+\n');
    execSync('grunt build_orange_sample ' + args.join(' '), { stdio: 'inherit'});
}

var buildDashIf = function() {
    console.log('+-----------------------------------------+\n' +
                '|            Build DashIF sample          |\n' +
                '+-----------------------------------------+\n');
    execSync('grunt build_dashif_sample ' + args.join(' '), { stdio: 'inherit'});
}

var buildSamples = function (_args) {
    if (process.argv.indexOf('-proxy') != -1 ||
        process.argv.indexOf('-proxy=true') != -1) {
        buildOrangeHasPlayer();
    } else {
        buildDashIf();
    }
}

buildHasplayer();
buildSamples();
