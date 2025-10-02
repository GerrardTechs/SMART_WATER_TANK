const db = require("../config/db");

// Get device history
const getDeviceHistory = async (req, res) => {
  try {
    const userId = req.query.user_id || req.user?.id;
    if (!userId) return res.status(400).json({ message: "User ID diperlukan" });

    let query = `SELECT tank_name AS name,
    water_level,
    created_at AS last_update,
    relay_status AS status,
    water_tank_id AS device_id
FROM history_view
WHERE user_id = ?`;

    const params = [userId];

    // Optional filter device_id
    if (req.query.device_id) {
      query += ` AND water_tank_id = ?`;
      params.push(req.query.device_id);
    }

    // Optional date range filter
    if (req.query.from) {
      query += ` AND last_update >= ?`;
      params.push(req.query.from);
    }
    if (req.query.to) {
      query += ` AND last_update <= ?`;
      params.push(req.query.to);
    }

    query += ` ORDER BY last_update DESC LIMIT 50`;

    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error getDeviceHistory:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get login events
const getLoginEvents = async (req, res) => {
  try {
    const userId = req.query.user_id || req.user?.id;
    if (!userId) return res.status(400).json({ message: "User ID diperlukan" });

    const [rows] = await db.execute(
      `SELECT * FROM login_events WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Error getLoginEvents:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getDeviceHistory, getLoginEvents };
