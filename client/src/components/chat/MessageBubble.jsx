import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { EllipsisVerticalIcon, CheckIcon } from '@heroicons/react/24/outline';

const MessageBubble = ({ 
  message, 
  isCurrentUser, 
  onEditMessage, 
  onDeleteMessage 
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const bubbleRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bubbleRef.current && !bubbleRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (message.deleted) {
    return (
      <div className={`italic text-gray-500 p-2 rounded-lg ${
        isCurrentUser ? 'bg-gray-100' : 'bg-gray-100'
      }`}>
        This message was deleted
      </div>
    );
  }

  return (
    <div
      ref={bubbleRef}
      data-message-id={message._id}
      className={`relative group flex ${
        isCurrentUser ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`flex max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${
          isCurrentUser
            ? 'bg-blue-500 text-white rounded-tr-none'
            : 'bg-gray-100 text-gray-800 rounded-tl-none'
        }`}
      >
        <div className="flex-1">
          {!isCurrentUser && (
            <span className="font-semibold text-xs block -mt-1 mb-1">
              {message.sender.username}
            </span>
          )}
          {message.type === 'image' ? (
            <img
              src={message.mediaUrl}
              alt="Sent content"
              className="max-w-full max-h-60 rounded-lg mb-1"
            />
          ) : message.type === 'video' ? (
            <video
              controls
              className="max-w-full max-h-60 rounded-lg mb-1"
              src={message.mediaUrl}
            />
          ) : (
            <p className="break-words">{message.content}</p>
          )}
        </div>
        <div className="flex items-end pl-2 space-x-1">
          <span className="text-xs opacity-70">
            {format(new Date(message.createdAt), 'h:mm a')}
            {message.edited && (
              <span className="ml-1 text-xs opacity-50">(edited)</span>
            )}
          </span>
          {isCurrentUser &&
            (message.seen ? (
              <span className="text-[10px] text-blue-200 font-medium">✓✓</span>
            ) : (
              <CheckIcon className="w-3 h-3 text-blue-200" />
            ))}
        </div>
      </div>

      {isCurrentUser && (
        <div className="absolute -right-2 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 shadow-sm"
          >
            <EllipsisVerticalIcon className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newContent = prompt('Edit your message:', message.content);
                  if (newContent && newContent !== message.content) {
                    onEditMessage(message._id, newContent);
                  }
                  setShowMenu(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Edit Message
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteMessage(message._id);
                  setShowMenu(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100"
              >
                Delete Message
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageBubble;