const pool = require('../config/db');

async function createUser(username, hash) {
  return pool.execute('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, hash]);
}

async function findByUsername(username) {
  const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
  return rows[0];
}

async function findById(id) {
  const [rows] = await pool.execute('SELECT id, username, created_at, last_login_ip FROM users WHERE id = ?', [id]);
  return rows[0];
}

async function updateLastLoginIp(id, ip) {
  return pool.execute('UPDATE users SET last_login_ip = ? WHERE id = ?', [ip, id]);
}

module.exports = { createUser, findByUsername, findById, updateLastLoginIp };
