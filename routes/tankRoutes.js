const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { protect } = require('../middleware/authMiddleware');
const {
  getTanks,
  getTank,
  updateRelay,
  getRelayHistory,
  updateWaterLevel,   // ✅ tambahkan controller baru ini
} = require('../controllers/tankController');

// ✅ Get semua tank
router.get('/', protect, getTanks);

// ✅ Get satu tank by ID
router.get('/:id', protect, getTank);

// ✅ Update relay status (manual)
router.patch('/:id/relay', protect, updateRelay);

// ✅ Ambil log relay untuk tank tertentu
router.get('/:id/relay-logs', protect, getRelayHistory);

// ✅ Tambah tank baru
router.post('/', protect, async (req, res) => {
  const { name } = req.body;
  const userId = req.user.id;

  try {
    const [result] = await db.execute(
      'INSERT INTO water_tanks (name, user_id, relay_status) VALUES (?, ?, 0)',
      [name, userId]
    );
    res.json({ id: result.insertId, name, user_id: userId, relay_status: 0 });
  } catch (err) {
    console.error('Error adding tank:', err);
    res.status(500).json({ error: 'Failed to add tank' });
  }
});

// ✅ NEW: Update water level untuk tank tertentu + auto ON/OFF relay
router.put('/:id/level', updateWaterLevel);
// 👉 Kalau sensor butuh auth, tambahkan protect:
// router.put('/:id/level', protect, updateWaterLevel);

module.exports = router;
