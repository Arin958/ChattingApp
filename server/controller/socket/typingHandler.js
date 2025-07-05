// controllers/socket/typingHandler.js
const { getUserSocket } = require("../../services/socketService");

const setupTypingHandlers = (io, socket) => {
  socket.on("typing", (receiverId) => {
    const receiverSocketId = getUserSocket(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("typing", socket.user.id);
    }
  });

  socket.on("stopTyping", (receiverId) => {
    const receiverSocketId = getUserSocket(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("stopTyping", socket.user.id);
    }
  });
};

module.exports = setupTypingHandlers;