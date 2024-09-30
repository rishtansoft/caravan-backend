const { Users } = require("../models/models");
const { Op } = require("sequelize");
const io = require("../socketio");

io.on("connection", (socket) => {
  socket.on("newChatMessage", async (msg) => {
    try {
      const { messge, user_id, to_user_id } = msg;
    } catch (error) {
      console.log(error.stack);
    }
  });
});
