import React, { useEffect, useRef, useState, useCallback } from "react";
import { debounce } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import {
  addIncomingMessage,
  removeMessage,
  markSeenLocally,
  resetMessages,
  fetchMessages,
  markMessagesAsSeen,
  sendMessage,
  addSocketMessage,
} from "../../Store/message/messageSlice";
import socket from "../../socket/socket";
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  FaceSmileIcon,
  CheckIcon,
  EllipsisVerticalIcon,
  MagnifyingGlassIcon as SearchIcon,
  EllipsisHorizontalIcon as DotsHorizontalIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import axios from "axios";
import { useParams } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

const ChatRoom = () => {
  const dispatch = useDispatch();
  const messageRefs = useRef({});
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [newMessage, setNewMessage] = useState("");
  const { messages, loading } = useSelector((state) => state.message);
  const { user } = useSelector((state) => state.auth);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const { userId } = useParams();
  const [currentChat, setCurrentChat] = useState(null);
  const [loadingChat, setLoadingChat] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch chat data
  const fetchChatData = useCallback(async () => {
    if (!userId) return;

    try {
      setLoadingChat(true);
      dispatch(resetMessages());

      const [userRes] = await Promise.all([
        axios.get(`${API}/api/get-users/${userId}`, {
          withCredentials: true,
        }),
        dispatch(fetchMessages(userId)),
      ]);

      setCurrentChat(userRes.data);
    } catch (err) {
      console.error("Error fetching chat data:", err);
    } finally {
      setLoadingChat(false);
    }
  }, [userId, dispatch]);

  useEffect(() => {
    fetchChatData();
    return () => {
      // Clear typing indicator when leaving chat
      socket.emit("stopTyping", userId);
    };
  }, [fetchChatData, userId]);

  // Filter messages for current chat
  const currentMessages = messages.filter(
    (msg) =>
      (msg.sender._id === userId && msg.receiver._id === user._id) ||
      (msg.sender._id === user._id && msg.receiver._id === userId)
  );

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setFilePreview(reader.result);
      reader.readAsDataURL(file);
    } else if (file.type.startsWith("video/")) {
      setFilePreview("video");
    } else {
      setFilePreview("file");
    }
  };

  // Remove selected file
  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle message seen status
  const handleMessageSeen = useCallback(
    debounce(async (messageId) => {
      const message = messages.find((m) => m._id === messageId);
      if (!message || message.seen || message.sender._id === user._id) return;

      try {
        await dispatch(markMessagesAsSeen(messageId)).unwrap();
      } catch (err) {
        console.error("Error marking message as seen:", err);
      }
    }, 300),
    [messages, user._id, dispatch]
  );

  // Intersection observer for message visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.dataset.messageId;
            if (messageId) {
              const message = messages.find((m) => m._id === messageId);
              if (message && !message.seen && message.sender._id !== user._id) {
                handleMessageSeen(messageId);
              }
            }
          }
        });
      },
      { threshold: 0.5, rootMargin: "0px 0px -100px 0px" }
    );

    const currentMessageElements =
      document.querySelectorAll("[data-message-id]");
    currentMessageElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [messages, user._id, handleMessageSeen]);

  // Scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, scrollToBottom]);

  // Socket event handlers
  useEffect(() => {
    const handleNewMessage = (message) => {
      const normalizedMessage = {
        ...message,
        sender:
          typeof message.sender === "object"
            ? message.sender
            : { _id: message.sender },
        receiver:
          typeof message.receiver === "object"
            ? message.receiver
            : { _id: message.receiver },
      };
      dispatch(addSocketMessage(normalizedMessage));
    };

    const handleDeletedMessage = ({ messageId }) => {
      dispatch(removeMessage(messageId));
    };

    const handleMessagesSeen = ({ messageId, seenAt }) => {
      dispatch(
        markSeenLocally({
          messageId,
          seenAt: seenAt || new Date().toISOString(),
        })
      );
    };

    const handleTypingEvent = (senderId) => {
      if (senderId === userId) {
        setIsTyping(true);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 2000);
      }
    };

    const handleStopTypingEvent = (senderId) => {
      if (senderId === userId) {
        setIsTyping(false);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messageDeleted", handleDeletedMessage);
    socket.on("messagesSeen", handleMessagesSeen);
    socket.on("typing", handleTypingEvent);
    socket.on("stopTyping", handleStopTypingEvent);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messageDeleted", handleDeletedMessage);
      socket.off("messagesSeen", handleMessagesSeen);
      socket.off("typing", handleTypingEvent);
      socket.off("stopTyping", handleStopTypingEvent);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [userId, dispatch]);

  // Message handlers
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if ((!newMessage.trim() && !selectedFile) || !currentChat?._id) return;

    try {
      setIsUploading(true);
      
      const formData = new FormData();
      formData.append("receiver", currentChat._id);
      if (newMessage.trim()) formData.append("content", newMessage);
      if (selectedFile) formData.append("file", selectedFile);

      await dispatch(
        sendMessage(formData)
      ).unwrap();
      
      setNewMessage("");
      setSelectedFile(null);
      setFilePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      socket.emit("stopTyping", userId);
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleTyping = (e) => {
    const text = e.target.value;
    setNewMessage(text);

    if (!userId) return;

    if (text.trim()) {
      socket.emit("typing", userId);
    } else {
      socket.emit("stopTyping", userId);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", userId);
    }, 2000);
  };

  // UI Components
  const Avatar = ({ src, alt, size = "md" }) => {
    const sizes = {
      sm: "w-8 h-8",
      md: "w-10 h-10",
      lg: "w-12 h-12",
    };

    return (
      <div
        className={`flex-shrink-0 rounded-full overflow-hidden ${sizes[size]} bg-gray-200 flex items-center justify-center`}
      >
        {src ? (
          <img src={src} alt={alt} className="w-full h-full object-cover" />
        ) : (
          <span className="text-gray-600 font-medium">
            {alt?.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
    );
  };

  const MessageBubble = ({ message, isCurrentUser }) => {
    return (
      <div
        ref={(el) => (messageRefs.current[message._id] = el)}
        data-message-id={message._id}
        className={`flex max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${
          isCurrentUser
            ? "bg-blue-500 text-white rounded-tr-none"
            : "bg-gray-100 text-gray-800 rounded-tl-none"
        }`}
      >
        <div className="flex-1">
          {!isCurrentUser && (
            <span className="font-semibold text-xs block -mt-1 mb-1">
              {message.sender.username}
            </span>
          )}
          {message.type === "image" ? (
            <img
              src={message.mediaUrl}
              alt="Sent content"
              className="max-w-full max-h-60 rounded-lg mb-1"
            />
          ) : message.type === "video" ? (
            <video
              controls
              className="max-w-full max-h-60 rounded-lg mb-1"
              src={message.mediaUrl}
            />
          ) : (
            <p className="break-words">{message.content}</p>
          )}
        </div>
        <div className="flex items-end pl-2 space-x-1">
          <span className="text-xs opacity-70">
            {format(new Date(message.createdAt), "h:mm a")}
          </span>
          {isCurrentUser &&
            (message.seen ? (
              <span className="text-[10px] text-blue-200 font-medium">✓✓</span>
            ) : (
              <CheckIcon className="w-3 h-3 text-blue-200" />
            ))}
        </div>
      </div>
    );
  };

  if (loadingChat) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!currentChat) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-6 max-w-md">
          <h3 className="text-xl font-medium text-gray-700 mb-2">
            Chat not found
          </h3>
          <p className="text-gray-500">
            The user you're trying to chat with doesn't exist or you don't have
            permission
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Chat header */}
      <div className="flex items-center p-3 border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="flex items-center flex-1">
          <Avatar src={currentChat.avatar} alt={currentChat.username} />
          <div className="ml-3">
            <h3 className="font-semibold text-gray-900">
              {currentChat.username}
            </h3>
            <p className="text-xs text-gray-500">
              {isTyping ? (
                <span className="text-blue-500 animate-pulse">typing...</span>
              ) : (
                currentChat.status || "offline"
              )}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button className="p-2 rounded-full hover:bg-gray-100">
            <SearchIcon className="w-5 h-5 text-gray-600" />
          </button>
          <div className="relative">
            <button
              className="p-2 rounded-full hover:bg-gray-100"
              onClick={() => setShowOptions(!showOptions)}
            >
              <DotsHorizontalIcon className="w-5 h-5 text-gray-600" />
            </button>
            {showOptions && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20">
                <button className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                  Delete conversation
                </button>
                <button className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                  Mute notifications
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading && messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : currentMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p className="text-lg">No messages yet</p>
            <p className="text-sm mt-1">
              Send a message to start the conversation
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {currentMessages.map((message) => (
              <div
                key={message._id}
                className={`flex ${
                  message.sender._id === user._id
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                {message.sender._id !== user._id && (
                  <Avatar
                    src={message.sender.avatar}
                    alt={message.sender.username}
                    size="sm"
                    className="mr-2 self-end mb-1"
                  />
                )}
                <MessageBubble
                  message={message}
                  isCurrentUser={message.sender._id === user._id}
                />
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <Avatar
                  src={currentChat.avatar}
                  alt={currentChat.username}
                  size="sm"
                  className="mr-2 self-end mb-1"
                />
                <div className="flex items-center px-4 py-2 rounded-2xl bg-gray-100 text-gray-800 rounded-tl-none max-w-xs">
                  <div className="flex space-x-1 px-2 py-1">
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* File preview */}
      {filePreview && (
        <div className="px-4 py-2 bg-gray-100 border-t border-gray-200 relative">
          <div className="flex items-center justify-between">
            {filePreview === "video" ? (
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700">
                  Video: {selectedFile.name}
                </span>
              </div>
            ) : filePreview === "file" ? (
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700">
                  File: {selectedFile.name}
                </span>
              </div>
            ) : (
              <img
                src={filePreview}
                alt="Preview"
                className="max-h-40 rounded-lg"
              />
            )}
            <button
              onClick={removeSelectedFile}
              className="p-1 rounded-full hover:bg-gray-200 text-gray-500"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Message input */}
      <div className="p-3 border-t border-gray-200 bg-white sticky bottom-0">
        <form onSubmit={handleSendMessage} className="flex items-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,video/*"
            className="hidden"
          />
          <button
            type="button"
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
          >
            <FaceSmileIcon className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
          >
            <PaperClipIcon className="w-6 h-6" />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder="Type a message..."
            className="flex-1 mx-2 py-2 px-4 rounded-full border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-gray-100"
          />
          <button
            type="submit"
            disabled={(!newMessage.trim() && !selectedFile) || isUploading}
            className={`p-2 rounded-full ${
              (newMessage.trim() || selectedFile) && !isUploading
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <PaperAirplaneIcon className="w-5 h-5 transform rotate-90" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;