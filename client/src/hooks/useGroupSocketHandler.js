// src/hooks/useGroupSocketHandlers.js
import { useEffect, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { getSocket } from "../socket/socket";
import {
  addMessage,
  updateMessage,
  deleteMessage,
} from "../Store/message/messageSlice";

export const useGroupSocketHandlers = (
  groupId,
  user,
  messages,
  scrollToBottom,
  isAtBottom
) => {
  const dispatch = useDispatch();
  const [isTyping, setIsTyping] = useState(false);
  const [typingMember, setTypingMember] = useState(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  // Handle new group messages
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !groupId) return;

    const handleNewGroupMessage = (message) => {
     const incomingGroupId =
    typeof message.group === "string"
      ? message.group
      : message.group?._id;

  if (incomingGroupId === groupId) {
    dispatch(addMessage(message));
    if (isAtBottom) scrollToBottom();
  }
    };

    const handleMessageEdited = (updatedMessage) => {
      if (updatedMessage.group === groupId) {
        dispatch(updateMessage(updatedMessage));
      }
    };

    const handleMessageDeleted = (deletedMessage) => {
      if (deletedMessage.group === groupId) {
        dispatch(deleteMessage(deletedMessage._id));
      }
    };

    const handleTyping = ({ userId, isTyping, userName }) => {
      if (userId !== user._id) {
        setIsTyping(isTyping);
        setTypingMember(isTyping ? userName : null);
      }
    };

    const handleConnect = () => {
      setIsSocketConnected(true);
      socket.emit("joinGroup", { groupId });
    };

    const handleDisconnect = () => {
      setIsSocketConnected(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("newGroupMessage", handleNewGroupMessage);
    socket.on("messageEdited", handleMessageEdited);
    socket.on("messageDeleted", handleMessageDeleted);
    socket.on("groupTyping", handleTyping);

    // Join the group room
    socket.emit("joinGroup", { groupId });

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("newGroupMessage", handleNewGroupMessage);
      socket.off("messageEdited", handleMessageEdited);
      socket.off("messageDeleted", handleMessageDeleted);
      socket.off("groupTyping", handleTyping);
      socket.emit("leaveGroup", { groupId });
    };
  }, [groupId, user._id, dispatch, scrollToBottom, isAtBottom]);

  // Emit typing events
  const emitTyping = useCallback(
    (typing) => {
      const socket = getSocket();
      if (socket && groupId) {
        socket.emit("groupTyping", {
          groupId,
          isTyping: typing,
          userId: user._id,
          userName: user.name,
        });
      }
    },
    [groupId, user._id, user.name]
  );

  return {
    isTyping,
    typingMember,
    isSocketConnected,
    emitTyping,
  };
};
