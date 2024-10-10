const express = require("express");
const adminRoutes = require("./admin/index");
const authRoutes = require("./auth/index");
const usersRoutes = require("./user/index");
const loadsRoutes = require("./load/index");
const assignmentRoutes = require('./assignments/index');

const router = express.Router();

// Admin va User route'larini birlashtirish
router.use("/admin", adminRoutes);
router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/loads", loadsRoutes);
router.use("/assignments", assignmentRoutes);

module.exports = router;
