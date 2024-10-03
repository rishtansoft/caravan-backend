const express = require("express");

const router = express.Router();
const driverControllers = require("../../controllers/driver/driverController");

router.post("/send-code", driverControllers.userPasswordChangSendCode);
router.post("/verify-code", driverControllers.userPasswordChangCode);
router.post("/new-password", driverControllers.userPasswordReset);
router.post("/resend-code", (req, res, next) => {
  console.log("hiiii ");
  driverControllers.smsCodeResend(req, res, next);
});

module.exports = router;
