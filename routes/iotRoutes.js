const express = require('express');
const { ingestReading } = require('../controllers/iotController');

const router = express.Router();

router.post('/ingest', ingestReading);

module.exports = router;
