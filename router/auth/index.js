const express = require("express");
const protect = require("../../middleware/authMiddleware");
const userController = require("../../controllers/user/userController");
const upload = require('../../utils/upload'); 

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

// code umri tugaganda ishlatiladi
router.post("/resend-code-forgot", userController.resendResetForgotCode);


//  login router
router.post("/login",  userController.login);
// router.post("/logout", driverControllers.userLogout);

// check driver is full regisgtered
router.post("/check-driver", userController.checkDriverInfo);
router.get("/get-profile", protect, userController.getProfile);

// update user main phone
router.post("/request-update-phone", protect, userController.requestMainPhoneChange);

// verify update user main phone
router.post("/verify-update-phone", protect, userController.verifyMainPhoneChange);

// verify update user main phone
router.post("/resend-code-update-phone", protect, userController.resendVerificationCodeChangePhone);

// upload user image
router.post('/upload-profile-picture', protect, upload.single('file'), userController.uploadUserProfilePicture);

// Rasmni o'chirish API
router.post('/delete-avatar',protect, userController.deleteAvatar);

// Rasmni almashtirish
router.post('/replace-avatar',protect, upload.single('file'), userController.replaceAvatar);

// Owner ning shaxsiy ma'lumotlarini o'zgartirish
router.post('/update-owner-profile',protect, userController.updateOwnerProfile);

// token ning active yoki active bolmaganligini aniqlovchi API
router.post('/check-token', userController.checkToken);


module.exports = router;
