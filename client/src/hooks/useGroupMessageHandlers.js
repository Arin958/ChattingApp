import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { sendMessage, deleteMessage, editMessage } from '../Store/message/messageSlice';
import { toast } from 'react-toastify';

export const useGroupMessageHandlers = (groupId, currentGroup) => {
  const dispatch = useDispatch();
  const [newMessage, setNewMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const onMessageChange = useCallback((e) => {
    setNewMessage(e.target.value);
    setSendError(null);
  }, []);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setSendError('File size cannot exceed 10MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
    if (!allowedTypes.includes(file.type)) {
      setSendError('Only JPEG, PNG, GIF images and MP4 videos are allowed');
      return;
    }

    setSelectedFile(file);
    setFilePreview(URL.createObjectURL(file));
    setSendError(null);
  }, []);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(null);
  }, [filePreview]);

  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();

    if (!newMessage.trim() && !selectedFile) {
      setSendError('Message cannot be empty');
      return;
    }

    const formData = new FormData();
    formData.append('groupId', groupId);
    if (newMessage.trim()) formData.append('content', newMessage);
    if (selectedFile) formData.append('file', selectedFile);

    try {
      setIsUploading(true);
      await dispatch(sendMessage(formData)).unwrap(); // Thunk handles API & state
      setNewMessage('');
      handleRemoveFile();
      setSendError(null);
    } catch (error) {
      console.error('Error sending message:', error);
      setSendError(error?.message || 'Failed to send message');
    } finally {
      setIsUploading(false);
    }
  }, [dispatch, newMessage, selectedFile, groupId, handleRemoveFile]);

  const handleDeleteMessage = useCallback(async (messageId) => {
    try {
      await dispatch(deleteMessage(messageId)).unwrap();
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error(error?.message || 'Failed to delete message');
    }
  }, [dispatch]);

  const handleEditMessage = useCallback(async (messageId, newContent) => {
    try {
      await dispatch(editMessage({ messageId, newContent })).unwrap();
    } catch (error) {
      console.error('Error editing message:', error);
      toast.error(error?.message || 'Failed to edit message');
    }
  }, [dispatch]);

  return {
    newMessage,
    isUploading,
    sendError,
    selectedFile,
    filePreview,
    handleSendMessage,
    onMessageChange,
    handleFileChange,
    handleRemoveFile,
    handleDeleteMessage,
    handleEditMessage,
  };
};
