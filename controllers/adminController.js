const { getLoginEvents } = require("../models/logModel");

/**
 * Ambil daftar login events dari database.
 * Bisa difilter dengan username, ada pagination (page, size).
 */
async function listLoginEvents(req, res) {
  try {
    const { page = 1, size = 20, username } = req.query;

    const limit = Math.min(Number(size) || 20, 100);
    const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;

    const data = await getLoginEvents(username, limit, offset);

    res.json({
      page: Number(page),
      size: limit,
      data,
    });
  } catch (err) {
    console.error("❌ Error listLoginEvents:", err);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = { listLoginEvents };
