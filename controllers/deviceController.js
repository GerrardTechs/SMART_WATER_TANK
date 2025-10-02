const db = require('../config/db');

const getDeviceInfo = async (req, res) => {
  try {
    const deviceId = req.params.id;
    if (!deviceId) return res.status(400).json({ message: "Device ID diperlukan" });

    const [rows] = await db.execute(
      `SELECT id, name, description, status, last_update 
       FROM devices 
       WHERE id = ?`,
      [deviceId]
    );

    if (!rows.length) return res.status(404).json({ message: "Device tidak ditemukan" });

    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Error getDeviceInfo:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getDeviceInfo };
