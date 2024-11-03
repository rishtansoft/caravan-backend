const express = require("express");
const protect = require("../../middleware/authMiddleware");
const assignmentController = require("../../controllers/assignments/assignmentController");

const router = express.Router();



router.use(protect);
// router.post('/', assignmentController.createAssignment);        

module.exports = router;
