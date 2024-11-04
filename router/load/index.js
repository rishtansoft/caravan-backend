const express = require("express");
const protect = require("../../middleware/authMiddleware");
const loadController = require("../../controllers/load/loadController");
const assignmentController = require("../../controllers/assignments/assignmentController");


const router = express.Router();

router.post('/create', protect, loadController.createLoad);

router.get('/details', protect, loadController.getLoadDetails);

router.delete('/deactivate', protect, loadController.deactivateLoad);

// assign load
router.post('/assign-load', protect, assignmentController.assignLoadToDriver);

// Internet uzilganda barcha location larni bazaga joylash
router.post('/load-location-all-save', protect, assignmentController.loadLocationBatch);

// Driver ning oxirgi manzilini olish
router.post('/last-location-driver', protect, assignmentController.getLastLocationDriver);

// Load ning statusini o'zgrtirish
router.post('/change-load-status', protect, assignmentController.changeLoadStatus);


module.exports = router;
