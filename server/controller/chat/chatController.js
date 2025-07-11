const Message = require("../../model/Message");
const User = require("../../model/User");
const cloudinary = require("../../utils/cloudinary");
const upload = require("../../middleware/upload");

const mongoose = require("mongoose");

// @desc    Send a new message
// @route   POST /api/chat
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { receiver, content = "" } = req.body;
    const sender = req.user.id;
    const file = req.file;

    // Validate required fields
    if (!receiver) {
      return res.status(400).json({ 
        success: false,
        error: "VALIDATION_ERROR",
        message: "Receiver is required",
        field: "receiver"
      });
    }

    // Validate content length when no file
    if (!file && !content.trim()) {
      return res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR", 
        message: "Message content cannot be empty when no file is attached",
        field: "content"
      });
    }

    // Validate content length
    if (content.length > 2000) {
      return res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        message: "Message content cannot exceed 2000 characters",
        field: "content"
      });
    }

    // Validate receiver exists
    const receiverUser = await User.findById(receiver);
    if (!receiverUser) {
      return res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: "Receiver user not found"
      });
    }

    let mediaUrl = null;
    let mediaType = "text";
    let messageContent = content;

    // Handle file upload if present
    if (file) {
      // Validate file size
      if (file.size > 10 * 1024 * 1024) { // 10MB
        return res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: "File size cannot exceed 10MB",
          field: "file"
        });
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: "Only JPEG, PNG, GIF images and MP4 videos are allowed",
          field: "file"
        });
      }

      try {
        const dataUri = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
        
        const result = await cloudinary.uploader.upload(dataUri, {
          resource_type: "auto",
          folder: "chat_media",
        });

        mediaUrl = result.secure_url;
        mediaType = result.resource_type;

        if (!messageContent.trim()) {
          messageContent = mediaType === "image" ? "📷 Photo" : "🎥 Video";
        }
        
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({
          success: false,
          error: "UPLOAD_FAILED",
          message: "Failed to upload file to cloud storage",
          details: uploadError.message
        });
      }
    }

    // Create message
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

   res.status(201).json({
  success: true,
  data: {
    ...newMessage.toObject(), // Convert Mongoose doc to plain object
    _id: newMessage._id,      // Explicitly ensure _id exists
    sender: {
      _id: senderUser._id,
      name: senderUser.name,
      avatar: senderUser.avatar
    },
    receiver: receiver,
    createdAt: newMessage.createdAt
  }
});
  } catch (error) {
    console.error("Message send error:", error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        message: "Validation failed",
        details: errors
      });
    }

    // Handle other errors
    res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "An unexpected error occurred",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
// @desc    Get conversation between two users
// @route   GET /api/chat/:userId
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
      .populate("receiver", "name avatar")
      

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
// @route   DELETE /api/chat/:messageId
// @access  Private
exports.deleteMessage = async (req, res) => {
    try {
        // First update the message
       const updatedMessage = await Message.findByIdAndUpdate(
    req.params.messageId,
    {
        deleted: true,
        deletedBy: req.user._id,
        deletedAt: new Date(),
        content: "This message was deleted"
    },
    { new: true }
)
.select("sender receiver deleted deletedBy deletedAt content") // make sure these exist
.lean(); // Use lean() for better performance

        if (!updatedMessage) {
            return res.status(404).json({ error: 'Message not found' });
        }

        const io = req.app.get("io");
        const responseData = {
            _id: updatedMessage._id,
            deleted: true,
            deletedBy: req.user._id, // Just send the ID
            deletedAt: updatedMessage.deletedAt,
            content: "This message was deleted"
        };

        // Emit to both parties with consistent structure
        io.to(updatedMessage.sender.toString()).emit('messageDeleted', {
            message: responseData
        });
        io.to(updatedMessage.receiver.toString()).emit('messageDeleted', {
            message: responseData
        });

        res.json({ 
            success: true,
            message: responseData
        });
    } catch (err) {
        console.error('Delete message error:', err);
        res.status(500).json({ 
            success: false,
            error: err.message 
        });
    }
};
// @desc    Mark messages as seen
// @route   PUT /api/chat/mark-seen
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

// @desc    Edit a message
// @route   PUT /api/chat/:messageId
// @access  Private
exports.editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { newContent } = req.body;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Only sender can edit the message
    if (!message.sender.equals(userId)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Update message content and mark as edited
    message.content = newContent;
    message.edited = true;
    await message.save();

    // Notify other user via socket if online
    const otherUserId = message.receiver;
    const otherUser = await User.findById(otherUserId);
    const io = req.app.get("io");

    if (otherUser?.socketId) {
      io.to(otherUser.socketId).emit("messageEdited", {
        messageId,
        newContent,
      });
    }

    res.json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
