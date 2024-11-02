const express = require("express");
const router = express.Router();

const { sendData, onlineUsers } = require('../../controllers/sendmessage/sendmessageCon')


router.post('/broadcast', sendData)
router.get('/online-users', onlineUsers)

module.exports = router;
