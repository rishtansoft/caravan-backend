const express = require("express");
const protect = require("../../middleware/authMiddleware");
const loadController = require("../../controllers/load/loadController");

const router = express.Router();

router.post('/', protect, loadController.createLoad);          
router.get('/:loadId', protect, loadController.getLoad);        
router.put('/:loadId', protect, loadController.updateLoad);     
router.delete('/:loadId', protect, loadController.deleteLoad);  
router.get('/', protect, loadController.getUserLoads);  

module.exports = router;
