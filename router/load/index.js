const express = require("express");
const protect = require("../../middleware/authMiddleware");
const loadController = require("../../controllers/load/loadController");

const router = express.Router();


router.post('/step1', protect, loadController.createLoadStep1);
router.post('/step2', protect, loadController.createLoadStep2);
router.post('/step3', protect, loadController.createLoadStep3);


router.get('/:loadId', protect, loadController.getLoad);        
router.put('/:loadId', protect, loadController.updateLoad);     
router.delete('/:loadId', protect, loadController.deleteLoad);  
router.get('/', protect, loadController.getUserLoads);  

module.exports = router;
