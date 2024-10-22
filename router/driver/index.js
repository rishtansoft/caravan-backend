const express = require("express");
const protect = require("../../middleware/authMiddleware");
const driverController = require("../../controllers/driver/driverController");
const upload = require('../../utils/upload'); 
const router = express.Router();

// get profile
router.get("/profile", protect, driverController.getProfile);

// update profile
router.put("/update-profile", protect, driverController.updateDriverProfile);

// upload tex passport image
router.post("/upload-tex-passport", protect, upload.single('file'), driverController.uploadTexPassportImage);

// delete tex passport image
router.delete("/delete-tex-passport", protect, driverController.deleteTexPassportImage);

// replace tex passport image
router.post("/replace-tex-passport", protect, upload.single('file'), driverController.replaceTexPassportImage);

// upload prava image
router.post("/upload-prava", protect, upload.single('file'), driverController.uploadPravaImage);

// delete prava image
router.delete("/delete-prava", protect, driverController.deletePravaImage);

// replace prava image
router.post("/replace-prava", protect, upload.single('file'), driverController.replacePravaImage);

module.exports = router;
