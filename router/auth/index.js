const express = require("express");
const driverControllers = require("../../controllers/driver/driverController");
const userController = require("../../controllers/user/userController");

const router = express.Router();

// User registration and authentication routes
router.post('/register/initial', userController.initialRegistration);
router.post('/register/complete', userController.completeRegistration);
router.post('/verify-phone', userController.verifyPhone);
router.post("/resend-code", userController.resendVerification);

// forgot password
router.post("/forgot-password", userController.forgotPassword);
router.post("/verify-reset-forgot", userController.verifyResetCode);
router.post("/reset-password", userController.resetPassword);

// verify
router.post("/send-code", driverControllers.userPasswordChangSendCode);
router.post("/verify-code", driverControllers.userPasswordChangCode);
router.post("/new-password", driverControllers.userPasswordReset);

//  login routeri
router.post("/login",  userController.login);
router.post("/logout", driverControllers.userLogout);

// check driver is full regisgtered
router.post("/check-driver", userController.checkDriverInfo);

module.exports = router;
