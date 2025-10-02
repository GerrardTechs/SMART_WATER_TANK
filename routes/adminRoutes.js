const express = require('express');
const { listLoginEvents } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware'); // ✅ pakai protect

const router = express.Router();

router.get('/login-events', protect, listLoginEvents);

module.exports = router;
