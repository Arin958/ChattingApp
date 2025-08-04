const Message = require("../../model/Message");
const User = require("../../model/User");
const FriendRequest = require("../../model/FriendRequest");
const mongoose = require("mongoose");

// @desc    Get all users except the logged-in user with friend request status
// @route   GET /api/users
// @access  Private
exports.getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const currentUser = await User.findById(currentUserId);

    // Get all users except current user
    const users = await User.find({ _id: { $ne: currentUserId } })
      .select("username avatar status createdAt lastSeen privacySettings")
      .lean();

    // Enrich with friend request status and friendship info
    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        // Check if already friends
        const isFriend = currentUser.contacts.some(
          (c) => c.user.toString() === user._id.toString()
        );

        // Check for pending friend requests
        const friendRequest = await FriendRequest.findOne({
          $or: [
            { sender: currentUserId, receiver: user._id },
            { sender: user._id, receiver: currentUserId },
          ],
          status: "pending",
        });

        let requestStatus = null;
        let requestId = null;

        if (friendRequest) {
          requestStatus =
            friendRequest.sender.toString() === currentUserId
              ? "request_sent"
              : "request_received";
          requestId = friendRequest._id;
        }

        return {
          ...user,
          isFriend,
          requestStatus,
          requestId,
          canSendRequest:
            user.privacySettings.profileVisibility === "public" ||
            (user.privacySettings.profileVisibility === "contacts" && isFriend),
        };
      })
    );

    // Filter out users who can't receive requests based on privacy
    const filteredUsers = enrichedUsers.filter(
      (user) =>
        user.privacySettings.profileVisibility === "public" ||
        user.isFriend ||
        user.requestStatus
    );

    res.json({
      success: true,
      users: filteredUsers.map((user) => ({
        _id: user._id,
        username: user.username,
        avatar: user.avatar,
        status: user.status,
        lastSeen: user.lastSeen,
        isFriend: user.isFriend,
        requestStatus: user.requestStatus,
        requestId: user.requestId,
        canSendRequest: user.canSendRequest,
      })),
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error while fetching users" });
  }
};



// @desc    Get all friends of the logged-in user
// @route   GET /api/users/friends
// @access  Private
exports.getFriends = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const user = await User.findById(currentUserId)
      .populate("contacts.user")
      .lean();

    const friends = user.contacts
      .filter((contact) => contact.user)
      .map((contact) => {
        const u = contact.user;
        return {
          _id: u._id,
          username: u.username,
          avatar: u.avatar,
          status: u.status,
          lastSeen: u.lastSeen,
          isFriend: true,
        };
      });

    res.json({
      success: true,
      friends,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching friends",
    });
  }
};

// @desc    Get users with latest message and friend status
// @route   GET /api/users/with-messages
// @access  Private
exports.getUsersWithLatestMessage = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const currentUser = await User.findById(currentUserId);

    // Get all users except current user
    const users = await User.find({ _id: { $ne: currentUserId } })
      .select("username avatar status createdAt lastSeen")
      .lean();

    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        // Get latest message
        const latestMessage = await Message.findOne({
          $or: [
            { sender: currentUserId, receiver: user._id },
            { sender: user._id, receiver: currentUserId },
          ],
        })
          .sort({ createdAt: -1 })
          .limit(1);

        // Check friendship status
        const isFriend = currentUser.contacts.some(
          (c) => c.user.toString() === user._id.toString()
        );

        // Check friend request status
        const friendRequest = await FriendRequest.findOne({
          $or: [
            { sender: currentUserId, receiver: user._id },
            { sender: user._id, receiver: currentUserId },
          ],
          status: "pending",
        });

        let requestStatus = null;
        if (friendRequest) {
          requestStatus =
            friendRequest.sender.toString() === currentUserId
              ? "request_sent"
              : "request_received";
        }

        return {
          ...user,
          latestMessage,
          isFriend,
          requestStatus,
        };
      })
    );

    // Sort by latest message date or user creation date
    enrichedUsers.sort((a, b) => {
      const timeA = a.latestMessage?.createdAt || a.createdAt;
      const timeB = b.latestMessage?.createdAt || b.createdAt;
      return new Date(timeB) - new Date(timeA);
    });

    res.json({
      success: true,
      users: enrichedUsers.map((user) => ({
        _id: user._id,
        username: user.username,
        avatar: user.avatar,
        status: user.status,
        lastSeen: user.lastSeen,
        latestMessage: user.latestMessage,
        isFriend: user.isFriend,
        requestStatus: user.requestStatus,
      })),
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching users with messages",
    });
  }
};

// @desc    Get a specific user's details with friendship status
// @route   GET /api/users/:userId
// @access  Private
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // Find user with privacy settings
    const user = await User.findById(userId)
      .select(
        "username avatar status createdAt lastSeen privacySettings contacts"
      )
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const currentUser = await User.findById(currentUserId);

    // Check friendship status
    const isFriend = currentUser.contacts.some(
      (c) => c.user.toString() === userId.toString()
    );

    // Check friend request status
    const friendRequest = await FriendRequest.findOne({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId },
      ],
      status: "pending",
    });

    let requestStatus = null;
    if (friendRequest) {
      requestStatus =
        friendRequest.sender.toString() === currentUserId
          ? "request_sent"
          : "request_received";
    }

    // Prepare response based on privacy settings
    let responseData = {
      _id: user._id,
      username: user.username,
      avatar: user.avatar,
      status: user.status,
      isFriend,
      requestStatus,
      canSendRequest:
        user.privacySettings.profileVisibility === "public" ||
        (user.privacySettings.profileVisibility === "contacts" && isFriend),
    };

    // Add additional fields based on privacy
    if (isFriend || user.privacySettings.profileVisibility === "public") {
      responseData = {
        ...responseData,
        createdAt: user.createdAt,
        lastSeen: user.lastSeen,
      };
    }

    res.json({
      success: true,
      user: responseData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching user details",
    });
  }
};

// @desc    Search users with friend request status

// @access  Private
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    const currentUserId = req.user.id;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Please enter at least 2 characters",
      });
    }

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "Current user not found",
      });
    }

    // Search users
    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ],
      _id: { $ne: currentUserId },
    })
      .select("username avatar status createdAt lastSeen privacySettings")
      .lean();

    // Enrich with friend request status
    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        const isFriend = currentUser.contacts.some(
          (c) => c.user.toString() === user._id.toString()
        );

        const friendRequest = await FriendRequest.findOne({
          $or: [
            { sender: currentUserId, receiver: user._id },
            { sender: user._id, receiver: currentUserId },
          ],
          status: "pending",
        });

        let requestStatus = null;
        if (friendRequest) {
          requestStatus =
            friendRequest.sender.toString() === currentUserId
              ? "request_sent"
              : "request_received";
        }

        return {
          ...user,
          isFriend,
          requestStatus,
          canSendRequest:
            user.privacySettings.profileVisibility === "public" ||
            (user.privacySettings.profileVisibility === "contacts" && isFriend),
        };
      })
    );

    // Filter based on privacy settings
    const filteredUsers = enrichedUsers.filter(
      (user) =>
        user.privacySettings.profileVisibility === "public" ||
        user.isFriend ||
        user.requestStatus
    );

    res.status(200).json({
      success: true,
      users: filteredUsers.map((user) => ({
        _id: user._id,
        username: user.username,
        avatar: user.avatar,
        status: user.status,
        isFriend: user.isFriend,
        requestStatus: user.requestStatus,
        canSendRequest: user.canSendRequest,
        ...(user.isFriend || user.privacySettings.profileVisibility === "public"
          ? {
              lastSeen: user.lastSeen,
              createdAt: user.createdAt,
            }
          : {}),
      })),
    });
  } catch (error) {
    console.error("SearchUsers Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error during user search",
    });
  }
};
