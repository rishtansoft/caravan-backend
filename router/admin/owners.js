const express = require("express");

const adminOwnerController = require("../../controllers/admin/adminOwnerController");
const { adminMiddleware } = require("../../middleware/adminAuthMiddleware");

const router = express.Router();

// Yuk egalari ro'yxatini olish, qidiruv va filtrlash.
router.get('/', adminMiddleware, adminOwnerController.getOwners);
// Ayni bir yuk egasi haqida ma'lumot olish.
router.get('/:ownerId', adminMiddleware, adminOwnerController.getOwnerById);
// Yuk egasi ma'lumotlarini yangilash.
router.put('/:ownerId/update', adminOwnerController.updateOwner);
// Delete driver information
router.delete('/:ownerId', adminMiddleware, adminOwnerController.deleteOwner);
// Get orders completed by a specific driver
router.get('/:ownerId/orders', adminOwnerController.getOwnerOrders);
// Block driver
router.post('/:ownerId/block', adminOwnerController.blockOwner);



module.exports = router;