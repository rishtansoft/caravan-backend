// routers/admin/index.js
const express = require("express");
const { registerAdmin, loginAdmin, validateAdminRegistration, loginAdminValidation } = require("../../controllers/admin/authController");

const {
    createCarType,
    getAllCarTypes,
    getCarType,
    updateCarType,
    deleteCarType
} = require('../../controllers/admin/carTypeController')

const router = express.Router();

// Admin registratsiyasi uchun endpoint
router.post("/register", validateAdminRegistration, registerAdmin);

// Admin login route'i
router.post("/login", loginAdminValidation, loginAdmin);


// Car Type routes

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
