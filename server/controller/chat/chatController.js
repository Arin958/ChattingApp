const Message = require("../../model/Message");
const User = require("../../model/User");
const cloudinary = require('../../utils/cloudinary');
const upload = require('../../middleware/upload');


const mongoose = require("mongoose");



// @desc    Send a new message
// @route   POST /api/messages
// @access  Private

exports.sendMessage = async (req, res) => {
  try {
    const { receiver, content = "", type = "text" } = req.body; // Make content optional with default
    const sender = req.user.id;

    // Validate receiver exists
    const receiverUser = await User.findById(receiver);
    if (!receiverUser) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    let mediaUrl = null;
    let mediaType = type;
    let messageContent = content;
    
    // Handle file upload if present
    if (req.file) {
      try {
        // Convert buffer to data URI for Cloudinary
        const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(dataUri, {
          resource_type: 'auto',
          folder: 'chat_media'
        });

        mediaUrl = result.secure_url;
        mediaType = result.resource_type;
        
        // Set default content if none provided
        if (!messageContent.trim()) {
          messageContent = mediaType === 'image' ? '📷 Photo' : '🎥 Video';
        }
      } catch (uploadError) {
        console.error('Upload error:', uploadError);
        return res.status(500).json({ message: 'File upload failed' });
      }
    }

    // Validate we have either content or media
    if (!messageContent.trim() && !mediaUrl) {
      return res.status(400).json({ message: "Message content or file is required" });
    }

    const newMessage = await Message.create({
      sender,
      receiver,
      content: messageContent,
      type: mediaType,
      mediaUrl,
    });

    // Populate sender details
    await newMessage.populate("sender", "name avatar");

    // Emit socket event
    const io = req.app.get("io");
    const receiverSocketId = receiverUser.socketId;
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    const senderUser = await User.findById(sender);
    if (senderUser?.socketId) {
      io.to(senderUser.socketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
// @desc    Get conversation between two users
// @route   GET /api/messages/:userId
// @access  Private
exports.getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const limit = parseInt(req.query.limit) || 20;
    const before = req.query.before; // ISO date string for pagination (e.g., ?before=2024-06-27T14:30:00.000Z)

    // Build query
    const query = {
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId },
      ],
      deletedFor: { $ne: currentUserId },
    };

    // Apply cursor-based pagination
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 }) // Newest first
      .limit(limit)
      .populate("sender", "name avatar")
      .populate("receiver", "name avatar");

    // Mark unseen messages as seen (from the other user)
    const unseenMessages = await Message.updateMany(
      {
        sender: userId,
        receiver: currentUserId,
        seen: false,
      },
      {
        seen: true,
        seenAt: new Date(),
      }
    );

    // Notify sender that messages have been seen
    const io = req.app.get("io");
    const otherUser = await User.findById(userId);
    if (otherUser?.socketId) {
      io.to(otherUser.socketId).emit("messagesSeen", {
        receiverId: currentUserId,
      });
    }

    res.json({
      messages: messages.reverse(), // Oldest first for chat UI
      hasMore: messages.length === limit, // Used for frontend infinite scroll
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete a message
// @route   DELETE /api/messages/:messageId
// @access  Private
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if user is sender or receiver
    if (!message.sender.equals(userId) && !message.receiver.equals(userId)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Soft delete - add user to deletedFor array
    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      { $addToSet: { deletedFor: userId } },
      { new: true }
    );

    // Notify other user via socket if online
    const otherUserId = message.sender.equals(userId)
      ? message.receiver
      : message.sender;

    const otherUser = await User.findById(otherUserId);
    const io = req.app.get("io");

    if (otherUser?.socketId) {
      io.to(otherUser.socketId).emit("messageDeleted", {
        messageId,
        deletedForCurrentUser: false,
      });
    }

    res.json(updatedMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Mark messages as seen
// @route   PUT /api/messages/mark-seen
// @access  Private
exports.markMessagesAsSeen = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id; // The user who is viewing the message

    // Find and update the message
    const message = await Message.findOneAndUpdate(
      {
        _id: messageId,
        receiver: userId, // Ensure the current user is the receiver
        seen: false, // Only update if not already seen
      },
      {
        $set: {
          seen: true,
          seenAt: new Date(),
        },
      },
      { new: true }
    ).populate("sender", "socketId");

    if (!message) {
      return res
        .status(404)
        .json({ message: "Message not found or already seen" });
    }

    // Notify sender via socket if online
    const io = req.app.get("io");
    if (message.sender?.socketId) {
      io.to(message.sender.socketId).emit("messagesSeen", {
        messageId: message._id,
        seenAt: message.seenAt,
      });
    }

    res.json({
      success: true,
      messageId: message._id,
      seenAt: message.seenAt,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
