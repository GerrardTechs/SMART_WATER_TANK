const db = require('../config/db')

// ✅ Ambil data history dengan pagination, filter tanggal & perubahan status relay
const getDeviceHistory = async (req, res) => {
  try {
    let { user_id, device_id, limit, offset, from, to } = req.query

    // 🔸 Sanitasi dan konversi ke number
    user_id = Number(user_id)
    device_id = Number(device_id)
    limit = Number(limit) || 10
    offset = Number(offset) || 0

    // 🔸 Bangun query dasar
    let query = `
      SELECT 
        dh.device_id, 
        dh.water_level, 
        wt.relay_status, 
        dh.created_at AS timestamp, 
        wt.name
      FROM device_history dh
      JOIN water_tanks wt ON wt.id = dh.device_id
      WHERE wt.user_id = ${user_id}
    `

    // Filter device tertentu
    if (device_id) {
      query += ` AND dh.device_id = ${device_id}`
    }

    // Filter tanggal (opsional)
    if (from) {
      query += ` AND dh.created_at >= '${from}'`
    }
    if (to) {
      query += ` AND dh.created_at <= '${to}'`
    }

    // Urutan terbaru & pagination
    query += ` ORDER BY dh.created_at DESC LIMIT ${limit} OFFSET ${offset};`

    const [rows] = await db.query(query)

    // 🧠 Filter perubahan relay status (ON→OFF→ON→OFF)
    const filteredRows = []
    let prevStatus = null

    for (const row of rows.reverse()) { // urut dari paling lama ke baru
      const currentStatus = row.relay_status
      if (prevStatus !== null && currentStatus !== prevStatus) {
        filteredRows.push(row)
      }
      prevStatus = currentStatus
    }

    // Balik lagi ke urutan DESC untuk tampil di frontend
    filteredRows.reverse()

    res.json({
      total: filteredRows.length,
      limit,
      offset,
      data: filteredRows
    })

  } catch (err) {
    console.error('❌ Error getDeviceHistory:', err)
    res.status(500).json({ message: 'Failed to fetch history' })
  }
}

// Event login (contoh tambahan)
const getLoginEvents = async (req, res) => {
  try {
    const userId = req.query.user_id || req.user?.id
    if (!userId) return res.status(400).json({ message: 'User ID diperlukan' })

    const [rows] = await db.query(`
      SELECT * FROM login_events 
      WHERE user_id = ${Number(userId)}
      ORDER BY created_at DESC LIMIT 20
    `)
    res.json(rows)
  } catch (err) {
    console.error('❌ Error getLoginEvents:', err)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = {
  getDeviceHistory,
  getLoginEvents
}
