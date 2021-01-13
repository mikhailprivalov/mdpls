const mysql = require('mysql2/promise');

const pool = mysql.createPool(process.env.CLEARDB_DATABASE_URL + '?multipleStatements=true&connectionLimit=2');

module.exports = pool;
