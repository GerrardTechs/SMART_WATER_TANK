const pool = require('../config/db');

function getClientIp(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0] || req.socket.remoteAddress;
}

async function recordLoginEvent({ userId = null, usernameAttempt, success, ip, userAgent, reason = null }) {
  await pool.execute(
    `INSERT INTO login_events (user_id, username_attempt, success, ip, user_agent, reason)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, usernameAttempt, success ? 1 : 0, ip, userAgent, reason]
  );
}

module.exports = { getClientIp, recordLoginEvent };
