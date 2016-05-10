var gulp = require('gulp'),
    // node packages
    del = require('del'),
    path = require('path'),
    git = require('git-rev'),
    fs = require('fs'),
    runSequence = require('run-sequence'),
    // gulp packages
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    preprocess = require('gulp-preprocess'),
    rename = require('gulp-rename'),
    umd = require('gulp-umd'),
    jshint = require('gulp-jshint'),
    banner = require('gulp-banner'),
    jsdoc = require('gulp-jsdoc'),
    replaceHtml = require('gulp-html-replace'),
    // used to intercat with .html files
    usemin = require('gulp-usemin'),
    replace = require('gulp-replace'),
    minifyCss = require('gulp-minify-css'),
    zip = require('gulp-zip'),
    // custom import
    package = require('../package.json'),
    option = require('./gulp/option'),
    sources = require('./gulp/sources.json');


var comment = '<%= package.copyright %>\n\n/* Last build : <%= package.date %>_<%= package.time %> / git revision : <%= package.revision %> */\n\n';

var config = {
    distDir: '../dist',
    doc: {
        dir: '../dist/doc/',
        template: '../node_modules/gulp-jsdoc/node_modules/ink-docstrap/template',
        readMe: '../doc/JSDoc/README.md',
        errorTable: '../doc/JSDoc/HasPlayerErrors.html',
        fileSource: '../app/js/streaming/MediaPlayer.js'
    }
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

gulp.task("default", function(cb) {
    runSequence('build', ['build-samples', 'doc'],
        'zip',
        cb);
});

gulp.task('generateDoc', function() {
    return gulp.src([config.doc.fileSource, config.doc.readMe])
        .pipe(jsdoc(config.doc.dir, {
            path: config.doc.template,
            'theme': 'united',
            'linenums': true,
            'navType': 'vertical'
        }))
        .pipe(gulp.dest(config.doc.dir));
});

gulp.task('doc', ['generateDoc'], function() {
    return gulp.src(['../dist/doc/index.html'])
        .pipe(replaceHtml({
            'ERRORS_TABLE': {
                src: fs.readFileSync(config.doc.errorTable).toString(),
                tpl: '<div src="%f".js></div>'
            }
        }))
        .pipe(gulp.dest(config.doc.dir));
});

gulp.task('clean', function() {
    return del([config.distDir], {
        force: true,
        dot: true
    });
});

gulp.task('lint', function() {
    return gulp.src(sourcesGlob)
        .pipe(jshint({latedef: false}))
        .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('package-info', function() {
    git.short(function(str) {
        package.revision = str;
    });
    fs.readFile('../LICENSE', null, function(err, _data) {
        package.copyright = _data;
    });
    package.date = (new Date().getDate()) + "." + (new Date().getMonth() + 1) + "." + (new Date().getFullYear());
    package.time = (new Date().getHours()) + ":" + (new Date().getMinutes()) + ":" + (new Date().getSeconds());
});

gulp.task('build', ['clean', 'package-info', 'lint'], function() {
    // integrate libs after doing lint
    sourcesGlob = sources.libs.concat(sourcesGlob);
    return gulp.src(sourcesGlob)
        .pipe(concat(package.name))
        .pipe(preprocess({
            context: gulp.option.all()
        }))
        .pipe(umd({
            namespace: function() {
                return 'MediaPlayer';
            },
            template: path.join(__dirname, 'gulp/umd.js')
        }))
        .pipe(replace(/VERSION[\s*]=[\s*]['\\](\d.\d.\d_dev)['\\]/g, 'VERSION = \'' + package.version + '\''))
        .pipe(replace(/@@TIMESTAMP/, package.date + '_' + package.time))
        .pipe(replace(/@@REVISION/, package.revision))
        .pipe(banner(comment, {
            package: package
        }))
        .pipe(gulp.dest(config.distDir))
        .pipe(uglify())
        .pipe(banner(comment, {
            package: package
        }))
        .pipe(rename(package.name.replace('.js', '.min.js')))
        .pipe(gulp.dest(config.distDir));
});

// sample build
gulp.task('build-samples', ['build-dashif', 'build-demoplayer', 'build-orangehasplayerdemo', 'copy-index']);


// build for dash-if app
gulp.task('build-dashif', function() {
    return gulp.src('../samples/Dash-IF/index.html')
        .pipe(replace(/<!-- sources -->([\s\S]*?)<!-- endsources -->/, '<script src="../../' + package.name + '"></script>'))
        .pipe(usemin({
            inlinecss: [minifyCss, 'concat'],
        }))
        .pipe(gulp.dest(config.distDir + '/samples/Dash-IF/'));

});

gulp.task('build-demoplayer', function() {
    return gulp.src('../samples/DemoPlayer/index.html')
        .pipe(replace(/<!-- sources -->([\s\S]*?)<!-- endsources -->/, '<script src="../../' + package.name + '"></script>'))
        .pipe(usemin())
        .pipe(gulp.dest(config.distDir + '/samples/DemoPlayer/'));
});

gulp.task('build-orangehasplayerdemo', function() {
    return gulp.src('../samples/OrangeHasPlayerDemo/index.html')
        .pipe(replace(/<!-- sources -->([\s\S]*?)<!-- endsources -->/, '<script src="../../' + package.name + '"></script>'))
        .pipe(usemin({
            inlinecss: [minifyCss, 'concat'],
        }))
        .pipe(gulp.dest(config.distDir + '/samples/OrangeHasPlayerDemo/'));
});

gulp.task('copy-index', function() {
    return gulp.src('gulp/index.html')
        .pipe(gulp.dest(config.distDir));
});

gulp.task('zip', function() {
    return gulp.src(config.distDir + '/**/*')
        .pipe(zip(package.name + '.zip'))
        .pipe(gulp.dest(config.distDir));
});

gulp.task('watch', function() {});

gulp.task('serve', function() {});



// grunt build_hasplayer -proxy=true -metricsAgent=true -analytics=false -vovw=true
