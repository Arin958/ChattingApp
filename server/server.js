const express = require("express");
require("dotenv").config();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const cookie = require("cookie");

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth/authRoutes");
const User = require("./model/User");
const chatRoutes = require("./routes/chat/chatRoutes");
const userRoutes = require("./routes/user/userRoutes");

const app = express();
const server = http.createServer(app);

// Shared CORS origin checker
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "https://chatting-app-dusky.vercel.app",
];

const isOriginAllowed = (origin) => {
  return (
    !origin ||
    allowedOrigins.includes(origin) ||
    /\.vercel\.app$/.test(origin)
  );
};

// CORS for Express
app.use(
  cors({
    origin: function (origin, callback) {
      if (isOriginAllowed(origin)) callback(null, true);
      else callback(new Error("Not allowed by CORS: " + origin));
    },
    credentials: true,
  })
);

// Express middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/get-users", userRoutes);

// Socket.IO CORS config
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (isOriginAllowed(origin)) callback(null, true);
      else callback(new Error("Not allowed by Socket.IO CORS: " + origin));
    },
    credentials: true,
  },
});

// Connect MongoDB
connectDB();

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  try {
    const cookies = cookie.parse(socket.handshake.headers.cookie || "");
    const token = cookies.token;
    if (!token) return next(new Error("No token provided"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    console.error("Socket auth error:", err.message);
    return next(new Error("Authentication failed"));
  }
});

// In-memory user-socket map
const userSocketMap = new Map();

io.on("connection", async (socket) => {
  const userId = socket.user.id;
  userSocketMap.set(userId, socket.id);

  await User.findByIdAndUpdate(userId, {
    socketId: socket.id,
    status: "online",
    lastSeen: null,
  });

  const onlineUsers = await User.find({ status: "online" }).select("_id");
  io.emit("online-users", onlineUsers.map((u) => u._id.toString()));

  socket.on("get-online-users", async () => {
    const online = await User.find({ status: "online" }).select("_id");
    socket.emit("online-users", online.map((u) => u._id.toString()));
  });

  socket.on("typing", (receiverId) => {
    const receiverSocketId = userSocketMap.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("typing", userId);
    }
  });

  socket.on("stopTyping", (receiverId) => {
    const receiverSocketId = userSocketMap.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("stopTyping", userId);
    }
  });

  socket.on("disconnect", async () => {
    userSocketMap.delete(userId);
    await User.findByIdAndUpdate(userId, {
      status: "offline",
      lastSeen: new Date(),
      socketId: null,
    });
    socket.broadcast.emit("user-offline", userId);
  });
});

app.set("io", io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
