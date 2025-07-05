// src/components/chat/ChatList.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { initializeSocket, getSocket } from "../../socket/socket";

const API = import.meta.env.VITE_API_URL;

const ChatList = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch users with latest messages
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(`${API}/api/get-users/latest-message`, {
          withCredentials: true,
        });
        setUsers(res.data);
      } catch (err) {
        console.error("Fetch error:", err.response?.data || err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    // Initialize socket connection once
    initializeSocket();
    const socket = getSocket();
    if (!socket) return;

    // Handler for new messages received from socket
    const handleNewMessage = ({ senderId, message }) => {
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === senderId
            ? {
                ...user,
                latestMessage: message,
                unreadCount: (user.unreadCount || 0) + 1,
                updatedAt: new Date().toISOString(),
              }
            : user
        )
      );
    };

    // Handler for marking messages seen
    const handleSeenMessages = ({ receiverId }) => {
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === receiverId ? { ...user, unreadCount: 0 } : user
        )
      );
    };

    // Handler for deleted message updates
    const handleDeletedMessage = ({ messageId }) => {
      setUsers((prevUsers) =>
        prevUsers.map((user) => {
          if (user.latestMessage?._id === messageId) {
            return {
              ...user,
              latestMessage: {
                ...user.latestMessage,
                content: "Message deleted",
                deleted: true,
              },
            };
          }
          return user;
        })
      );
    };

    // Register socket listeners
    socket.on("newMessage", handleNewMessage);
    socket.on("messagesSeen", handleSeenMessages);
    socket.on("messageDeleted", handleDeletedMessage);

    // Cleanup listeners on unmount
    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messagesSeen", handleSeenMessages);
      socket.off("messageDeleted", handleDeletedMessage);
    };
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const updateOnlineUsers = (onlineUserIds) => {
      setUsers((prevUsers) =>
        prevUsers.map((user) => ({
          ...user,
          status: onlineUserIds.includes(user._id) ? "online" : "offline",
        }))
      );
    };

    socket.on("online-users", updateOnlineUsers);
    socket.emit("get-online-users");

    return () => {
      socket.off("online-users", updateOnlineUsers);
    };
  }, []);

 const handleUserClick = async (userId) => {
  try {
    await axios.get(`${API}/api/chat/${userId}`, { withCredentials: true });

    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user._id === userId ? { ...user, unreadCount: 0 } : user
      )
    );

    const socket = getSocket();
    socket?.emit("markMessagesSeen", { userId });

    // Check if we need to refresh after navigation
    const needsRefresh = sessionStorage.getItem("justOpenedChat");

    navigate(`/chats/${userId}`);

    if (needsRefresh) {
      sessionStorage.removeItem("justOpenedChat");
      // Delay to let route change
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }

  } catch (err) {
    console.error("Open chat error:", err.message);
  }
};


  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return formatTime(dateString);
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const getMessagePreview = (message) => {
    if (!message) return "No messages yet";
    if (message.deleted) return "Message deleted";
    if (message.type === "text") return message.content;
    return "📎 Media";
  };

  const filteredUsers = [...users]
    .sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.latestMessage?.createdAt || 0);
      const dateB = new Date(b.updatedAt || b.latestMessage?.createdAt || 0);
      return dateB - dateA;
    })
    .filter((user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Chats</h1>
      </div>

      {/* Search Bar */}
      <div className="p-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search contacts..."
            className="w-full p-3 pl-10 rounded-lg bg-gray-100 dark:bg-gray-800 border-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg
            className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">
              Loading conversations...
            </p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <svg
              className="h-16 w-16 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
              No conversations found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? "Try a different search term" : "Start a new conversation"}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredUsers.map((user) => (
              <li
                key={user._id}
                onClick={() => handleUserClick(user._id)}
                className={`flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${
                  user.unreadCount > 0 ? "bg-blue-50 dark:bg-gray-800" : ""
                }`}
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={user.avatar}
                    className="w-12 h-12 rounded-full object-cover"
                    alt={user.username}
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                      user.status === "online" ? "bg-green-500" : "bg-gray-400"
                    }`}
                  ></span>
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user.username}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(user.updatedAt || user.latestMessage?.createdAt)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p
                      className={`text-sm truncate ${
                        user.latestMessage?.deleted
                          ? "text-gray-400 italic dark:text-gray-500"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {getMessagePreview(user.latestMessage)}
                    </p>
                    {user.unreadCount > 0 && (
                      <span className="bg-blue-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                        {user.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ChatList;
