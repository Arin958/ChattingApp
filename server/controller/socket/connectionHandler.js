// controllers/socket/connectionHandler.js
const User = require("../../model/User");
const { addUser, removeUser, getUserSocket } = require("../../services/socketService");

const handleConnection = async (io, socket) => {
  const userId = socket.user.id;
  
  // Add user to socket map
  addUser(userId, socket.id);
  socket.join(userId);

  // Update user status in DB
  await User.findByIdAndUpdate(userId, {
    socketId: socket.id,
    status: "online",
    lastSeen: null,
  });

  console.log(`User ${userId} connected`);

  // Notify all users about online users
  const onlineUsers = await User.find({ status: "online" }).select("_id");
  io.emit("online-users", onlineUsers.map((u) => u._id.toString()));

  // Handle disconnection
  socket.on("disconnect", async () => {
    removeUser(userId);
    await User.findByIdAndUpdate(userId, {
      status: "offline",
      lastSeen: new Date(),
      socketId: null,
    });
    socket.broadcast.emit("user-offline", userId);
  });
};

module.exports = handleConnection;