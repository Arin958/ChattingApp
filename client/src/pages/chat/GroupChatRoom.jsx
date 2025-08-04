// src/pages/group/GroupChatRoom.jsx
import React, { useMemo, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import { initializeSocket, getSocket } from "../../socket/socket";
import { useGroupData } from "../../hooks/useGroupData";
import { useGroupSocketHandlers } from "../../hooks/useGroupSocketHandler";
import { useGroupMessageHandlers } from "../../hooks/useGroupMessageHandlers";
import { useScrollHandling } from "../../hooks/useScrollHandling";

import GroupChatHeader from "../../components/chat/ChatList/GroupChatHeader";
import MessageList from "../../components/chat/MessageList";
import MessageInput from "../../components/chat/MessageInput";
import { fetchGroupMessages } from "../../Store/message/messageSlice";

const API = import.meta.env.VITE_API_URL;

const GroupChatRoom = () => {
  const dispatch = useDispatch();
  const { messages, loading } = useSelector((state) => state.message);
  const { user } = useSelector((state) => state.auth);
  const { groupId } = useParams();
  const prevMessagesLength = useRef(0);

  useEffect(() => {
    dispatch(fetchGroupMessages({ groupId })).then((action) => {
      if (fetchGroupMessages.fulfilled.match(action)) {
        console.log('Fetched messages:', action.payload);
      }
    });
  }, [dispatch, groupId]);

  // Initialize socket once on mount
  useEffect(() => {
    initializeSocket();
  }, []);

  // Custom hooks
  const { currentGroup, loadingGroup, members } = useGroupData(API, groupId);
  const { messagesEndRef, messagesContainerRef, isAtBottom, scrollToBottom } =
    useScrollHandling();

  const { 
    isTyping, 
    typingMember, 
    isSocketConnected, 
    emitTyping 
  } = useGroupSocketHandlers(
    groupId,
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
  } = useGroupMessageHandlers(groupId, currentGroup, API, scrollToBottom);

  // Filter and sort messages relevant to this group
  const groupMessages = useMemo(() => {
    const filtered = messages.filter((msg) => {
      return (
        (msg.group && (msg.group._id === groupId || msg.group === groupId)) ||
        msg.groupId === groupId
      );
    });
    return filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [messages, groupId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (groupMessages.length > prevMessagesLength.current) {
      // New messages arrived
      scrollToBottom();
    }
    prevMessagesLength.current = groupMessages.length;
  }, [groupMessages.length, scrollToBottom]);

  // Enhanced message change handler with typing indicators
  const handleMessageChange = (e) => {
    const text = e.target.value;
    onMessageChange(e);
    emitTyping(text.trim().length > 0);
  };

  if (loadingGroup) {
    return <LoadingSpinner />;
  }

  if (!currentGroup) {
    return <GroupNotFound />;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <GroupChatHeader
        currentGroup={currentGroup}
        members={members}
        isTyping={isTyping}
        typingMember={typingMember}
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
            messages={groupMessages}
            currentUser={user}
            isTyping={isTyping}
            currentChat={currentGroup}
            members={members}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
            messagesEndRef={messagesEndRef}
            isGroupChat={true}
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
        onSendMessage={(e) => {
          handleSendMessage(e);
          scrollToBottom(); // Scroll after sending
        }}
        disabled={!currentGroup}
      />
    </div>
  );
};

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

const GroupNotFound = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center p-6 max-w-md">
      <h3 className="text-xl font-medium text-gray-700 mb-2">Group not found</h3>
      <p className="text-gray-500">
        The group you're trying to access doesn't exist or you don't have permission
      </p>
    </div>
  </div>
);

export default GroupChatRoom;