const Router = require("express");
const router = new Router();
const multer = require("multer");
const storage = multer.memoryStorage();
const { userAdd } = require("../controllers/usersControllers");
const authMiddleware = require("../middleware/authMiddleware");




const upload = multer({ storage: storage });

router.post("/add", upload.fields([
    { name: 'user_img', maxCount: 1 },
    { name: 'car_img', maxCount: 1 }
]), userAdd);

module.exports = router;
