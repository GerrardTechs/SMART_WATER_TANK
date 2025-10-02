const pool = require('../config/db');
const bus = require('../utils/pubsub');
const { addRelayLog } = require('../models/logModel');
const { getRelayStatus } = require('../models/relayModel');
const { getTankById } = require('../models/tankModel');

// Saran keamanan sederhana: token device di .env (IOT_TOKEN), device kirim via header: x-iot-token
async function ingestReading(req, res) {
  try {
    const token = req.headers['x-iot-token'];
    if (!process.env.IOT_TOKEN || token !== process.env.IOT_TOKEN) {
      return res.status(401).json({ message: 'Unauthorized device' });
    }

    const { water_tank_id, water_level, relay_status } = req.body;
    if (!water_tank_id || typeof water_level !== 'number') {
      return res.status(400).json({ message: 'water_tank_id & water_level wajib' });
    }

    // update water_tanks
    await pool.execute(
      `UPDATE water_tanks SET water_level = ?, last_update = NOW() WHERE id = ?`,
      [water_level, water_tank_id]
    );

    // kalau relay_status ikut dikirim → cek perubahan & log
    if (relay_status === 0 || relay_status === 1) {
      const oldStatus = await getRelayStatus(water_tank_id);
      if (oldStatus !== relay_status) {
        // update status
        await pool.execute(`UPDATE relay_status SET status = ? WHERE water_tank_id = ?`, [relay_status, water_tank_id]);
        // ambil data terbaru untuk broadcast lengkap
        const tank = await getTankById(water_tank_id);
        // log
        await addRelayLog(water_tank_id, oldStatus, relay_status, tank?.water_level || water_level, 'device');
        // broadcast relay change
        bus.emit('relay_update', { water_tank_id, old_status: oldStatus, new_status: relay_status, at: Date.now() });
      }
    }

    // broadcast tank update (level berubah)
    const tank = await getTankById(water_tank_id);
    bus.emit('tank_update', { tank, at: Date.now() });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { ingestReading };
