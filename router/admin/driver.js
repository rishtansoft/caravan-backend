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
router.post('/:driverId/unblock', authMiddleware, adminMiddleware, adminsController.unblockDriver);
router.post('/:driverId/approve', authMiddleware, adminMiddleware, adminsController.approveDriver);
router.post('/:driverId/reject', authMiddleware, adminMiddleware, adminsController.rejectDriver);

module.exports = router;
