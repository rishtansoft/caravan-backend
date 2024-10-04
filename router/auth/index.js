const express = require("express");
const multer = require("multer");
const path = require("path");
const {
  loginAdminValidation,
} = require("../../controllers/admin/authController");
const driverControllers = require("../../controllers/driver/driverController");

const router = express.Router();

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

router.post("/register", driverControllers.userAdd);
// driver registratsiyasi uchun endpoint
router.post("/load-add", upload, driverControllers.user2Add);

// verify
router.post("/send-code", driverControllers.userPasswordChangSendCode);
router.post("/verify-code", driverControllers.userPasswordChangCode);
router.post("/new-password", driverControllers.userPasswordReset);
router.post("/resend-code", driverControllers.smsCodeResend);

//  login routeri
router.post("/login", loginAdminValidation, driverControllers.userLogin);
router.post("/logout", driverControllers.userLogout);

module.exports = router;
