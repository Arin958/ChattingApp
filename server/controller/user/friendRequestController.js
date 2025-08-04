const FriendRequest = require("../../model/FriendRequest");
const User = require("../../model/User");
const mongoose = require("mongoose");

// Helper function to emit socket events
const emitToUser = (userId, event, data, io) => {
  const userSocket = io.sockets.sockets.get(userId);
  if (userSocket) {
    userSocket.emit(event, data);
  }
};

// @desc    Send friend request
// @route   POST /api/friend-requests
// @access  Private
exports.sendFriendRequest = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user.id;
    const io = req.app.get("io"); // Get Socket.IO instance

    // Validate receiverId
    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    if (receiverId === senderId) {
      return res.status(400).json({
        success: false,
        message: "Cannot send friend request to yourself",
      });
    }

    // Check if users exist
    const [sender, receiver] = await Promise.all([
      User.findById(senderId),
      User.findById(receiverId),
    ]);

    if (!sender || !receiver) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if already friends
    if (sender.contacts.some((c) => c.user.toString() === receiverId)) {
      return res.status(400).json({
        success: false,
        message: "Already friends with this user",
      });
    }

    // Check if receiver has blocked sender
    if (receiver.blockedUsers.includes(senderId)) {
      return res.status(403).json({
        success: false,
        message: "Cannot send friend request to this user",
      });
    }

    // Check privacy settings
    if (
      receiver.privacySettings.profileVisibility === "private" ||
      (receiver.privacySettings.profileVisibility === "contacts" &&
        !receiver.contacts.some((c) => c.user.toString() === senderId))
    ) {
      return res.status(403).json({
        success: false,
        message: "Cannot send friend request to this user",
      });
    }

    // Check if request already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
      status: "pending",
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message:
          existingRequest.sender.toString() === senderId
            ? "Friend request already sent"
            : "You have a pending request from this user",
      });
    }

    // Create new request
    const friendRequest = await FriendRequest.create({
      sender: senderId,
      receiver: receiverId,
      status: "pending",
    });

    // Populate sender/receiver details
    await friendRequest.populate("sender", "username avatar");
    await friendRequest.populate("receiver", "username avatar");

    // Notify receiver in real-time
    emitToUser(
      receiverId,
      "new-friend-request",
      {
        request: friendRequest,
        sender: friendRequest.sender,
      },
      io
    );

    res.status(201).json({
      success: true,
      message: "Friend request sent",
      friendRequest,
    });
  } catch (error) {
    console.error("SendFriendRequest Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while sending friend request",
    });
  }
};

// @desc    Accept friend request
// @route   PATCH /api/friend-requests/:requestId/accept
// @access  Private
exports.acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const acceptorId = req.user.id;
    const io = req.app.get("io"); // Get Socket.IO instance

    // Validate requestId
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request ID",
      });
    }

    // Find the request
    const request = await FriendRequest.findById(requestId)
      .populate("sender", "username avatar")
      .populate("receiver", "username avatar");

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Friend request not found",
      });
    }

    // Verify the acceptor is the receiver
    if (request.receiver._id.toString() !== acceptorId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to accept this request",
      });
    }

    // Check if already friends
    const receiverUser = await User.findById(acceptorId);
    if (
      receiverUser.contacts.some(
        (c) => c.user.toString() === request.sender._id.toString()
      )
    ) {
      // If already friends, just delete the request
      await FriendRequest.findByIdAndDelete(requestId);
      return res.status(400).json({
        success: false,
        message: "Already friends with this user",
      });
    }

    // Check request status
    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Friend request already processed",
      });
    }

    // Update request status
    request.status = "accepted";
    await request.save();

    // Add to each other's contacts
    const contactData = {
      user: request.sender._id,
      addedAt: new Date(),
    };

    await Promise.all([
      User.findByIdAndUpdate(acceptorId, {
        $addToSet: { contacts: contactData },
      }),
      User.findByIdAndUpdate(request.sender._id, {
        $addToSet: {
          contacts: {
            user: acceptorId,
            addedAt: new Date(),
          },
        },
      }),
    ]);

    // Notify both users in real-time
    emitToUser(
      request.sender._id,
      "friend-request-accepted",
      {
        requestId: request._id,
        friend: request.receiver,
      },
      io
    );

    emitToUser(
      acceptorId,
      "friend-added",
      {
        requestId: request._id,
        friend: request.sender,
      },
      io
    );

    res.json({
      success: true,
      message: "Friend request accepted",
      friendRequest: request,
      newFriend: request.sender,
    });
  } catch (error) {
    console.error("AcceptFriendRequest Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while accepting friend request",
    });
  }
};

// @desc    Reject friend request
// @route   PATCH /api/friend-requests/:requestId/reject
// @access  Private
exports.rejectFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const rejectorId = req.user.id;
    const io = req.app.get("io"); // Get Socket.IO instance

    // Validate requestId
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request ID",
      });
    }

    // Find the request
    const request = await FriendRequest.findById(requestId).populate(
      "sender",
      "username avatar"
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Friend request not found",
      });
    }

    // Verify the rejector is the receiver
    if (request.receiver.toString() !== rejectorId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to reject this request",
      });
    }

    // Check request status
    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Friend request already processed",
      });
    }

    // Update request status
    request.status = "rejected";
    await request.save();

    // Notify sender in real-time
    emitToUser(
      request.sender._id,
      "friend-request-rejected",
      {
        requestId: request._id,
        receiverId: rejectorId,
      },
      io
    );

    res.json({
      success: true,
      message: "Friend request rejected",
      friendRequest: request,
    });
  } catch (error) {
    console.error("RejectFriendRequest Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while rejecting friend request",
    });
  }
};

// @desc    Cancel friend request
// @route   DELETE /api/friend-requests/:requestId
// @access  Private
exports.cancelFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const cancellerId = req.user.id;

    const io = req.app.get("io"); // Get Socket.IO instance

    // Validate requestId
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request ID",
      });
    }

    // Find the request
    const request = await FriendRequest.findById(requestId).populate(
      "receiver",
      "username avatar"
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Friend request not found",
      });
    }

    // Verify the canceller is the sender
    if (request.sender.toString() !== cancellerId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this request",
      });
    }

    // Check request status
    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a processed request",
      });
    }

    // Delete the request
    await FriendRequest.findByIdAndDelete(requestId);

    // Notify receiver in real-time
    emitToUser(
      request.receiver._id,
      "friend-request-cancelled",
      {
        requestId: request._id,
        senderId: cancellerId,
      },
      io
    );

    res.json({
      success: true,
      message: "Friend request cancelled",
    });
  } catch (error) {
    console.error("CancelFriendRequest Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while cancelling friend request",
    });
  }
};

// @desc    Get all friend requests
// @route   GET /api/friend-requests
// @access  Private
exports.getFriendRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const receivedRequests = await FriendRequest.find({
      receiver: userId,
      status: "pending", // optional: only show pending requests
    })
      .populate("sender", "username avatar status")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      receivedRequests,
    });
  } catch (error) {
    console.error("GetFriendRequests Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching received friend requests",
    });
  }
};






exports.unfriend = async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user.id;
    const io = req.app.get("io");

    if (!mongoose.Types.ObjectId.isValid(friendId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const [user, friend] = await Promise.all([
      User.findById(userId),
      User.findById(friendId),
    ]);

    const isFriendInUserContacts = user.contacts.some(
      (c) => c.user.toString() === friendId
    );
    const isUserFriendContacts = friend.contacts.some(
      (c) => c.user.toString() === userId
    );

    if (!isFriendInUserContacts || !isUserFriendContacts) {
      return res.status(400).json({
        success: false,
        message: "You are not friends with this user",
      });
    }

    await Promise.all([
      User.findByIdAndUpdate(userId, {
        $pull: { contacts: { user: friendId } },
      }),
      User.findByIdAndUpdate(friendId, {
        $pull: { contacts: { user: userId } },
      }),
    ]);

    await FriendRequest.deleteMany({
      $or: [
        { sender: userId, receiver: friendId },
        { sender: friendId, receiver: userId },
      ],
    });

    res.json({
      success: true,
      message: "Unfriended successfully",
    });
  } catch (error) {
    console.error("Unfriend Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while unfriending",
    });
  }
};



exports.getOnlyAddFriends = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const currentUser = await User.findById(currentUserId).select("contacts blockedUsers");

    // Get all users except the current user
    const users = await User.find({ _id: { $ne: currentUserId } })
      .select("username avatar status lastSeen privacySettings contacts blockedUsers")
      .lean();

    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        const userId = user._id.toString();

        // Skip if current user is blocked by this user
        const hasBlockedYou = (user.blockedUsers || []).some(
          (blockedId) => blockedId.toString() === currentUserId
        );
        if (hasBlockedYou) return null;

        // Skip if you blocked this user
        const youBlockedThem = (currentUser.blockedUsers || []).some(
          (blockedId) => blockedId.toString() === userId
        );
        if (youBlockedThem) return null;

        // Skip if already friends
        const isFriend = (currentUser.contacts || []).some(
          (c) => c.user.toString() === userId
        );
        if (isFriend) return null;

        // Skip if a pending request exists
        const existingRequest = await FriendRequest.findOne({
          $or: [
            { sender: currentUserId, receiver: userId },
            { sender: userId, receiver: currentUserId },
          ],
          status: "pending",
        });
        if (existingRequest) return null;

        // Check if user allows receiving requests
        const visibility = user.privacySettings?.profileVisibility || "public";
        const canSendRequest =
          visibility === "public" ||
          (visibility === "contacts" &&
            user.contacts.some((c) => c.user.toString() === currentUserId));

        if (!canSendRequest) return null;

        return {
          _id: user._id,
          username: user.username,
          avatar: user.avatar,
          status: user.status,
          lastSeen: user.lastSeen,
          canSendRequest,
        };
      })
    );

    // Filter out nulls from blocked/friends/etc.
    const filtered = enrichedUsers.filter(Boolean);

    res.json({
      success: true,
      users: filtered,
    });
  } catch (error) {
    console.error("getAddableUsers error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching addable users",
    });
  }
};


