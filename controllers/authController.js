const bcrypt = require("bcryptjs");
const db = require("../config/db");
const jwt = require("jsonwebtoken");

// 🔑 Login user
exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username dan password wajib diisi" });
  }

  try {
    // Cari user
    const [rows] = await db.execute("SELECT * FROM users WHERE username = ?", [username]);
    if (rows.length === 0) {
      return res.status(400).json({ message: "User tidak ditemukan" });
    }

    const user = rows[0];

    // Bandingkan password dengan hash bcrypt
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ message: "Password salah" });
    }

    // Buat JWT
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: process.env.JWT_EXPIRES || "1h" }
    );

    return res.json({
      success: true,
      token,
      user: { id: user.id, username: user.username },
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// 🔑 Ambil data user dari token
exports.me = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  return res.json({
    id: req.user.id,
    username: req.user.username,
  });
};
