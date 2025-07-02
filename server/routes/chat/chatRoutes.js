const express = require("express");
const { verifyToken } = require("../../middleware/verifyToken");
const {
  sendMessage,
  getConversation,
  deleteMessage,
  markMessagesAsSeen,
  getChatList,
} = require("../../controller/chat/chatController");
const upload = require("../../middleware/upload");

const chatRoutes = express.Router();

chatRoutes.post("/", verifyToken, upload.single("file"), sendMessage);
chatRoutes.get("/:userId", verifyToken, getConversation);
chatRoutes.delete("/:messageId", verifyToken, deleteMessage);
chatRoutes.put("/seen/:messageId", verifyToken, markMessagesAsSeen);

module.exports = chatRoutes;
