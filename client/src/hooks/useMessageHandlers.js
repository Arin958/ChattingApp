import { useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { debounce } from "lodash";
import axios from "axios";
import {
  sendMessage,
  editMessage,
  markMessagesAsSeen,
  addSocketMessage,
  updateMessage,
} from "../Store/message/messageSlice";

export const useMessageHandlers = (userId, currentChat, API) => {
 const dispatch = useDispatch();
  const [newMessage, setNewMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    
    if (!validTypes.includes(file.type)) {
      setSendError('Unsupported file type (only JPEG, PNG, GIF, MP4 allowed)');
      return;
    }
    
    if (file.size > MAX_SIZE) {
      setSendError('File too large (max 10MB)');
      return;
    }

    setSelectedFile(file);

    // Create preview
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setFilePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setSendError(null);
  };

  const handleSendMessage = useCallback(
    async (e) => {
      e.preventDefault();
      setSendError(null);
      
      if ((!newMessage.trim() && !selectedFile) || !currentChat?._id) {
        setSendError("Message cannot be empty");
        return false;
      }

      try {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("receiver", currentChat._id);
        if (newMessage.trim()) formData.append("content", newMessage);
        if (selectedFile) formData.append("file", selectedFile);

        const response = await axios.post(`${API}/api/chat`, formData, {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        dispatch(addSocketMessage(response.data));
        setNewMessage("");
        setSelectedFile(null);
        setFilePreview(null);
        return response.data;
      } catch (err) {
        const errorMsg = err.response?.data?.message || "Failed to send message";
        setSendError(errorMsg);
        return false;
      } finally {
        setIsUploading(false);
      }
    },
    [newMessage, selectedFile, currentChat?._id, dispatch, API]
  );

  const onMessageChange = useCallback((e) => {
    setNewMessage(e.target.value);
    setSendError(null);
  }, []);

 const handleDeleteMessage = useCallback(async (messageId) => {
    try {
        const response = await axios.delete(`${API}/api/chat/${messageId}`, {
            withCredentials: true,
        });
        
        if (response.data.success) {
            // Update the local state with the deleted message
            dispatch(updateMessage({
                id: messageId,
                changes: {
                    deleted: true,
                    content: "This message was deleted",
                    deletedBy: response.data.deletedMessage?.deletedBy || userId
                }
            }));
            
            return {
                success: true,
                message: "Message deleted successfully"
            };
        } else {
            throw new Error(response.data.error || "Failed to delete message");
        }
    } catch (err) {
        console.error("Delete message error:", err.message);
        return {
            success: false,
            error: err.message
        };
    }
}, [API, dispatch]);

  const handleEditMessage = useCallback(
    async (messageId, newContent) => {
      try {
        const response = await axios.put(
          `${API}/api/chat/edit-message/${messageId}`,
          { newContent },
          { withCredentials: true }
        );
        
        dispatch(editMessage({ 
          messageId, 
          newContent,
          updatedAt: response.data.updatedAt 
        }));
        
        return {
          success: true,
          updatedMessage: response.data
        };
      } catch (err) {
        const errorMsg = err.response?.data?.message || "Failed to edit message";
        console.error("Edit message error:", errorMsg);
        return {
          success: false,
          error: errorMsg
        };
      }
    },
    [dispatch, API]
  );

  return {
     newMessage,
    isUploading,
    sendError,
    selectedFile,
    filePreview,
    setNewMessage,
    handleSendMessage,
    onMessageChange,
    handleFileChange,
    handleRemoveFile,
    handleDeleteMessage,
    handleEditMessage,
  };
};