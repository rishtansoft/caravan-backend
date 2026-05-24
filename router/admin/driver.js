const express = require("express");

const adminsController = require("../../controllers/admin/adminsController");
const { authMiddleware, adminMiddleware } = require("../../middleware/adminAuthMiddleware");

const router = express.Router();

router.get('/', authMiddleware, adminMiddleware, adminsController.getAllDrivers);
router.get('/:driverId', authMiddleware, adminMiddleware, adminsController.getDriverById);
router.put('/:driverId/update', authMiddleware, adminMiddleware, adminsController.updateDriver);
router.delete('/:driverId', authMiddleware, adminMiddleware, adminsController.deleteDriver);
router.get('/:driverId/orders', authMiddleware, adminMiddleware, adminsController.getDriverOrders);
router.post('/:driverId/block', authMiddleware, adminMiddleware, adminsController.blockDriver);

module.exports = router;
