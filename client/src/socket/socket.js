// src/socket.js
import { io } from "socket.io-client";

let socket = null;

export const initializeSocket = () => {
  if (!socket) {
    socket = io(import.meta.env.VITE_API_URL, {
      withCredentials: true,
      transports: ["websocket"], // optional but more stable
    });

    // Optional: log connection events
    socket.on("connect", () => console.log("✅ Socket connected"));
    socket.on("disconnect", () => console.log("❌ Socket disconnected"));
    socket.on("connect_error", (err) => console.error("Socket error:", err));
  }

  return socket;
};

export const getSocket = () => socket;
