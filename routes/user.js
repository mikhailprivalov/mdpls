const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const db = require('../db');

const {isValidPassword, isValidEmail} = require('../utils');


passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    },
    async function (email, password, done) {
        const [rows] = await db.query('SELECT password, salt, email, id FROM users WHERE email = ?', [email]);

        const [user = {}] = rows || [];

        if (!user.id) {
            return done(null, false, {message: 'Неверный email или пароль'});
        }

        const {salt, password: validPassword} = user;

        const checkPassword = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('base64');

        if (checkPassword !== validPassword) {
            return done(null, false, {message: 'Неверный email или пароль'});
        }
        return done(null, user);
    }
));

router.get('/register', function (req, res, next) {
    res.render('register', {title: 'Регистрация'});
});

router.post('/register', async function (req, res, next) {
    const {
        email,
        firstname,
        lastname,
        gender,
        age,
        city,
        password,
    } = req.body;

    let message = null;

    if (!isValidEmail(email)) {
        message = 'Email некорректный';
    } else if (!isValidPassword(password)) {
        message = 'Пароль должен быть длиной 8 или больше';
    } else {
        const [rows] = await db.query('SELECT id FROM users WHERE email = ?', [email]);

        const isExisting = rows.length > 0;

        if (isExisting) {
            message = 'Email уже зарегистрирован';
        }
    }

    if (!message) {
        const salt = crypto.randomBytes(64).toString('hex');
        const passwordHashed = crypto.pbkdf2Sync(req.body.password, salt, 10000, 64, 'sha512').toString('base64');

        const tableData = {email, firstname, lastname, gender, age, city, salt, password: passwordHashed};

        await db.query('INSERT INTO users SET ?', tableData);

        const result = await new Promise(r => {
            passport.authenticate('local', function (err, user) {
                if (err || !user) {
                    return r(false);
                }

                req.logIn(user, function (err) {
                    if (err) {
                        return r(false);
                    }
                    return r(user.id);

                });
            })(req, res, next);
        });

        if (result) {
            return res.redirect(303, `/profile/${result}`);
        }
        message = 'Неизвестная ошибка';
    }

    res.render('register', {title: 'Регистрация', message, email, firstname, lastname, gender, age, city});
});

router.get('/login', function (req, res, next) {
    res.render('login', {title: 'Вход'});
});

router.post('/login', function (req, res, next) {
    passport.authenticate('local', function (err, user) {
        if (err) {
            return res.render('login', {title: 'Вход', message: 'Неизвестная ошибка'});
        }
        if (!user) {
            return res.render('login', {title: 'Вход', message: 'Неверный логин или пароль'});
        }
        req.logIn(user, function (err) {
            if (err) {
                return res.render('login', {title: 'Вход', message: 'Неизвестная ошибка'});
            }
            res.redirect(303, `/profile/${user.id}`);
        });
    })(req, res, next);
});

router.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

module.exports = router;
