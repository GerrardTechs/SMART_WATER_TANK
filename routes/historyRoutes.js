const express = require('express')
const { corsMiddleware, getDeviceHistory, getLoginEvents } = require('../controllers/historyController')
const router = express.Router()

// Terapkan CORS di semua route history
router.use(corsMiddleware)

router.get('/device-history', getDeviceHistory)
router.get('/login-events', getLoginEvents)

module.exports = router
