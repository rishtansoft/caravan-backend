// routers/index.js
const express = require("express");
const adminRoutes = require("./admin/index");
const authRoutes = require("./auth/index");

const router = express.Router();

// Admin va User route'larini birlashtirish
router.use("/admin", adminRoutes);
router.use("/auth", authRoutes);

module.exports = router;
