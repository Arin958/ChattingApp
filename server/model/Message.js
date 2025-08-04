const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return !this.group;
      },
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GroupFriends",
      required: function () {
        return !this.receiver;
      },
    },
    content: {
      type: String,
      required: false,
      trim: true, // Removes unnecessary whitespace
      maxlength: [1000, "Message too long"], // Prevent very long messages
    },
    seen: {
      type: Boolean,
      default: false,
    },
    seenAt: {
      type: Date, // Track when message was seen
    },
    // For group chats (future-proofing)
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat", // If you'll have chat rooms/groups
    },
    // For message types (text, image, etc.)
    type: {
      type: String,
      enum: ["text", "image", "video", "file"], // Message types
      default: "text",
    },
    // For file messages
    mediaUrl: {
      type: String,
    },

    deleted: {
      type: Boolean,
      default: false,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // For message deletion
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true }, // If you want to use virtuals
    toObject: { virtuals: true },
  }
);

// Indexes for faster queries
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ createdAt: -1 }); // For sorting by recent messages

const Message = (module.exports = mongoose.model("Message", messageSchema));
module.exports = Message;
