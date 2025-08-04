const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      match: [/\S+@\S+\.\S+/, "Invalid email format"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    avatar: {
      type: String,
      default: "https://i.imgur.com/6VBx3io.png",
    },
    status: {
      type: String,
      enum: ["online", "offline"],
      default: "offline",
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    contacts: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    socketId: {
      type: String,
      default: null,
    },
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    privacySettings: {
      profileVisibility: {
        type: String,
        enum: ["public", "private", "hidden"],
        default: "public",
      },
      lastSeenVisibility: {
        type: String,
        enum: ["everyone", "contacts", "none"],
        default: "contacts",
      },
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Pre-save hook to hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare input password with hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Return only public user data
userSchema.methods.toPublic = function () {
  return {
    _id: this._id.toString(),
    username: this.username,
    email: this.email,
    avatar: this.avatar,
    status: this.status,
    lastSeen: this.lastSeen,
  };
};

userSchema.methods.isBlocked = function (userId) {
  return this.blockedUsers.includes(userId);
};

userSchema.methods.canReceiveFriendRequestFrom = function (userId) {
  if (this.blockedUsers.includes(userId)) return false;
  if (this.privacySettings.profileVisibility === "private") return false;
  if (
    this.privacySettings.profileVisibility === "contacts" &&
    !this.contacts.some((c) => c.user.toString() === userId.toString())
  ) {
    return false;
  }

  return true;
};

userSchema.methods.addContact = async function(userId) {
  if(!this.contacts.some(c=> c.user.toString() === userId.toString())) {
    this.contacts.push({user: userId});
    await this.save();
  }
}

userSchema.methods.removeContact = async function(userId) {
  this.contacts = this.contacts.filter(c => c.user.toString() !== userId.toString());
  await this.save();
}


const User = mongoose.model("User", userSchema);

module.exports = User;
