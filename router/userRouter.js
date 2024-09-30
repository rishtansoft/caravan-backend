const Router = require("express");
const router = new Router();
const multer = require("multer");
const storage = multer.memoryStorage();
const {
  userAdd,
  user2Add,
  userLogin,
  userPasswordChangSendCode,
  userPasswordChangCode,
  smsCodeResed,
  userRegisterActive,
} = require("../controllers/usersControllers");
const authMiddleware = require("../middleware/authMiddleware");

const upload = multer({ storage: storage });

router.post("/register", userAdd);
router.post("/registerDriver", user2Add);
router.post("/login", userLogin);

// Protected routes
router.post(
  "/changePasswordSendCode",
  authMiddleware,
  userPasswordChangSendCode
);
router.post("/changePasswordVerifyCode", authMiddleware, userPasswordChangCode);
router.post("/resendSmsCode", smsCodeResed);
router.post("/register/activate", userRegisterActive);

router.post(
  "/add",
  upload.fields([
    { name: "user_img", maxCount: 1 },
    { name: "car_img", maxCount: 1 },
  ]),
  userAdd
);

module.exports = router;
