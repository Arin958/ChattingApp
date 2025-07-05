// controllers/socket/userStatusHandler.js
const User = require("../../model/User");

const setupUserStatusHandlers = (socket) => {
  socket.on("get-online-users", async () => {
    const onlineUsers = await User.find({ status: "online" }).select("_id");
    socket.emit("online-users", onlineUsers.map((u) => u._id.toString()));
  });
};

module.exports = setupUserStatusHandlers;