const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Foydalanuvchi ro'yxatdan o'tkazish
router.post('/register', authController.register);

module.exports = router;
