const pool = require('../config/db');

async function getRelayStatus(tankId) {
  const [rows] = await pool.query('SELECT status FROM relay_status WHERE water_tank_id = ? LIMIT 1', [tankId]);
  return rows[0] ? rows[0].status : null;
}

async function updateRelayStatus(tankId, status) {
  return pool.execute('UPDATE relay_status SET status = ? WHERE water_tank_id = ?', [status, tankId]);
}

module.exports = { getRelayStatus, updateRelayStatus };
