const { getAllTanks, getTankById } = require('../models/tankModel');
const { getRelayStatus, updateRelayStatus } = require('../models/relayModel');
const { addRelayLog, getRelayLogs } = require('../models/logModel');
const bus = require('../utils/pubsub');
const db = require('../config/db');

/**
 * 🔸 AUTO RELAY CONTROL
 * Aturan:
 * - Jika level > 75% → relay OFF
 * - Jika level < 25% → relay ON
 */
async function autoControlRelay(tankId, waterLevel, triggeredBy = 'auto') {
  try {
    let newStatus = null;

    if (waterLevel > 75) {
      newStatus = 0; // OFF
    } else if (waterLevel < 25) {
      newStatus = 1; // ON
    }

    if (newStatus !== null) {
      const currentStatus = await getRelayStatus(tankId);
      if (currentStatus !== newStatus) {
        // Update relay status
        await updateRelayStatus(tankId, newStatus);

        // Ambil info tank untuk log
        const tank = await getTankById(tankId);

        // Catat log
        await addRelayLog(
          tankId,
          currentStatus,
          newStatus,
          tank?.water_level || null,
          triggeredBy
        );

        // Broadcast ke frontend
        bus.emit('relay_update', {
          water_tank_id: Number(tankId),
          old_status: currentStatus,
          new_status: newStatus,
          by: triggeredBy,
          at: Date.now(),
        });

        bus.emit('tank_update', { tank, at: Date.now() });

        console.log(`✅ Auto relay ${newStatus ? 'ON' : 'OFF'} untuk tank ${tankId}`);
      }
    }
  } catch (err) {
    console.error('❌ Error in autoControlRelay:', err);
  }
}

/**
 * 🔸 GET Semua Tank untuk User
 */
async function getTanks(req, res) {
  try {
    const userId = req.user?.id; // pakai ID dari JWT saja
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const tanks = await getAllTanks(userId);
    if (!Array.isArray(tanks)) {
      return res.status(500).json({ error: 'Invalid data format from DB' });
    }

    res.json(tanks);
  } catch (err) {
    console.error('❌ Error in getTanks:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

/**
 * 🔸 GET Satu Tank by ID
 */
async function getTank(req, res) {
  try {
    const tank = await getTankById(req.params.id);
    if (!tank) return res.status(404).json({ message: 'Tank tidak ditemukan' });
    res.json(tank);
  } catch (err) {
    console.error('❌ Error in getTank:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

/**
 * 🔸 UPDATE Relay (Manual)
 */
async function updateRelay(req, res) {
  try {
    const { status } = req.body;
    if (![0, 1].includes(status)) {
      return res.status(400).json({ message: 'Status harus 0 atau 1' });
    }

    const tankId = req.params.id;
    const oldStatus = await getRelayStatus(tankId);

    await updateRelayStatus(tankId, status);
    const tank = await getTankById(tankId);

    await addRelayLog(
      tankId,
      oldStatus,
      status,
      tank?.water_level || null,
      req.user?.username || 'system'
    );

    bus.emit('relay_update', {
      water_tank_id: Number(tankId),
      old_status: oldStatus,
      new_status: status,
      by: req.user?.username || 'system',
      at: Date.now(),
    });
    bus.emit('tank_update', { tank, at: Date.now() });

    res.json({ message: 'Relay updated & logged', tank });
  } catch (err) {
    console.error('❌ Error in updateRelay:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

/**
 * 🔸 GET Relay Log
 */
async function getRelayHistory(req, res) {
  try {
    const logs = await getRelayLogs(req.params.id);
    res.json({ logs }); // dibungkus biar konsisten
  } catch (err) {
    console.error('❌ Error in getRelayHistory:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

/**
 * 🔸 (Baru) UPDATE Level Air
 * Bisa dipanggil dari sensor / MQTT / manual API
 * Contoh: POST /api/tanks/:id/level { water_level: 60 }
 */
async function updateWaterLevel(req, res) {
  try {
    const { water_level } = req.body;
    const tankId = req.params.id;

    if (typeof water_level !== 'number') {
      return res.status(400).json({ message: 'water_level harus number' });
    }

    // Update ke DB
    await db.execute(
      'UPDATE water_tanks SET water_level = ?, updated_at = NOW() WHERE id = ?',
      [water_level, tankId]
    );

    // Panggil auto control relay
    await autoControlRelay(tankId, water_level, 'sensor');

    // Broadcast ke frontend
    const updatedTank = await getTankById(tankId);
    bus.emit('tank_update', { tank: updatedTank, at: Date.now() });

    res.json({ message: 'Water level updated', tank: updatedTank });
  } catch (err) {
    console.error('❌ Error in updateWaterLevel:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = {
  getTanks,
  getTank,
  updateRelay,
  getRelayHistory,
  updateWaterLevel, // ✅ baru
};
