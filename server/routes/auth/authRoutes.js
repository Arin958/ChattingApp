const express = require("express");
const { register, login, logout, getMe, checkAuth, updateProfile } = require("../../controller/auth/auth");
const { verifyToken } = require("../../middleware/verifyToken");
const upload = require("../../middleware/upload");

const authRoutes = express.Router();


authRoutes.post("/register", upload.single("avatar"), register);
authRoutes.post("/login", login);
authRoutes.post("/logout",verifyToken, logout);
authRoutes.get("/me", verifyToken, getMe);
authRoutes.get("/check-auth", verifyToken, checkAuth)
authRoutes.put("/edit-profile", verifyToken, upload.single("avatar"), updateProfile);

module.exports = authRoutes