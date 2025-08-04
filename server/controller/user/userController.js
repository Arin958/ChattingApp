const Message = require('../../model/Message');
const User = require('../../model/User');
const mongoose = require('mongoose');

// @desc    Get all users except the logged-in user
// @route   GET /api/users
// @access  Private
exports.getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const users = await User.find({ _id: { $ne: currentUserId } })
      .select('username avatar status'); // Select only public fields

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};



exports.getUsersWithLatestMessage = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const users = await User.find({ _id: { $ne: currentUserId } }).lean();

    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        const latestMessage = await Message.findOne({
          $or: [
            { sender: currentUserId, receiver: user._id },
            { sender: user._id, receiver: currentUserId }
          ]
        })
          .sort({ createdAt: -1 })
          .limit(1);

        return {
          ...user,
          latestMessage,
        };
      })
    );

    // Sort by latest message date (or fallback to user creation date)
    enrichedUsers.sort((a, b) => {
      const timeA = a.latestMessage?.createdAt || a.createdAt;
      const timeB = b.latestMessage?.createdAt || b.createdAt;
      return new Date(timeB) - new Date(timeA);
    });

    res.json(enrichedUsers);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
};



// @desc    Get a specific user's details
// @route   GET /api/user/:userId
// @access  Private
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Prevent fetching own data if that's your intention
    if (userId === currentUserId) {
      return res.status(400).json({ message: 'Cannot fetch current user details' });
    }

    // Find user
    const user = await User.findById(userId).select('username avatar status createdAt lastSeen');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc   Search users
// @route  GET /api/auth/search
// @access Private
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    const currectUserId = req.user.id;

    if (!q || q.length < 2) {
      return res
        .status(400)
        .json({ message: "Please enter at least 2 characters" });
    }

    const currentUser = await User.findById(currectUserId);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ],
      _id: { $ne: currectUserId },
    });

    const filteredUsers = users.filter((user) => {
      if (user.privacySettings.profileVisibility === "public") return true;
      if (user.privacySettings.profileVisibility === "contacts") {
        return currentUser.contacts.some(
          (c) => c.user.toString() === user._id.toString()
        );
      }
      return false;
    });

    res.status(200).json({ success: true, users: filteredUsers });
  } catch (error) {
    console.log("SearchUsers Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    })
  }
};

