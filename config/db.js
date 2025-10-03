// config/db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "aqua_secure",
  password: process.env.DB_PASS || "passwordku123",
  database: process.env.DB_NAME || "aqua_secure",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
