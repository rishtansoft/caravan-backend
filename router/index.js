const express = require("express");
const adminRoutes = require("./admin/index");
const authRoutes = require("./auth/index");
const usersRoutes = require("./user/index");

const router = express.Router();

// Admin va User route'larini birlashtirish
router.use("/admin", adminRoutes);
router.use("/auth", authRoutes);
router.use("/users", usersRoutes);

module.exports = router;
