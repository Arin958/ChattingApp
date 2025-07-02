import React, { useRef, useEffect } from 'react';
import Avatar from './Avatar';
import MessageBubble from './MessageBubble';

const MessageList = ({
  messages,
  currentUser,
  isTyping,
  currentChat,
  onEditMessage,
  onDeleteMessage,
  messagesEndRef,
  messagesContainerRef,
  isAtBottom,
  scrollToBottom
}) => {
  const prevMessagesLength = useRef(0);

  useEffect(() => {
    if (isAtBottom && messages.length > prevMessagesLength.current) {
      scrollToBottom();
    }
    prevMessagesLength.current = messages.length;
  }, [messages.length, isAtBottom, scrollToBottom]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <p className="text-lg">No messages yet</p>
        <p className="text-sm mt-1">Send a message to start the conversation</p>
      </div>
    );
  }

  return (
    <>
      {messages.map((message) => (
        <div
          key={message._id}
          className={`flex ${
            message.sender._id === currentUser._id ? 'justify-end' : 'justify-start'
          }`}
        >
          {message.sender._id !== currentUser._id && (
            <Avatar
              src={message.sender.avatar}
              alt={message.sender.username}
              size="sm"
              className="mr-2 self-end mb-1"
            />
          )}
          <MessageBubble
            message={message}
            isCurrentUser={message.sender._id === currentUser._id}
            onEditMessage={onEditMessage}
            onDeleteMessage={onDeleteMessage}
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
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </>
  );
};

export default MessageList;