require('dotenv-defaults').config();

const posix = require('posix');
posix.setrlimit('nofile', { soft: 100000, hard: 100000 });

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const connection = require('./db');
const session = require("express-session");
const promiseAdapter = require('express-mysql2-session-promise-adapter');
const MySQLStore = require('express-mysql-session')(session);
const passport = require('passport');

const app = express();

const sessionStore = new MySQLStore({
    expiration: Number(process.env.SESSIONSDB_EXPIRATION)
}, promiseAdapter.adapter(connection));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: process.env.SESSIONSDB_SECRET,
    store: sessionStore,
    cookie: {maxAge: 3600000},
}));

app.use(passport.initialize());
app.use(passport.session());

const passportUserPerformer = (user, done) => {
    done(null, {id: user.id, email: user.email});
};

passport.serializeUser(passportUserPerformer);

passport.deserializeUser(passportUserPerformer);

app.use(function (req, res, next) {
    if (!res.locals) {
        res.locals = {}
    }

    res.locals.authorised = req.isAuthenticated();

    if (res.locals.authorised) {
        res.locals.user_id = req.user.id;
        res.locals.email = req.user.email;
    }
    next();
});

app.use('/', require('./routes/index'));
app.use('/user', require('./routes/user'));
app.use('/profile', require('./routes/profile'));


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
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
