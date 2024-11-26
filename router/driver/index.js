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

// yukni olishga yetib kelganligini tasdiqlash
router.post("/arrived-luggage", protect, driverController.arrivedLuggage);

// yukni olishga yetib kelganligini tasdiqlash
router.post("/start-loading", protect, driverController.startLoading);

// yukning statusini olish
router.get("/load-status", protect, driverController.getLoadStatus);

// yuklashni tamomlash uchun api
router.post("/finish-pickup-load", protect, driverController.finishLoadPickup);

// yukni olishga ketayotgani haqida
router.post("/arring-to-get-load", protect, driverController.arrivingToGetLoad);

// yukni olishga ketayotgani haqida
router.post("/finish-trip", protect, driverController.finishTrip);

// yukni olishga ketayotgani haqida
router.get("/get-drvier-location", protect, driverController.getDriverLocation);

module.exports = router;
