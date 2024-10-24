const express = require("express");
const { 
    adminController, 
    validateRegistrationFields, 
    validateLoginFields 
} = require("../../controllers/admin/authController");
const {
    createCarType,
    getAllCarTypes,
    getCarType,
    updateCarType,
    deleteCarType
} = require('../../controllers/admin/carTypeController');

const router = express.Router();

// Admin registratsiyasi uchun endpoint
router.post("/register", validateRegistrationFields, adminController.registerAdmin.bind(adminController));

// Admin login route'i
router.post("/login", validateLoginFields, adminController.loginAdmin.bind(adminController));

// Create a car type
router.post('/car-type/create', createCarType);

// Get all car types
router.get('/car-type/get-all', getAllCarTypes);

// Get one car type by id
router.get('/car-type/get-one/:id', getCarType);

// Update car type by id
router.put('/car-type/update/:id', updateCarType);

// Delete car type by id
router.delete('/car-type/delete/:id', deleteCarType);

module.exports = router;