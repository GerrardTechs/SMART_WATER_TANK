const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { tanksStream } = require('../controllers/streamController');

const router = express.Router();

router.get('/tanks', protect, tanksStream);

module.exports = router;
