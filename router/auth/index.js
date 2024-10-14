const express = require("express");
const driverControllers = require("../../controllers/driver/driverController");
const userController = require("../../controllers/user/userController");

const router = express.Router();

// User registration and authentication routes
router.post('/register/initial', userController.initialRegistration);
router.post('/register/complete', userController.completeRegistration);
router.post('/verify-phone', userController.verifyPhone);

// verify
router.post("/send-code", driverControllers.userPasswordChangSendCode);
router.post("/verify-code", driverControllers.userPasswordChangCode);
router.post("/new-password", driverControllers.userPasswordReset);
router.post("/resend-code", driverControllers.smsCodeResend);

//  login routeri
router.post("/login",  userController.login);
router.post("/logout", driverControllers.userLogout);

module.exports = router;
