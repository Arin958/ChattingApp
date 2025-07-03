const User = require("../../model/User");
const jwt = require("jsonwebtoken");
const cloudinary = require("../../utils/cloudinary");
const bcrypt = require("bcryptjs");

// Create JWT
const createToken = (user) => {
  return jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// @desc    Register new user
// @route   POST /api/auth/register

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    let avatarUrl = "https://i.imgur.com/6VBx3io.png";

    // Check for existing user
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Email or username already in use" });
    }

    if (req.file) {
      // Because upload_stream uses a callback, we need to promisify it:
      const streamUpload = (buffer) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              transformation: [
                { width: 300, height: 300, crop: "thumb", gravity: "face" },
              ],
            },
            (error, result) => {
              if (result) resolve(result);
              else reject(error);
            }
          );
          stream.end(buffer);
        });
      };

      const result = await streamUpload(req.file.buffer);
      avatarUrl = result.secure_url;
    }

    const newUser = await User.create({
      username,
      email,
      password,
      avatar: avatarUrl,
    });

    const token = createToken(newUser);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ user: newUser.toPublic() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password} = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = createToken(user);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      user: user.toPublic(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout


// @desc    Get current logged-in user
// @route   GET /api/auth/me
exports.checkAuth = async (req, res) => {
  try {
    // req.user is set by verifyToken middleware
    const { id, email, username, avatar } = req.user;

    res.status(200).json({
      success: true,
      message: "User is authenticated",
      user: { id, email },
    });
  } catch (error) {
    console.error("CheckAuth Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while checking authentication",
    });
  }
};

// @desc    Get current logged-in user full info
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const { id } = req.user; // comes from verifyToken middleware

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      user: user.toPublic(), // return public data only
    });
  } catch (err) {
    console.error("GetMe Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
// @desc    Logout user
// @route   POST /api/auth/logout
exports.logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    res.status(200).json({
      success: true,
      message: "User logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};
