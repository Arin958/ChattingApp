import { useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { debounce } from "lodash";
import axios from "axios";
import {
  sendMessage,
  editMessage,
  markMessagesAsSeen,
} from "../Store/message/messageSlice";

export const useMessageHandlers = (userId, currentChat, API) => {
  const dispatch = useDispatch();
  const [newMessage, setNewMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleSendMessage = useCallback(
    async (e, selectedFile) => {
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
        return true; // Indicate success
      } catch (err) {
        console.error("Failed to send message:", err);
        return false;
      } finally {
        setIsUploading(false);
      }
    },
    [newMessage, currentChat?._id, dispatch]
  );

  const onMessageChange = useCallback((e) => {
    setNewMessage(e.target.value);
    // Note: Typing emission is now handled in the component
  }, []);

  //   const handleTyping = useCallback(
  //     debounce((text, socket) => {
  //       if (!userId) return;
  //       if (text.trim()) {
  //         socket.emit('typing', userId);
  //       } else {
  //         socket.emit('stopTyping', userId);
  //       }
  //     }, 500),
  //     [userId]
  //   );

  const handleDeleteMessage = useCallback(
    async (messageId) => {
      try {
        await axios.delete(`${API}/api/chat/${messageId}`, {
          withCredentials: true,
        });
        return true;
      } catch (err) {
        console.error("Failed to delete message:", err);
        return false;
      }
    },
    [API]
  );

  const handleEditMessage = useCallback(
    async (messageId, newContent) => {
      try {
        await dispatch(editMessage({ messageId, newContent })).unwrap();
        return true;
      } catch (err) {
        console.error("Failed to edit message:", err);
        return false;
      }
    },
    [dispatch]
  );

  return {
    newMessage,
    isUploading,
    setNewMessage,
    handleSendMessage,
    onMessageChange,
    handleDeleteMessage,
    handleEditMessage,
  };
};
