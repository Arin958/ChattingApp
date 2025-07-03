import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { debounce, throttle } from "lodash";
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
import { format } from "date-fns";
import axios from "axios";
import { useParams } from "react-router-dom";

// Icons import (keep your existing imports)

const API = import.meta.env.VITE_API_URL;

const ChatRoom = () => {
  const dispatch = useDispatch();
  const messageRefs = useRef({});
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [newMessage, setNewMessage] = useState("");
  const { messages, loading } = useSelector((state) => state.message);
  const { user } = useSelector((state) => state.auth);
  const [isTyping, setIsTyping] = useState(false);
  const { userId } = useParams();
  const [currentChat, setCurrentChat] = useState(null);
  const [loadingChat, setLoadingChat] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const prevMessagesLength = useRef(0);

  // Fetch chat data with improved error handling
  const fetchChatData = useCallback(async () => {
    if (!userId) return;

    try {
      setLoadingChat(true);
      dispatch(resetMessages());

      const [userRes, messagesRes] = await Promise.all([
        axios.get(`${API}/api/get-users/${userId}`, {
          withCredentials: true,
        }),
        dispatch(fetchMessages(userId)).unwrap(),
      ]);

      setCurrentChat(userRes.data);
      
      // Sort messages by createdAt if not already sorted
      if (messagesRes?.length > 0) {
        const sortedMessages = [...messagesRes].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        // Dispatch action to update store with sorted messages if needed
      }
    } catch (err) {
      console.error("Error fetching chat data:", err);
    } finally {
      setLoadingChat(false);
    }
  }, [userId, dispatch]);

  useEffect(() => {
    fetchChatData();
    return () => {
      socket.emit("stopTyping", userId);
    };
  }, [fetchChatData, userId]);

  // Optimized message filtering and memoization
  const currentMessages = useMemo(() => {
    return messages
      .filter(
        (msg) =>
          (msg.sender._id === userId && msg.receiver._id === user._id) ||
          (msg.sender._id === user._id && msg.receiver._id === userId)
      )
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [messages, userId, user._id]);

  // Improved scroll behavior
  const scrollToBottom = useCallback((behavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior,
        block: "end",
      });
    }
  }, []);

  // Handle scroll events to detect if user is at bottom
  const handleScroll = useCallback(
    throttle(() => {
      if (!messagesContainerRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const threshold = 50; // pixels from bottom
      const atBottom = scrollHeight - (scrollTop + clientHeight) < threshold;
      
      setIsAtBottom(atBottom);
    }, 200),
    []
  );

  // Scroll to bottom when new messages arrive and user is at bottom
  useEffect(() => {
    if (isAtBottom && currentMessages.length > prevMessagesLength.current) {
      scrollToBottom();
    }
    prevMessagesLength.current = currentMessages.length;
  }, [currentMessages.length, isAtBottom, scrollToBottom]);

  // Initialize scroll listener
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  // Improved socket event handlers with debouncing
  useEffect(() => {
    const handleNewMessage = throttle((message) => {
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
      
      // Only add if not already in messages
      if (!messages.some(m => m._id === normalizedMessage._id)) {
        dispatch(addSocketMessage(normalizedMessage));
      }
    }, 100);

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
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 2000);
      }
    };

    const handleStopTypingEvent = (senderId) => {
      if (senderId === userId) {
        setIsTyping(false);
        clearTimeout(typingTimeoutRef.current);
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
      clearTimeout(typingTimeoutRef.current);
    };
  }, [userId, dispatch, messages]);

  // Optimized message sending
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if ((!newMessage.trim() && !selectedFile) || !currentChat?._id) return;

    try {
      setIsUploading(true);
      
      const formData = new FormData();
      formData.append("receiver", currentChat._id);
      if (newMessage.trim()) formData.append("content", newMessage);
      if (selectedFile) formData.append("file", selectedFile);

      await dispatch(sendMessage(formData)).unwrap();
      
      setNewMessage("");
      setSelectedFile(null);
      setFilePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      socket.emit("stopTyping", userId);
      
      // Optimistically scroll to bottom
      setTimeout(() => scrollToBottom("auto"), 100);
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsUploading(false);
    }
  };

  // Improved typing indicator with debouncing
  const handleTyping = useCallback(
    debounce((text) => {
      if (!userId) return;

      if (text.trim()) {
        socket.emit("typing", userId);
      } else {
        socket.emit("stopTyping", userId);
      }
    }, 500),
    [userId]
  );

  const onMessageChange = (e) => {
    const text = e.target.value;
    setNewMessage(text);
    handleTyping(text);
  };

  // ... (keep your existing Avatar and MessageBubble components)

  // Optimized message rendering
  const renderMessages = useMemo(() => {
    if (loading && messages.length === 0) {
      return (
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (currentMessages.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <p className="text-lg">No messages yet</p>
          <p className="text-sm mt-1">
            Send a message to start the conversation
          </p>
        </div>
      );
    }

    return (
      <>
        {currentMessages.map((message) => (
          <div
            key={message._id}
            className={`flex ${
              message.sender._id === user._id ? "justify-end" : "justify-start"
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

        {isTyping && (
          <div className="flex justify-start">
            <Avatar
              src={currentChat?.avatar}
              alt={currentChat?.username}
              size="sm"
              className="mr-2 self-end mb-1"
            />
            <div className="flex items-center px-4 py-2 rounded-2xl bg-gray-100 text-gray-800 rounded-tl-none max-w-xs">
              <div className="flex space-x-1 px-2 py-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </>
    );
  }, [loading, messages.length, currentMessages, user._id, isTyping, currentChat]);

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
      {/* Chat header (keep your existing header) */}

      {/* Messages area with improved scrolling */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2"
      >
        {renderMessages}
      </div>

      {/* File preview (keep your existing preview) */}

      {/* Message input (keep your existing input with onChange={onMessageChange}) */}
    </div>
  );
};

export default ChatRoom;