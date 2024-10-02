const express = require("express");
const {
  loginAdminValidation,
} = require("../../controllers/admin/authController");
const usersControllers = require("../../controllers/user/usersControllers");

const router = express.Router();

// Admin registratsiyasi uchun endpoint
router.post("/register", (req, res, next) => {
  console.log("Register route hit");
  usersControllers.userAdd(req, res, next);
});

// Admin login route'i
router.post("/login", loginAdminValidation, usersControllers.userLogin);

module.exports = router;
