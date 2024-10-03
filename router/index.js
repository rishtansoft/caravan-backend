const express = require("express");
const adminRoutes = require("./admin/index");
const authRoutes = require("./auth/index");
const resetRoutes = require("./password-reset/index");

const router = express.Router();

// Admin va User route'larini birlashtirish
router.use("/admin", adminRoutes);
router.use("/auth/user", authRoutes);
router.use("/auth/password-reset", resetRoutes);

module.exports = router;
