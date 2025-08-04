const express = require("express");
const { verifyToken } = require("../../middleware/verifyToken");
const {
  sendMessage,
  getConversation,
  deleteMessage,
  markMessagesAsSeen,
  getChatList,
  editMessage,
  getGroupConversation,
} = require("../../controller/chat/chatController");
const upload = require("../../middleware/upload");

const chatRoutes = express.Router();

chatRoutes.post("/", verifyToken, upload.single("file"), sendMessage);

chatRoutes.get("/:userId", verifyToken, getConversation);
chatRoutes.get("/group/:groupId", verifyToken, getGroupConversation);
chatRoutes.delete("/:messageId", verifyToken, deleteMessage);
chatRoutes.put("/seen/:messageId", verifyToken, markMessagesAsSeen);
chatRoutes.put("/edit-message/:messageId", verifyToken, editMessage);

module.exports = chatRoutes;
