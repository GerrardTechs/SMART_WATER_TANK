const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Load .env config
dotenv.config();

// Init express
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// CORS setup (sesuaikan kalau frontend pakai port lain)
app.use(cors({
  origin: ["http://localhost:8080", "http://127.0.0.1:8080"], // Quasar dev
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// Import routes
const authRoutes = require("./routes/authRoutes");
const tankRoutes = require("./routes/tankRoutes");
const adminRoutes = require("./routes/adminRoutes");
const streamRoutes = require("./routes/streamRoutes");
const iotRoutes = require("./routes/iotRoutes");
const historyRoutes = require("./routes/historyRoutes");
const deviceRoutes = require("./routes/deviceRoutes"); // tambah device detail route

// Pakai routes
app.use("/api/auth", authRoutes);
app.use("/api/water-tanks", tankRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/stream", streamRoutes);
app.use("/api/iot", iotRoutes);

// ⚡ Revisi penting: history routes
// Mount history routes langsung di /api supaya frontend bisa tetap pakai:
//   GET /api/device-history
//   GET /api/login-events
app.use("/api/history", historyRoutes);

// Device detail
app.use("/api", deviceRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("🚀 Smart Watertank Backend is running");
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});