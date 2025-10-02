const pool = require('../config/db');

async function getAllTanks() {
  const [rows] = await pool.query('SELECT * FROM history_view ORDER BY water_tank_id ASC');
  return rows;
}

async function getTankById(id) {
  const [rows] = await pool.query('SELECT * FROM history_view WHERE water_tank_id = ? LIMIT 1', [id]);
  return rows[0];
}

module.exports = { getAllTanks, getTankById };
