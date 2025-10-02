const express = require('express');
const { getTanks, getTank, updateRelay, getRelayHistory } = require('../controllers/tankController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getTanks);
router.get('/:id', protect, getTank);
router.patch('/:id/relay', protect, updateRelay);
router.get('/:id/relay-logs', protect, getRelayHistory);

// routes/tankRoutes.js
router.post('/', protect, async (req, res) => {
    const { name } = req.body;
    const userId = req.user.id;
    try {
      const [result] = await db.execute(
        "INSERT INTO water_tanks (name, user_id, relay_status) VALUES (?, ?, 0)",
        [name, userId]
      );
      res.json({ id: result.insertId, name, user_id: userId, relay_status: 0 });
    } catch (err) {
      console.error("Error adding tank:", err);
      res.status(500).json({ error: "Failed to add tank" });
    }
  });
  

module.exports = router;
