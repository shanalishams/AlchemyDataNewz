'use strict';
var gulp = require('gulp');
var mainBowerFiles = require('main-bower-files');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var filter = require('gulp-filter');

var src = 'app_client/';
var dest = './public/';

// gulp.task('javascript', function () {
//
//     var jsFiles = ['app_client/public/javascript/*'];
//     gulp.src(mainBowerFiles(),{ base: './app_client/bower_components' })
//         .pipe(concat('./app_client/app.js'))
//         .pipe(filter('*.js'))
//         .pipe(concat('main.js'))
//         .pipe(uglify())
//         .pipe(gulp.dest('./public/javascript'));
//
// });
//
// gulp.task('default', function () {
//     return gulp.src(['./app_client/app.js', './app_client/bower_components/**/*.js'])
//         .pipe(concat('main.js'))
//         .pipe(gulp.dest('./public/javascript/'));
// });



gulp.task('default', function () {
    var df =mainBowerFiles();
    return gulp.src(mainBowerFiles(),{base:'./app_client/bower_components/'})
        .pipe(concat('main.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./public/javascript/'));
});