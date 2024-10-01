// routers/admin/index.js
const express = require("express");
const { registerAdmin, loginAdmin, validateAdminRegistration, loginAdminValidation } = require("../../controllers/admin/authController");

const router = express.Router();

// Admin registratsiyasi uchun endpoint
router.post("/register", validateAdminRegistration, registerAdmin);

// Admin login route'i
router.post("/login", loginAdminValidation, loginAdmin);

module.exports = router;
