const express = require("express");
const { verifyToken } = require("../../middleware/verifyToken");
const { getAllUsers, getUserById, getUsersWithLatestMessage } = require("../../controller/user/userController");


const userRoutes = express.Router();

userRoutes.get("/", verifyToken, getAllUsers)
userRoutes.get("/latest-message", verifyToken, getUsersWithLatestMessage)
userRoutes.get("/:userId", verifyToken, getUserById)

module.exports = userRoutes