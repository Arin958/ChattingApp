const express = require("express");
require("dotenv").config();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const cookie = require("cookie"); // ✅ Correct parser for socket headers

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth/authRoutes");
const User = require("./model/User");
const chatRoutes = require("./routes/chat/chatRoutes");
const userRoutes = require("./routes/user/userRoutes");

const app = express();
const server = http.createServer(app); // for socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL, // Your Vite frontend
    credentials: true,
  },
});

// Connect to MongoDB
connectDB();

// Middleware
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "https://chatting-app-dusky.vercel.app",
];
// Add preview Vercel URLs dynamically using RegExp
app.use(
  cors({
    origin: function (origin, callback) {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        /\.vercel\.app$/.test(origin) // Allow all *.vercel.app preview URLs
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS: " + origin));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/get-users", userRoutes);



// ================= SOCKET.IO SETUP ================= //
io.use(async (socket, next) => {
  try {
    const cookies = cookie.parse(socket.handshake.headers.cookie || "");
    const token = cookies.token; // replace with your actual cookie name

    if (!token) {
      return next(new Error("No token provided"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    console.error("Socket auth error:", err.message);
    return next(new Error("Authentication failed"));
  }
});

// Add this at the top level of your server file (with other requires)
const userSocketMap = new Map(); // In-memory store for user-socket mapping

// Then modify your connection handler:
io.on("connection", async (socket) => {
  const userId = socket.user.id;

  // Update in-memory map
  userSocketMap.set(userId, socket.id);

  // Update user's status and socketId in DB
  await User.findByIdAndUpdate(userId, {
    socketId: socket.id,
    status: "online",
    lastSeen: null
  });

  // Get all online users
  const onlineUsers = await User.find({ status: 'online' }).select('_id');
  const onlineUserIds = onlineUsers.map(user => user._id.toString());

  // Notify all clients about the current online users
  io.emit('online-users', onlineUserIds);

  console.log(`🟢 User connected: ${userId} (${socket.id}) | Total connected: ${userSocketMap.size}`);

  // Online users request handler
  socket.on('get-online-users', async () => {
    const onlineUsers = await User.find({ status: 'online' }).select('_id');
    const onlineUserIds = onlineUsers.map(user => user._id.toString());
    socket.emit('online-users', onlineUserIds);
  });

  // Typing indicator handlers
  socket.on('typing', (receiverId) => {
    if (!socket.user?.id) return;
    
    const receiverSocketId = userSocketMap.get(receiverId);
    if (receiverSocketId) {
      
      io.to(receiverSocketId).emit('typing', socket.user.id);
    } else {
      console.log(`[Typing] Receiver ${receiverId} not connected`);
    }
  });

  socket.on('stopTyping', (receiverId) => {
    if (!socket.user?.id) return;
    
    const receiverSocketId = userSocketMap.get(receiverId);
    if (receiverSocketId) {
     
      io.to(receiverSocketId).emit('stopTyping', socket.user.id);
    }
  });

  socket.on("disconnect", async () => {
    // Remove from in-memory map
    userSocketMap.delete(userId);
    
    await User.findByIdAndUpdate(userId, {
      status: "offline",
      lastSeen: new Date(),
      socketId: null
    });

    // Notify all clients that this user went offline
    socket.broadcast.emit('user-offline', userId);
    console.log(`🔴 User disconnected: ${userId} | Remaining connections: ${userSocketMap.size}`);
  });
});
// Make io accessible from other files (optional)
app.set("io", io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
