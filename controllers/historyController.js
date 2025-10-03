// controllers/historyController.js
const db = require('../config/db')

// ✅ CORS middleware khusus untuk development (bisa di-extend)
const corsMiddleware = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:8080') // frontend Quasar dev
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
}

// ✅ Ambil data history device dengan pagination dan filter
const getDeviceHistory = async (req, res) => {
  try {
    let { user_id, device_id, limit, offset, from, to } = req.query

    // Sanitasi
    user_id = Number(user_id)
    device_id = device_id ? Number(device_id) : null
    limit = Number(limit) || 10
    offset = Number(offset) || 0

    // Query dasar
    let query = `
      SELECT 
        dh.device_id, 
        dh.water_level, 
        wt.relay_status, 
        dh.created_at AS timestamp, 
        wt.name
      FROM device_history dh
      JOIN water_tanks wt ON wt.id = dh.device_id
      WHERE wt.user_id = ?
    `
    const params = [user_id]

    if (device_id) {
      query += ` AND dh.device_id = ?`
      params.push(device_id)
    }

    if (from) {
      query += ` AND dh.created_at >= ?`
      params.push(from)
    }
    if (to) {
      query += ` AND dh.created_at <= ?`
      params.push(to)
    }

    query += ` ORDER BY dh.created_at DESC LIMIT ? OFFSET ?`
    params.push(limit, offset)

    const [rows] = await db.query(query, params)

    // Filter perubahan relay (ON↔OFF)
    const filteredRows = []
    let prevStatus = null
    for (const row of rows.reverse()) {
      const currentStatus = row.relay_status
      if (prevStatus === null || currentStatus !== prevStatus) {
        filteredRows.push(row)
      }
      prevStatus = currentStatus
    }
    filteredRows.reverse()

    // Map relay_status ke status agar frontend konsisten
    const dataToSend = filteredRows.map(r => ({
      device_id: r.device_id,
      name: r.name,
      water_level: r.water_level,
      status: r.relay_status, // <-- ini penting
      timestamp: r.timestamp,
    }))

    res.json({
      total: dataToSend.length,
      limit,
      offset,
      data: dataToSend,
    })
  } catch (err) {
    console.error('❌ Error getDeviceHistory:', err)
    res.status(500).json({ message: 'Failed to fetch history' })
  }
}

// Event login
const getLoginEvents = async (req, res) => {
  try {
    const userId = req.query.user_id || req.user?.id
    if (!userId) return res.status(400).json({ message: 'User ID diperlukan' })

    const [rows] = await db.query(
      `SELECT * FROM login_events WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`,
      [Number(userId)]
    )
    res.json(rows)
  } catch (err) {
    console.error('❌ Error getLoginEvents:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = {
  corsMiddleware,
  getDeviceHistory,
  getLoginEvents,
}
