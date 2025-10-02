const pool = require('../config/db');

async function addRelayLog(tankId, oldStatus, newStatus, waterLevel, changedBy) {
  return pool.execute(
    `INSERT INTO relay_logs (water_tank_id, old_status, new_status, water_level, changed_by)
     VALUES (?, ?, ?, ?, ?)`,
    [tankId, oldStatus, newStatus, waterLevel, changedBy]
  );
}

async function getRelayLogs(tankId) {
  const [rows] = await pool.query(
    'SELECT * FROM relay_logs WHERE water_tank_id = ? ORDER BY created_at DESC LIMIT 50',
    [tankId]
  );
  return rows;
}

async function getLoginEvents(username, limit = 20, offset = 0) {
  let sql = `
    SELECT le.*, u.username AS user_real 
    FROM login_events le 
    LEFT JOIN users u ON u.id = le.user_id
  `;
  const params = [];
  if (username) {
    sql += ' WHERE le.username_attempt = ?';
    params.push(username);
  }
  sql += ' ORDER BY le.id DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  const [rows] = await pool.query(sql, params);
  return rows;
}

module.exports = { addRelayLog, getRelayLogs, getLoginEvents };
