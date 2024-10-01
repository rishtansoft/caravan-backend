// routers/index.js
const express = require("express");
const adminRoutes = require("./admin/index");
// const userRoutes = require("./user/index"); // User routerini import qiling

const router = express.Router();

// Admin va User route'larini birlashtirish
router.use("/admin", adminRoutes);
// router.use("/user", userRoutes); // User route'larini birlashtiring

module.exports = router;
