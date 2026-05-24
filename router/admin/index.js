const express = require("express");
const {
    adminController,
    validateRegistrationFields,
    validateLoginFields
} = require("../../controllers/admin/authController");

const adminsController = require("../../controllers/admin/adminsController");
const adminLoadController = require("../../controllers/admin/adminLoadController");
const adminUploadController = require("../../controllers/admin/adminUploadController");
const upload = require("../../utils/upload");
const { authMiddleware, adminMiddleware, superadminMiddleware } = require("../../middleware/adminAuthMiddleware");

const {
    createCarType,
    getAllCarTypes,
    getCarType,
    updateCarType,
    deleteCarType
} = require('../../controllers/admin/carTypeController');

const router = express.Router();

// Auth
router.post("/register", validateRegistrationFields, adminController.registerAdmin.bind(adminController));
router.post("/login", validateLoginFields, adminController.loginAdmin.bind(adminController));

// Current admin
router.get('/me', authMiddleware, adminMiddleware, adminsController.getMe);

// Admin self
router.put('/update', authMiddleware, adminMiddleware, adminsController.updateAdmin);
router.get('/profile/:id', authMiddleware, adminMiddleware, adminsController.getAdminProfile);
router.put('/password/update/:id', authMiddleware, adminMiddleware, adminsController.updateAdminPassword);

// Admins management (superadmin only for delete)
router.get('/admins', authMiddleware, adminMiddleware, adminsController.getAllAdmins);
router.delete('/admins/:adminId', authMiddleware, superadminMiddleware, adminsController.deleteAdmin);

// Stats / Dashboard
router.get('/stats', authMiddleware, adminMiddleware, adminsController.getStats);

// File upload (S3)
router.post('/upload', authMiddleware, adminMiddleware, upload.single('file'), adminUploadController.upload);
router.delete('/upload', authMiddleware, adminMiddleware, adminUploadController.deleteFile);

// Loads
router.get('/loads', authMiddleware, adminMiddleware, adminLoadController.getAllLoads);
router.post('/loads', authMiddleware, adminMiddleware, adminLoadController.createLoad);
router.get('/loads/:id', authMiddleware, adminMiddleware, adminLoadController.getLoadById);
router.put('/loads/:id', authMiddleware, adminMiddleware, adminLoadController.updateLoad);
router.delete('/loads/:id', authMiddleware, adminMiddleware, adminLoadController.deleteLoad);
router.get('/loads/:id/locations', authMiddleware, adminMiddleware, adminLoadController.getLoadLocations);
router.post('/loads/:id/deactivate', authMiddleware, adminMiddleware, adminLoadController.deactivateLoad);

// Car types
router.get('/car-type/get-all', getAllCarTypes);
router.get('/car-type/get-one/:id', getCarType);
router.post('/car-type/create', authMiddleware, adminMiddleware, createCarType);
router.put('/car-type/update/:id', authMiddleware, adminMiddleware, updateCarType);
router.delete('/car-type/delete/:id', authMiddleware, adminMiddleware, deleteCarType);

module.exports = router;
