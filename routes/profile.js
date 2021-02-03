const express = require('express');
const db = require('../db');
const {ensureAuthenticated} = require("../utils");

const router = express.Router();

router.post('/interest/save', ensureAuthenticated, async(req, res) => {
    const {
        value,
    } = req.body;

    await db.query('UPDATE users SET interests = ? WHERE id = ?', [value.trim(), req.user.id]);

    res.redirect(303, `/profile/${req.user.id}`);
});

router.get('/search', async (req, res, next) => {
    const limit = 100;
    const qf = req.query.qf || '';
    const ql = req.query.ql || '';
    const page = Number(req.query.page) || 1;
    const offset = limit * (page - 1);

    const likeQF = `${qf}%`;
    const likeQL = `${ql}%`;

    const [users] = await db.query(
        'SELECT id, firstname, lastname, age, gender, city FROM users WHERE firstname LIKE ? AND lastname LIKE ? ORDER BY id LIMIT ? OFFSET ?',
        [likeQF, likeQL, limit, offset]
    );

    const [rows] = await db.query(
        'SELECT count(id) as count FROM users WHERE firstname LIKE ? AND lastname LIKE ?',
        [likeQF, likeQL]
    );

    const count = rows[0].count;

    const pages = Math.ceil(count / limit);

    return res.render('search', {
        title: 'Поиск',
        users,
        page,
        pages,
        count,
        qf: qf || '',
        ql: ql || '',
    });
});

router.get('/:id', ensureAuthenticated, async (req, res, next) => {
    const id = Number(req.params.id);

    const [rows] = await db.query(
        'SELECT id, firstname, lastname, age, gender, city, interests FROM users WHERE id = ?',
        [id]
    );

    const [user = {}] = rows || [];

    if (user) {
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
