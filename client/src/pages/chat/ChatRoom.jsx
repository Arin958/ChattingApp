import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { debounce, throttle } from 'lodash';
import { useDispatch, useSelector } from 'react-redux';
import {
  removeMessage,
  markSeenLocally,
  resetMessages,
  fetchMessages,
  markMessagesAsSeen,
  sendMessage,
  addSocketMessage,
  editMessageLocally,
  editMessage,
} from '../../Store/message/messageSlice';
import socket from '../../socket/socket';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';

import ChatHeader from '../../components/chat/ChatHeader';
import MessageList from '../../components/chat/MessageList';
import MessageInput from '../../components/chat/MessageInput';

const API = import.meta.env.VITE_API_URL;

const ChatRoom = () => {
  const dispatch = useDispatch();
  const { messages, loading } = useSelector((state) => state.message);
  const { user } = useSelector((state) => state.auth);
  const { userId } = useParams();

  // Refs
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const prevMessagesLength = useRef(0);

  // State
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentChat, setCurrentChat] = useState(null);
  const [loadingChat, setLoadingChat] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  // Fetch chat data
  const fetchChatData = useCallback(async () => {
    if (!userId) return;

    try {
      setLoadingChat(true);
      dispatch(resetMessages());

      if (!socket.connected) {
        await new Promise((resolve) => {
          const checkConnection = () => {
            if (socket.connected) {
              resolve();
            } else {
              setTimeout(checkConnection, 100);
            }
          };
          checkConnection();
        });
      }

      const [userRes] = await Promise.all([
        axios.get(`${API}/api/get-users/${userId}`, {
          withCredentials: true,
        }),
        dispatch(fetchMessages(userId)),
      ]);

      setCurrentChat(userRes.data);
    } catch (err) {
      console.error('Error fetching chat data:', err);
    } finally {
      setLoadingChat(false);
    }
  }, [userId, dispatch]);

  // Socket connection handlers
  useEffect(() => {
    const handleConnect = () => setIsSocketConnected(true);
    const handleDisconnect = () => setIsSocketConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, []);

  // Initialize chat
  useEffect(() => {
    fetchChatData();
    return () => {
      socket.emit('stopTyping', userId);
    };
  }, [fetchChatData, userId]);

  // Filter and sort messages
  const currentMessages = useMemo(() => {
    return messages
      .filter(
        (msg) =>
          (msg.sender._id === userId && msg.receiver._id === user._id) ||
          (msg.sender._id === user._id && msg.receiver._id === userId)
      )
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [messages, userId, user._id]);

  // Scroll handling
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({
      behavior,
      block: 'end',
    });
  }, []);

  const handleScroll = useCallback(
    throttle(() => {
      if (!messagesContainerRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } =
        messagesContainerRef.current;
      const threshold = 50;
      const atBottom = scrollHeight - (scrollTop + clientHeight) < threshold;

      setIsAtBottom(atBottom);
    }, 200),
    []
  );

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Message seen handling
  const handleMessageSeen = useCallback(
    debounce(async (messageId) => {
      const message = messages.find((m) => m._id === messageId);
      if (!message || message.seen || message.sender._id === user._id) return;

      try {
        await dispatch(markMessagesAsSeen(messageId)).unwrap();
      } catch (err) {
        console.error('Error marking message as seen:', err);
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
      { threshold: 0.5, rootMargin: '0px 0px -100px 0px' }
    );

    const currentMessageElements =
      document.querySelectorAll('[data-message-id]');
    currentMessageElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [messages, user._id, handleMessageSeen]);

  // Socket event handlers
  useEffect(() => {
    const handleNewMessage = (message) => {
      const normalizedMessage = {
        ...message,
        sender: typeof message.sender === 'object' ? message.sender : { _id: message.sender },
        receiver: typeof message.receiver === 'object' ? message.receiver : { _id: message.receiver },
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
        dispatch(addSocketMessage(normalizedMessage));
        if (normalizedMessage.sender._id === user._id) {
          setTimeout(() => scrollToBottom('auto'), 50);
        }
      }
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

    const handleMessageEdited = ({ messageId, newContent }) => {
      dispatch(editMessageLocally({ messageId, newContent }));
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('messageEdited', handleMessageEdited);
    socket.on('messageDeleted', handleDeletedMessage);
    socket.on('messagesSeen', handleMessagesSeen);
    socket.on('typing', handleTypingEvent);
    socket.on('stopTyping', handleStopTypingEvent);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('messageEdited', handleMessageEdited);
      socket.off('messageDeleted', handleDeletedMessage);
      socket.off('messagesSeen', handleMessagesSeen);
      socket.off('typing', handleTypingEvent);
      socket.off('stopTyping', handleStopTypingEvent);
      clearTimeout(typingTimeoutRef.current);
    };
  }, [userId, dispatch, messages, user._id, scrollToBottom]);

  // File handling
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setFilePreview(reader.result);
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      setFilePreview('video');
    } else {
      setFilePreview('file');
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
  };

  // Message handling
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !currentChat?._id) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('receiver', currentChat._id);
      if (newMessage.trim()) formData.append('content', newMessage);
      if (selectedFile) formData.append('file', selectedFile);

      await dispatch(sendMessage(formData)).unwrap();

      setNewMessage('');
      removeSelectedFile();
      socket.emit('stopTyping', userId);
      setTimeout(() => scrollToBottom('auto'), 100);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleTyping = useCallback(
    debounce((text) => {
      if (!userId) return;
      if (text.trim()) {
        socket.emit('typing', userId);
      } else {
        socket.emit('stopTyping', userId);
      }
    }, 500),
    [userId]
  );

  const onMessageChange = (e) => {
    const text = e.target.value;
    setNewMessage(text);
    handleTyping(text);
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await axios.delete(`${API}/api/chat/${messageId}`, {
        withCredentials: true,
      });
      dispatch(removeMessage(messageId));
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  const handleEditMessage = async (messageId, newContent) => {
    try {
      await dispatch(editMessage({ messageId, newContent })).unwrap();
    } catch (err) {
      console.error('Failed to edit message:', err);
    }
  };

  // Loading states
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
      <ChatHeader currentChat={currentChat} isTyping={isTyping} />

      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2"
      >
        {loading && messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <MessageList
            messages={currentMessages}
            currentUser={user}
            isTyping={isTyping}
            currentChat={currentChat}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
            messagesEndRef={messagesEndRef}
          />
        )}
      </div>

      <MessageInput
        newMessage={newMessage}
        selectedFile={selectedFile}
        filePreview={filePreview}
        isUploading={isUploading}
        onMessageChange={onMessageChange}
        onFileChange={handleFileChange}
        onRemoveFile={removeSelectedFile}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
};

export default ChatRoom;