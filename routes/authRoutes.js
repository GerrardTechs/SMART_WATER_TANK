const express = require("express");
const router = express.Router();

const { login, me } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

// Debug log (boleh hapus nanti)
console.log("login =", typeof login);
console.log("me =", typeof me);
console.log("protect =", typeof protect);

// Route login
router.post("/login", login);

// Route ambil data user login
router.get("/me", protect, me);

module.exports = router;
