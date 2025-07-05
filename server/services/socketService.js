// services/socketService.js
const userSocketMap = new Map();

const addUser = (userId, socketId) => {
  userSocketMap.set(userId, socketId);
};

const removeUser = (userId) => {
  userSocketMap.delete(userId);
};

const getUserSocket = (userId) => {
  return userSocketMap.get(userId);
};

module.exports = {
  userSocketMap,
  addUser,
  removeUser,
  getUserSocket,
};