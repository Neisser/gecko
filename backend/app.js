var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var activitiesRouter = require('./routes/activities');
var contractsRouter = require('./routes/contracts');
var clientsRouter = require('./routes/clients');
var workersRouter = require('./routes/workers');
var invoicesRouter = require('./routes/invoices');
var dashboardRouter = require('./routes/dashboard');
var errorHandler = require('./middleware/errorHandler');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/contracts', contractsRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/workers', workersRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/dashboard', dashboardRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// Error handler must be last
app.use(errorHandler);

module.exports = app;
