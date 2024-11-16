const express = require("express");

const adminsController = require("../../controllers/admin/adminsController");
const { adminMiddleware } = require("../../middleware/adminAuthMiddleware");

const router = express.Router();

// Drivers staff things
router.get('/', adminMiddleware ,adminsController.getAllDrivers);
// router.get('/', adminsController.getDrivers);
// Get a specific driver by ID
router.get('/:driverId', adminMiddleware , adminsController.getDriverById);
// Update driver information
router.put('/:driverId/update', adminMiddleware , adminsController.updateDriver);
// Delete driver information
router.delete('/:driverId', adminMiddleware , adminsController.deleteDriver);
// Get orders completed by a specific driver
router.get('/:driverId/orders', adminMiddleware , adminsController.getDriverOrders);
// Block driver
router.post('/:driverId/block', adminMiddleware , adminsController.blockDriver);



module.exports = router;