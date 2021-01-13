const express = require('express');
const db = require('../db');
const {ensureAuthenticated} = require("../utils");

const router = express.Router();

router.post('/interest/add', ensureAuthenticated, async(req, res) => {
    const {
        interest,
    } = req.body;
    const userId = req.user.id;

    await db.query('INSERT INTO interests SET ?', {
        user_id: userId,
        interest,
    });

    res.redirect(303, `/profile/${userId}`);
});

router.get('/interest/delete/:id', ensureAuthenticated, async(req, res) => {
    const {
        id,
    } = req.params;
    const userId = req.user.id;

    await db.query('DELETE FROM interests WHERE user_id = ? AND id = ?', [userId, id]);

    res.redirect(303, `/profile/${userId}`);
});

router.get('/search', ensureAuthenticated, async (req, res, next) => {
    const limit = 30;
    const page = Number(req.query.page) || 1;
    const offset = limit * (page - 1);

    const [users] = await db.query(
        'SELECT id, firstname, lastname, age, gender, city FROM users ORDER BY id LIMIT ? OFFSET ?',
        [limit, offset]
    );

    const [rows] = await db.query(
        'SELECT count(id) as count FROM users'
    );

    const count = rows[0].count;

    const pages = Math.ceil(count / limit);

    return res.render('search', {
        title: 'Поиск',
        users,
        page,
        pages,
        count,
    });
});

router.get('/:id', ensureAuthenticated, async (req, res, next) => {
    const id = Number(req.params.id);

    const [rows] = await db.query(
        'SELECT id, firstname, lastname, age, gender, city FROM users WHERE id = ?',
        [id]
    );

    const [user = {}] = rows || [];

    if (user) {
        const [interests] = await db.query('SELECT id, interest FROM interests WHERE user_id = ?', [id]);
        const isCurrentUser = req.user.id === id;
        let hasFriendship = false;
        if (!isCurrentUser) {
            const [rows] = await db.query('SELECT id FROM friendship WHERE (friendship.requester_user_id = ? and friendship.target_user_id = ?) OR (friendship.requester_user_id = ? and friendship.target_user_id = ?)', [req.user.id, id, id, req.user.id])
            hasFriendship = rows.length > 0;
        }
        return res.render('profile', {
            title: `${user.firstname} ${user.lastname}`,
            user,
            isCurrentUser,
            interests,
            hasFriendship,
        });
    }
    next();
});

router.get('/:id/friends', ensureAuthenticated, async (req, res, next) => {
    const id = Number(req.params.id);

    const [rows] = await db.query(
        'SELECT id, firstname, lastname, gender FROM users WHERE id = ?',
        [id]
    );

    const [user = {}] = rows || [];

    if (user) {
        const [friends] = await db.query('SELECT users.id AS id, firstname, lastname, gender FROM users, friendship WHERE (friendship.requester_user_id = ? or friendship.target_user_id = ?) AND users.id != ? AND (users.id = friendship.requester_user_id OR users.id = friendship.target_user_id) GROUP BY users.id', [id, id, id]);
        return res.render('friends', {
            title: `Друзья ${user.firstname} ${user.lastname}`,
            user,
            isCurrentUser: req.user.id === id,
            friends,
        });
    }
    next();
});

router.post('/friends/add', ensureAuthenticated, async(req, res) => {
    const {
        user_id: id,
    } = req.body;

    const isCurrentUser = req.user.id === id;

    if (!isCurrentUser) {
        const [rows] = await db.query('SELECT id FROM friendship WHERE (friendship.requester_user_id = ? and friendship.target_user_id = ?) OR (friendship.requester_user_id = ? and friendship.target_user_id = ?)', [req.user.id, id, id, req.user.id])
        const hasFriendship = rows.length > 0;
        if (!hasFriendship) {
            await db.query('INSERT INTO friendship SET ?', {
                requester_user_id: req.user.id,
                target_user_id: id,
            });
        }
    }

    res.redirect(303, `/profile/${id}`);
});

router.post('/friends/stop', ensureAuthenticated, async(req, res) => {
    const {
        user_id: id,
    } = req.body;

    await db.query('DELETE FROM friendship WHERE (friendship.requester_user_id = ? and friendship.target_user_id = ?) OR (friendship.requester_user_id = ? and friendship.target_user_id = ?)', [req.user.id, id, id, req.user.id])

    res.redirect(303, `/profile/${id}`);
});

module.exports = router;
