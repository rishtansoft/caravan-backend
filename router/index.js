const express = require("express");
const adminRoutes = require("./admin/index");
const adminDriverRoutes = require("./admin/driver");
const adminOwnerRoutes = require("./admin/owners");
const authRoutes = require("./auth/index");
const usersRoutes = require("./user/index");
const loadsRoutes = require("./load/index");
const assignmentRoutes = require('./assignments/index');
const driver = require('./driver');
// const sendmessage = require('./sendmessage/sendmessage')
const router = express.Router();

// Admin va User route'larini birlashtirish
router.use("/admin", adminRoutes);
router.use("/admin/driver", adminDriverRoutes);
router.use("/admin/owner", adminOwnerRoutes);
router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/loads", loadsRoutes);
router.use("/assignments", assignmentRoutes);
// router.use("/sendmessage", sendmessage);

router.use("/driver", driver);



module.exports = router;
