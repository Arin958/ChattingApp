import React from 'react';
import Avatar from './Avatar';
import {
  MagnifyingGlassIcon as SearchIcon,
  EllipsisHorizontalIcon as DotsHorizontalIcon,
} from '@heroicons/react/24/outline';

const ChatHeader = ({ currentChat, isTyping }) => {
  return (
    <div className="flex items-center p-3 border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="flex items-center flex-1">
        <Avatar src={currentChat.avatar} alt={currentChat.username} />
        <div className="ml-3">
          <h3 className="font-semibold text-gray-900">{currentChat.username}</h3>
          <p className="text-xs text-gray-500">
            {isTyping ? (
              <span className="text-blue-500 animate-pulse">typing...</span>
            ) : (
              currentChat.status || 'offline'
            )}
          </p>
        </div>
      </div>
      <div className="flex space-x-2">
        <button className="p-2 rounded-full hover:bg-gray-100">
          <SearchIcon className="w-5 h-5 text-gray-600" />
        </button>
        <button className="p-2 rounded-full hover:bg-gray-100">
          <DotsHorizontalIcon className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;