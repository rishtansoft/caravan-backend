const express = require("express");
const protect = require("../../middleware/authMiddleware");
const userController = require("../../controllers/user/userController");
// const driverController = require("../../controllers/driver/driverController");

const router = express.Router();

router.get("/profile", protect, userController.getProfile);
router.put("/profile", protect, userController.updateProfile);

// driver

// router.put('/driver/update-details', protect, driverController.updateDriverDetails);

module.exports = router;
