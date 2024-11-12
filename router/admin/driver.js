const express = require("express");

const adminsController = require("../../controllers/admin/adminsController");

const router = express.Router();

// Drivers staff things
router.get('/', adminsController.getAllDrivers);
// router.get('/', adminsController.getDrivers);
// Get a specific driver by ID
router.get('/:driverId', adminsController.getDriverById);
// Update driver information
router.put('/:driverId/update', adminsController.deleteDriver);
// Delete driver information
router.delete('/:driverId', adminsController.deleteDriver);
// Get orders completed by a specific driver
router.get('/:driverId/orders', adminsController.getDriverOrders);
// Block driver
router.post('/:driverId/block', adminsController.blockDriver);



module.exports = router;