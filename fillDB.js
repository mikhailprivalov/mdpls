require('dotenv-defaults').config();

const crypto = require('crypto');
const faker = require('faker');

const db = require('./db');

(async () => {
    for (let j = 0; j < 1000; j++) {
        console.log(`PACK ${j}`);
        const data = [];
        const password = '12345678';
        const salt = crypto.randomBytes(64).toString('hex');
        const passwordHashed = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('base64');

        for (let i = 0; i < 1000; i++) {
            const email = faker.internet.email();
            const firstname = faker.name.firstName();
            const lastname = faker.name.lastName();
            const gender = faker.random.number({
                'min': 1,
                'max': 2,
            }) === 1 ? 'm' : 'f';
            const age = faker.random.number({
                'min': 18,
                'max': 55,
            });
            const city = faker.address.city();
            const interests = faker.lorem.words();

            data.push([email, firstname, lastname, gender, age, city, salt, passwordHashed, interests]);

            if (i % 100 === 0) {
                console.log(`GEN ${i + 1} ${email}`);
            }
        }

        await db.query('INSERT INTO users (email, firstname, lastname, gender, age, city, salt, password, interests) VALUES ?', [data]);

        console.log(`INSERT [OK]`);
    }
})();
