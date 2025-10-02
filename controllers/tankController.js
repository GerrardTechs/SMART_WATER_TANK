const { getAllTanks, getTankById } = require('../models/tankModel');
const { getRelayStatus, updateRelayStatus } = require('../models/relayModel');
const { addRelayLog, getRelayLogs } = require('../models/logModel');
const bus = require('../utils/pubsub');

async function getTanks(req, res) {
  try {
    const userId = req.user?.id; // pakai ID dari JWT saja
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const tanks = await getAllTanks(userId);

    if (!Array.isArray(tanks)) {
      return res.status(500).json({ error: "Invalid data format from DB" });
    }

    res.json(tanks);
  } catch (err) {
    console.error("❌ Error in getTanks:", err);
    res.status(500).json({ error: "Server error" });
  }
}

async function getTank(req, res) {
  try {
    const tank = await getTankById(req.params.id);
    if (!tank) return res.status(404).json({ message: "Tank tidak ditemukan" });
    res.json(tank);
  } catch (err) {
    console.error("❌ Error in getTank:", err);
    res.status(500).json({ error: "Server error" });
  }
}

async function updateRelay(req, res) {
  try {
    const { status } = req.body;
    if (![0, 1].includes(status)) {
      return res.status(400).json({ message: "Status harus 0 atau 1" });
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
      req.user?.username || "system"
    );

    // broadcast
    bus.emit("relay_update", {
      water_tank_id: Number(tankId),
      old_status: oldStatus,
      new_status: status,
      by: req.user?.username || "system",
      at: Date.now(),
    });
    bus.emit("tank_update", { tank, at: Date.now() });

    res.json({ message: "Relay updated & logged", tank });
  } catch (err) {
    console.error("❌ Error in updateRelay:", err);
    res.status(500).json({ error: "Server error" });
  }
}

async function getRelayHistory(req, res) {
  try {
    const logs = await getRelayLogs(req.params.id);
    res.json({ logs }); // dibungkus biar konsisten
  } catch (err) {
    console.error("❌ Error in getRelayHistory:", err);
    res.status(500).json({ error: "Server error" });
  }
}

module.exports = { getTanks, getTank, updateRelay, getRelayHistory };
