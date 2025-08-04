const express = require("express");
const groupRouter = express.Router();
const { verifyToken } = require("../../middleware/verifyToken");
const {
  createGropup,
  getUserGroups,
  getGroupDetails,
  updateGroup,
  addGroupMembers,
  removeGroupMember,
  promoteToAdmin,
  demoteAdmin,
} = require("../../controller/user/groupController");

groupRouter.post("/", verifyToken, createGropup);
groupRouter.get("/", verifyToken, getUserGroups);
groupRouter.get("/:groupId", verifyToken, getGroupDetails);
groupRouter.put("/:groupId", verifyToken, updateGroup);
groupRouter.post("/:groupId/member", verifyToken, addGroupMembers);
groupRouter.delete("/:groupId/member/:memberId", verifyToken, removeGroupMember);

groupRouter.patch("/:groupId/admins/:memberId", verifyToken, promoteToAdmin);
groupRouter.delete("/:groupId/admins/:memberId", verifyToken, demoteAdmin);

module.exports = groupRouter;

