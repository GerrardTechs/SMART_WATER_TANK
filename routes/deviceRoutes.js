const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getDeviceInfo } = require('../controllers/deviceController');

// Device detail info
router.get('/device/:id', protect, getDeviceInfo);

module.exports = router;
