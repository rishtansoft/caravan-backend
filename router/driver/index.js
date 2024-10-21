const express = require("express");
const protect = require("../../middleware/authMiddleware");
const driverController = require("../../controllers/driver/driverController");

const router = express.Router();

// get profile
router.get("/profile", protect, driverController.getProfile);

// update profile
router.put("/update-profile", protect, driverController.updateDriverProfile);

module.exports = router;
