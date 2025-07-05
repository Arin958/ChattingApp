// app.js
const express = require("express");
require("dotenv").config();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth/authRoutes");
const chatRoutes = require("./routes/chat/chatRoutes");
const userRoutes = require("./routes/user/userRoutes");
const socketAuthMiddleware = require("./middleware/socket/socketAuthMiddleware");
const handleConnection = require("./controller/socket/connectionHandler");
const setupTypingHandlers = require("./controller/socket/typingHandler");
const setupUserStatusHandlers = require("./controller/socket/userStatusHandler");

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

// Socket.IO setup
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (isOriginAllowed(origin)) callback(null, true);
      else callback(new Error("Not allowed by Socket.IO CORS: " + origin));
    },
    credentials: true,
  },
});

// Socket.IO middleware
io.use(socketAuthMiddleware);

app.set('io', io); // This is crucial

// Socket.IO connection handler
io.on("connection", (socket) => {
  handleConnection(io, socket);
  setupTypingHandlers(io, socket);
  setupUserStatusHandlers(socket);
});

// Connect MongoDB
connectDB();

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});