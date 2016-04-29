'use strict';
var gulp = require('gulp'),
    // node packages
    del = require('del'),
    path = require('path'),
    // gulp packages
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    preprocess = require('gulp-preprocess'),
    rename = require('gulp-rename'),
    umd = require('gulp-umd'),
    jshint = require('gulp-jshint'),
    // custom import
    option = require('./gulp/option'),
    sources = require('./gulp/sources.json');


var config = {
    distDir:'../dist',
    libName:'hasplayer'
};

var options = {
    protection:true,
    analytics:false,
    vowv:false,
    hls:true,
    mss:true
};

//initialize option with arguments given in params and default params;
option.init(process.argv,options);

// create the final globs for sources according to options
var sourcesGlob = sources.libs.concat(sources.default);
var sourcesWithoutLib;
if(gulp.option('protection')){
    sourcesGlob = sourcesGlob.concat(sources.protection);
	sourcesWithoutLib = sources.default.concat(sources.protection);
}

if(gulp.option('hls')){
     sourcesGlob = sourcesGlob.concat(sources.hls);
	 sourcesWithoutLib = sourcesWithoutLib.concat(sources.hls);
}

if(gulp.option('mss')){
     sourcesGlob = sourcesGlob.concat(sources.mss);
	 sourcesWithoutLib = sourcesWithoutLib.concat(sources.mss);
}

if(gulp.option('vowv')){
     sourcesGlob = sourcesGlob.concat(sources.vowv);
	 sourcesWithoutLib = sourcesWithoutLib.concat(sources.vowv);
}

gulp.task('clean', function(){
    return del([config.distDir],{force:true, dot:true});
});

gulp.task('lint', function() {
  return gulp.src(sourcesWithoutLib)
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('build',['clean', 'lint'], function(){
    return gulp.src(sourcesGlob)
    .pipe(concat(config.libName+'.js'))
    .pipe(preprocess({context:gulp.option.all()}))
    .pipe(umd({
        namespace:function(){
            return 'MediaPlayer';
        },
        template:path.join(__dirname, 'gulp/umd.js')
    }))
    .pipe(gulp.dest(config.distDir))
    .pipe(uglify())
    .pipe(rename(config.libName+'.min.js'))
    .pipe(gulp.dest(config.distDir));
});



// grunt build_hasplayer -proxy=true -metricsAgent=true -analytics=false -vovw=true