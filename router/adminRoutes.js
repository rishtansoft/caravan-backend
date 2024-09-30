const Router = require("express");
const {
  addAdmin,
  getAllAdmins,
  updateAdmin,
  deleteAdmin,
} = require("../controllers/adminController");
const router = new Router();

router.post("/add", addAdmin);

router.get("/getAdmins", getAllAdmins);

router.put("/:id", updateAdmin);

router.delete("/:id", deleteAdmin);

module.exports = router;
