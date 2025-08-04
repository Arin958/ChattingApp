const express = require("express");
const friendRequestRoutes = express.Router();
const { verifyToken } = require("../../middleware/verifyToken");
const {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  getFriendRequests,
  unfriend,
  getOnlyAddFriends,
} = require("../../controller/user/friendRequestController");

friendRequestRoutes.post("/friend-requests", verifyToken, sendFriendRequest);
friendRequestRoutes.patch(
  "/friend-requests/:requestId/accept",
  verifyToken,
  acceptFriendRequest
);
friendRequestRoutes.patch(
  "/friend-requests/:requestId/reject",
  verifyToken,
  rejectFriendRequest
);
friendRequestRoutes.get(
  "/friend-requests/available",
  verifyToken,
  getOnlyAddFriends
);
friendRequestRoutes.delete(
  "/friend-requests/:requestId",
  verifyToken,
  cancelFriendRequest
);
friendRequestRoutes.delete("/unfriend/:friendId", verifyToken, unfriend);
friendRequestRoutes.get("/friend-requests", verifyToken, getFriendRequests);

module.exports = friendRequestRoutes;
