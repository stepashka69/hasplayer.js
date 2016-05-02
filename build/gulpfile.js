var gulp = require('gulp'),
    // node packages
    del = require('del'),
    path = require('path'),
    git = require('git-rev'),
    fs = require('fs'),
    // gulp packages
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    preprocess = require('gulp-preprocess'),
    rename = require('gulp-rename'),
    umd = require('gulp-umd'),
    jshint = require('gulp-jshint'),
    banner = require('gulp-banner'),
    // custom import
    option = require('./gulp/option'),
    sources = require('./gulp/sources.json');

var pkg = {
        revision: '',
        timeStamp: '',
        licence: ''
    },
    LICENSE = '../LICENSE';

var comment = '<%= pkg.licence %>\n\n/* Last build : <%= pkg.timeStamp %> / git revision : <%= pkg.revision %> */\n\n';

var config = {
    distDir: '../dist',
    libName: 'hasplayer'
};

var options = {
    protection: true,
    analytics: false,
    vowv: false,
    hls: true,
    mss: true
};

//initialize option with arguments given in params and default params;
option.init(process.argv, options);

// create the final globs for sources according to options
var sourcesGlob = sources.default;
if (gulp.option('protection')) {
    sourcesGlob = sourcesGlob.concat(sources.protection);
}

if (gulp.option('hls')) {
    sourcesGlob = sourcesGlob.concat(sources.hls);
}

if (gulp.option('mss')) {
    sourcesGlob = sourcesGlob.concat(sources.mss);
}

if (gulp.option('vowv')) {
    sourcesGlob = sourcesGlob.concat(sources.vowv);
}

gulp.task('clean', function() {
    return del([config.distDir], {
        force: true,
        dot: true
    });
});

gulp.task('lint', function() {
    return gulp.src(sourcesGlob)
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('gitRev', function() {
    git.short(function(str) {
        pkg.revision = str;
    });
    fs.readFile(LICENSE, null, function(err, _data) {
        pkg.licence = _data;
    });
    pkg.timeStamp = new Date().getDate() + "." + (new Date().getMonth() + 1) +
    "." + (new Date().getFullYear()) + "_" + (new Date().getHours()) + ":" +
    (new Date().getMinutes()) + ":" + (new Date().getSeconds());
});

gulp.task('build', ['clean', 'lint', 'gitRev'], function() {
    // integrate libs after doing lint
    sourcesGlob = sources.libs.concat(sourcesGlob);
    return gulp.src(sourcesGlob)
        .pipe(concat(config.libName + '.js'))
        .pipe(preprocess({
            context: gulp.option.all()
        }))
        .pipe(umd({
            namespace: function() {
                return 'MediaPlayer';
            },
            template: path.join(__dirname, 'gulp/umd.js')
        }))
        .pipe(gulp.dest(config.distDir))
        .pipe(uglify())
        .pipe(banner(comment, {
            pkg: pkg
        }))
        .pipe(rename(config.libName + '.min.js'))
        .pipe(gulp.dest(config.distDir));
});

// gulp.task("copy", function(){
//
// });
//
// // build for dash-if app
// gulp.task('build-dashif', function() {
//
// });


// grunt build_hasplayer -proxy=true -metricsAgent=true -analytics=false -vovw=true
