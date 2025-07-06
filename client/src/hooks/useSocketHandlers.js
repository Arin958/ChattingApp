import { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { getSocket } from "../socket/socket";
import {
  addSocketMessage,
  updateMessage,
  markSeenLocally,
  editMessageLocally,
} from "../Store/message/messageSlice";

export const useSocketHandlers = (
  userId,
  user,
  messages,
  scrollToBottom,
  isAtBottom = true
) => {
  const dispatch = useDispatch();
  const typingTimeoutRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const socketRef = useRef(null);
  const messagesRef = useRef(messages);

  const stopTyping = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit("stopTyping", userId);
    }
    setIsTyping(false);
    clearTimeout(typingTimeoutRef.current);
  }, [userId]);


  
  // Handle incoming new messages - simplified existence check
  const handleNewMessage = useCallback(
    (message) => {
      // Normalize message structure
      const normalizedMessage = {
        ...message,
        sender: typeof message.sender === "string" ? { _id: message.sender } : message.sender,
        receiver: typeof message.receiver === "string" ? { _id: message.receiver } : message.receiver,
        createdAt: message.createdAt || new Date().toISOString(),
      };

      // More lenient duplicate check
      const isDuplicate = messages.some(m => 
  m._id === normalizedMessage._id || 
  (m.content === normalizedMessage.content && 
   Math.abs(new Date(m.createdAt) - new Date(normalizedMessage.createdAt)) < 1000)
);
      if (isDuplicate) return;

      
      dispatch(addSocketMessage(normalizedMessage));

      
      const shouldScroll = 
        normalizedMessage.sender._id === user._id || 
        (normalizedMessage.receiver._id === user._id && isAtBottom);
      
      if (shouldScroll) {
        setTimeout(() => scrollToBottom("auto"), 50);
      }

      // Stop typing indicator if message is from this chat
      if (normalizedMessage.sender._id === userId) {
        stopTyping();
      }
    },
    [dispatch, messages, user._id, userId, isAtBottom, scrollToBottom, stopTyping]
  );

  // Other handlers remain similar but use socketRef.current
  const handleDeletedMessage = useCallback(({ message }) => {
    dispatch(
      updateMessage({
        id: message._id,
        changes: {
          deleted: true,
          content: "This message was deleted",
          deletedAt: message.deletedAt || new Date().toISOString(),
        },
      })
    );
  }, [dispatch]);



  // Setup all socket event listeners
  useEffect(() => {
    if (!user?._id) return;

    // Get or initialize socket
    const socket = getSocket();
    socketRef.current = socket;

    const onConnect = () => {
      setIsSocketConnected(true);
      console.log("Socket connected");
    };

    const onDisconnect = () => {
      setIsSocketConnected(false);
      console.log("Socket disconnected");
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("newMessage", handleNewMessage);
    socket.on("messageDeleted", handleDeletedMessage);
    socket.on("messagesSeen", ({ messageId }) => {
      dispatch(markSeenLocally({ messageId }));
    });
    socket.on("typing", (senderId) => {
      if (senderId === userId) {
        setIsTyping(true);
        scrollToBottom("smooth");
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
      }
    });
    socket.on("stopTyping", (senderId) => {
      if (senderId === userId) setIsTyping(false);
    });
    socket.on("messageEdited", ({ messageId, newContent }) => {
      dispatch(editMessageLocally({ messageId, newContent }));
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("newMessage", handleNewMessage);
      socket.off("messageDeleted", handleDeletedMessage);
      socket.off("typing");
      socket.off("stopTyping");
      socket.off("messageEdited");
      clearTimeout(typingTimeoutRef.current);
    };
  }, [user?._id, userId, dispatch, handleNewMessage, handleDeletedMessage, scrollToBottom]);

  return {
    isTyping,
    isSocketConnected,
    emitTyping: (typing) => {
      if (!socketRef.current) return;
      if (typing) {
        socketRef.current.emit("typing", userId);
      } else {
        socketRef.current.emit("stopTyping", userId);
      }
    },
    stopTyping,
  };
};