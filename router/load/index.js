const express = require("express");
const protect = require("../../middleware/authMiddleware");
const loadController = require("../../controllers/load/loadController");

const router = express.Router();

router.post('/create', protect, loadController.createLoad);

router.get('/details', protect, loadController.getLoadDetails);

router.delete('/deactivate', protect, loadController.deactivateLoad);


module.exports = router;
