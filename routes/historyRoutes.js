const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getDeviceHistory, getLoginEvents } = require('../controllers/historyController');

// Device history
router.get('/device-history', protect, getDeviceHistory);

// Login history
router.get('/login-events', protect, getLoginEvents);

module.exports = router;
