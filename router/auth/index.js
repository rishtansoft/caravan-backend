const express = require("express");
const multer = require("multer");
const path = require("path");
const {
  loginAdminValidation,
} = require("../../controllers/admin/authController");
const usersControllers = require("../../controllers/user/usersControllers");
const driverControllers = require("../../controllers/driver/driverController");

const router = express.Router();

// Admin registratsiyasi uchun endpoint
router.post("/register", (req, res, next) => {
  console.log("Register route hit");
  usersControllers.userAdd(req, res, next);
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({
  storage: storage,
}).fields([
  { name: "tex_pas_img", maxCount: 1 },
  { name: "prava_img", maxCount: 1 },
  { name: "car_img", maxCount: 1 },
]);

// driver registratsiyasi uchun endpoint
router.post("/register/driver", upload, (req, res, next) => {
  console.log("driver route hit");
  driverControllers.user2Add(req, res, next);
});

// Admin login route'i
router.post("/login", loginAdminValidation, usersControllers.userLogin);

module.exports = router;