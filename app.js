var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var fs = require("fs");
var _ = require('lodash');
var EE = require('eventemitter3');
var eventEmitter = new EE();
app.ee = eventEmitter;


var routes = fs.readdirSync('./routes');
console.log('App:', 'Loading routes...');
for (var i in routes) {
    var route = routes[i];
    if (_.startsWith(route, '.')) {
        continue;
    }
    try {
        var temp = new (require('./routes/' + route))(app);
        temp.resource('/api');
        console.log('App:', 'Route setup for: ', route);
    } catch (e) {
        console.error('App:', 'Exception in Route Include:', route, e);
    }
} //routes

var controllers = fs.readdirSync('./controllers');
console.log('App:', 'Loading controllers...');
for (var j in controllers) {
    var controller = controllers[j];
    if (_.startsWith(controller, '.')) {
        continue;
    }
    try {
        app[controller] = new (require('./controllers/' + controller))(app);
        console.log('App:', 'Controller name:', controller);
    } catch (e) {
        console.error('App:', 'Exception in Controller Include:', controller, e);
    }
} //controllers


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
