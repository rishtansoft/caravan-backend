const express = require("express");

const adminOwnerController = require("../../controllers/admin/adminOwnerController");
const { authMiddleware, adminMiddleware } = require("../../middleware/adminAuthMiddleware");

const router = express.Router();

router.get('/', authMiddleware, adminMiddleware, adminOwnerController.getOwners);
router.get('/:ownerId', authMiddleware, adminMiddleware, adminOwnerController.getOwnerById);
router.put('/:ownerId/update', authMiddleware, adminMiddleware, adminOwnerController.updateOwner);
router.delete('/:ownerId', authMiddleware, adminMiddleware, adminOwnerController.deleteOwner);
router.get('/:ownerId/orders', authMiddleware, adminMiddleware, adminOwnerController.getOwnerOrders);
router.post('/:ownerId/block', authMiddleware, adminMiddleware, adminOwnerController.blockOwner);

module.exports = router;
