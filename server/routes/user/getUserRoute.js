const express = require("express");
const { verifyToken } = require("../../middleware/verifyToken");
const {
  getAllUsers,
  getUsersWithLatestMessage,
  getUserById,
  getFriends,
} = require("../../controller/user/getUserController");
const getUserRoutes = express.Router();

// @route   GET /api/users
// @desc    Get all users with friend request status
// @access  Private
getUserRoutes.get("/", verifyToken, getAllUsers);
getUserRoutes.get("/latest-message", verifyToken, getUsersWithLatestMessage);
getUserRoutes.get("/my-friends", verifyToken, getFriends);
getUserRoutes.get("/:userId", verifyToken, getUserById);

module.exports = getUserRoutes;
