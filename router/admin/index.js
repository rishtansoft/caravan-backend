const express = require("express");
const {
    adminController,
    validateRegistrationFields,
    validateLoginFields
} = require("../../controllers/admin/authController");

const adminsController = require("../../controllers/admin/adminsController");
const { authMiddleware, adminMiddleware } = require("../../middleware/adminAuthMiddleware");

const {
    createCarType,
    getAllCarTypes,
    getCarType,
    updateCarType,
    deleteCarType
} = require('../../controllers/admin/carTypeController');

const router = express.Router();

router.post("/register", validateRegistrationFields, adminController.registerAdmin.bind(adminController));
router.post("/login", validateLoginFields, adminController.loginAdmin.bind(adminController));

router.put('/update', authMiddleware, adminMiddleware, adminsController.updateAdmin);
router.get('/profile/:id', authMiddleware, adminMiddleware, adminsController.getAdminProfile);
router.put('/password/update/:id', authMiddleware, adminMiddleware, adminsController.updateAdminPassword);

router.get('/car-type/get-all', getAllCarTypes);
router.get('/car-type/get-one/:id', getCarType);

router.post('/car-type/create', authMiddleware, adminMiddleware, createCarType);
router.put('/car-type/update/:id', authMiddleware, adminMiddleware, updateCarType);
router.delete('/car-type/delete/:id', authMiddleware, adminMiddleware, deleteCarType);

module.exports = router;
