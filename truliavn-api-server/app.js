var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var session = require('express-session');
var passport = require('passport');
var flash = require('connect-flash');
var MongoStore = require('connect-mongo')(session);

mongoose.connect(require('./config/database').MONGO.url);

var routes = require('./routes/index');
var users = require('./routes/users');
var api = require('./routes/api');

var app = express();

var connection = require('./config/database.js').MYSQL();

require('./config/passport')(passport, connection);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
	secret: 'MySecretKey',
	resave: true,
	saveUninitialized: true,
	store: new MongoStore({mongooseConnection: mongoose.connection})
}))
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.disable('etag');

// cross origin
app.use(function (req, res, next) {
	res.header('Access-Control-Allow-Origin', "*");
	res.header('Access-Control-Allow-Headers', "Origin, X-Requested-With, Content-Type, Accept, Cookie");
	res.header('Access-Control-Allow-Credentials', true);
	next();
});

app.use('/', routes);
app.use('/api', api);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: err
		});
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	});
});


module.exports = app;
