const express = require("express");
const { register, login, logout, getMe, checkAuth } = require("../../controller/auth/auth");
const { verifyToken } = require("../../middleware/verifyToken");
const upload = require("../../middleware/upload");

const authRoutes = express.Router();


authRoutes.post("/register", upload.single("avatar"), register);
authRoutes.post("/login", login);
authRoutes.post("/logout", logout);
authRoutes.get("/me", verifyToken, getMe);
authRoutes.get("/check-auth", verifyToken, checkAuth)

module.exports = authRoutes