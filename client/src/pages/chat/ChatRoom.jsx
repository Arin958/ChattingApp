// src/pages/chat/ChatRoom.jsx
import React, { useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import { initializeSocket, getSocket } from "../../socket/socket";

import { useChatData } from "../../hooks/useChatData";
import { useSocketHandlers } from "../../hooks/useSocketHandlers";
import { useMessageHandlers } from "../../hooks/useMessageHandlers";
import { useScrollHandling } from "../../hooks/useScrollHandling";
import { useMessageVisibility } from "../../hooks/useMessageVisibility";

import ChatHeader from "../../components/chat/ChatHeader";
import MessageList from "../../components/chat/MessageList";
import MessageInput from "../../components/chat/MessageInput";

const API = import.meta.env.VITE_API_URL;

const ChatRoom = () => {
  const { messages, loading } = useSelector((state) => state.message);
  const { user } = useSelector((state) => state.auth);
  const { userId } = useParams();

  // Initialize socket once on mount
  useEffect(() => {
    initializeSocket();
  }, []);

  // Custom hooks
  const { currentChat, loadingChat } = useChatData(API);
  const { messagesEndRef, messagesContainerRef, isAtBottom, scrollToBottom } =
    useScrollHandling();

  const { isTyping, isSocketConnected, emitTyping } = useSocketHandlers(
    userId,
    user,
    messages,
    scrollToBottom,
    isAtBottom
  );

  const {
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
  } = useMessageHandlers(userId, currentChat, API);

  const { handleMessageSeen } = useMessageVisibility(user, messages);

  // Enhanced message change handler with typing indicators
  const handleMessageChange = (e) => {
    const text = e.target.value;
    onMessageChange(e); // handles updating message state
    emitTyping(text.trim().length > 0); // emits typing indicator
  };

  // Filter and sort messages relevant to this chat
 const currentMessages = useMemo(() => {
  return messages
    .filter(msg => msg?.sender?._id && msg?.receiver?._id)
    .filter(
      (msg) =>
        (msg.sender._id === userId && msg.receiver._id === user._id) ||
        (msg.sender._id === user._id && msg.receiver._id === userId)
    )
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}, [messages, userId, user._id]);

  if (loadingChat) {
    return <LoadingSpinner />;
  }

  if (!currentChat) {
    return <ChatNotFound />;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <ChatHeader
        currentChat={currentChat}
        isTyping={isTyping}
        isSocketConnected={isSocketConnected}
      />

      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2"
      >
        {loading && messages.length === 0 ? (
          <LoadingSpinner />
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
        isUploading={isUploading}
        sendError={sendError}
        selectedFile={selectedFile}
        filePreview={filePreview}
        onMessageChange={handleMessageChange}
        onFileChange={handleFileChange}
        onRemoveFile={handleRemoveFile}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
};

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

const ChatNotFound = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center p-6 max-w-md">
      <h3 className="text-xl font-medium text-gray-700 mb-2">Chat not found</h3>
      <p className="text-gray-500">
        The user you're trying to chat with doesn't exist or you don't have permission
      </p>
    </div>
  </div>
);

export default ChatRoom;
