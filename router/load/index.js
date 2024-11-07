const express = require("express");
const protect = require("../../middleware/authMiddleware");
const loadController = require("../../controllers/load/loadController");
const assignmentController = require("../../controllers/assignments/assignmentController");


const router = express.Router();

router.post('/create', protect, loadController.createLoad);

router.post('/details', protect, loadController.getLoadDetails);

router.delete('/deactivate', protect, loadController.deactivateLoad);

// assign load
router.post('/assign-load', protect, assignmentController.assignLoadToDriver);

// Internet uzilganda barcha location larni bazaga joylash
router.post('/load-location-all-save', protect, assignmentController.loadLocationBatch);

// Driver ning oxirgi manzilini olish
router.post('/last-location-driver', protect, assignmentController.getLastLocationDriver);

// Load ning statusini o'zgrtirish
router.post('/change-load-status', protect, assignmentController.changeLoadStatus);

// user ning barcha load larini olish
router.get('/get-user-all-loads', protect, loadController.getUserAllLoads);

// Haydovchi uchun barcha yangi loadlarni olish
router.get('/get-all-active-loads', protect, loadController.getAllActiveLoads);

// Haydovchi uchun barcha yangi loadlarni olish
router.get('/get-driver-loads', protect, loadController.getDriverLoads);

// Driver statusini o'zgartirish
router.get('/update-driver-status', protect, loadController.updateDriverStatus);




module.exports = router;
