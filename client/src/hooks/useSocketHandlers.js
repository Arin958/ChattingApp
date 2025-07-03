import { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import socket from "../socket/socket";
import {
  addSocketMessage,
  removeMessage,
  markSeenLocally,
  editMessageLocally,
  markMessageAsDeleted,
  updateMessage,
} from "../Store/message/messageSlice";

export const useSocketHandlers = (userId, user, messages, scrollToBottom) => {
  const dispatch = useDispatch();
  const typingTimeoutRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  const stopTyping = useCallback(() => {
    socket.emit("stopTyping", userId);
    setIsTyping(false);
    clearTimeout(typingTimeoutRef.current);
  }, [userId]);

  // Handle incoming new messages
  const handleNewMessage = useCallback(
    (message) => {
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
        createdAt: message.createdAt || new Date().toISOString(),
      };

      const exists = messages.some(
        (m) =>
          m._id === normalizedMessage._id ||
          (m.content === normalizedMessage.content &&
            new Date(m.createdAt).getTime() ===
              new Date(normalizedMessage.createdAt).getTime())
      );

      if (!exists) {
        // Stop typing when a new message arrives from this user
        if (normalizedMessage.sender._id === userId) {
          stopTyping();
        }

        dispatch(addSocketMessage(normalizedMessage));
        if (normalizedMessage.sender._id === user._id) {
          setTimeout(() => scrollToBottom("auto"), 50);
        }
      }
    },
    [dispatch, messages, user._id, scrollToBottom, userId, stopTyping]
  );

  // Handle deleted messages
  const handleDeletedMessage = useCallback(
    (socketResponse) => {
      try {
        // Validate response structure
        if (!socketResponse?.message?._id) {
          console.warn("Invalid deletion payload:", socketResponse);
          return;
        }

        const { _id, deleted, deletedBy, deletedAt, content } =
          socketResponse.message;

        dispatch(
          updateMessage({
            id: _id,
            changes: {
              deleted: deleted !== undefined ? deleted : true,
              deletedBy: deletedBy || null,
              deletedAt: deletedAt || new Date().toISOString(),
              content: content || "This message was deleted",
            },
          })
        );
      } catch (err) {
        console.error("Error processing deleted message:", err);
      }
    },
    [dispatch]
  );

  // Handle message seen updates
  const handleMessagesSeen = useCallback(
    ({ messageId, seenAt }) => {
      dispatch(
        markSeenLocally({
          messageId,
          seenAt: seenAt || new Date().toISOString(),
        })
      );
    },
    [dispatch]
  );

  // Handle typing indicators
  const handleTypingEvent = useCallback(
    (senderId) => {
      if (senderId === userId) {
        setIsTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 2000);
      }
    },
    [userId]
  );

  // Handle stop typing indicators
  const handleStopTypingEvent = useCallback(
    (senderId) => {
      if (senderId === userId) {
        setIsTyping(false);
        clearTimeout(typingTimeoutRef.current);
      }
    },
    [userId]
  );

  // Handle edited messages
  const handleMessageEdited = useCallback(
    ({ messageId, newContent }) => {
      dispatch(editMessageLocally({ messageId, newContent }));
    },
    [dispatch]
  );

  // Handle connection status
  const handleConnect = useCallback(() => {
    setIsSocketConnected(true);
    console.log("Socket connected");
  }, []);

  const handleDisconnect = useCallback(() => {
    setIsSocketConnected(false);
    console.log("Socket disconnected");
  }, []);

  // Setup all socket event listeners
  useEffect(() => {
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("newMessage", handleNewMessage);
    socket.on("messageDeleted", handleDeletedMessage);
    socket.on("messagesSeen", handleMessagesSeen);
    socket.on("typing", handleTypingEvent);
    socket.on("stopTyping", handleStopTypingEvent);
    socket.on("messageEdited", handleMessageEdited);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("newMessage", handleNewMessage);
      socket.off("messageDeleted", handleDeletedMessage);
      socket.off("messagesSeen", handleMessagesSeen);
      socket.off("typing", handleTypingEvent);
      socket.off("stopTyping", handleStopTypingEvent);
      socket.off("messageEdited", handleMessageEdited);
      clearTimeout(typingTimeoutRef.current);
    };
  }, [
    handleConnect,
    handleDisconnect,
    handleNewMessage,
    handleDeletedMessage,
    handleMessagesSeen,
    handleTypingEvent,
    handleStopTypingEvent,
    handleMessageEdited,
  ]);

  return {
    isTyping,
    isSocketConnected,
    emitTyping: (isTyping) => {
      if (isTyping) {
        socket.emit("typing", userId);
      } else {
        socket.emit("stopTyping", userId);
      }
    },
    stopTyping,
  };
};
