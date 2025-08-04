// src/components/group/GroupChatHeader.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EllipsisVerticalIcon, ArrowLeftIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import GroupInfoModal from './GroupInfoModal';
import MemberAvatars from './MemberAvatars';

const GroupChatHeader = ({ 
  currentGroup, 
  members, 
  isTyping, 
  typingMember,
  isSocketConnected,
  onUpdateGroup
}) => {
  const navigate = useNavigate();
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  
  // Filter online members
  const onlineMembers = members.filter(member => 
    member.user?.socketId && member.user._id !== currentGroup?.createdBy?._id
  );

  // Handle back navigation
  const handleBack = () => {
    navigate(-1); // Or to a specific route like '/groups'
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 p-3 flex items-center justify-between bg-white dark:bg-gray-800">
      {/* Left section - Back button and group info */}
      <div className="flex items-center space-x-3">
        <button 
          onClick={handleBack}
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>

        {currentGroup?.avatar ? (
          <img
            src={currentGroup.avatar}
            alt={currentGroup.name}
            className="w-10 h-10 rounded-full object-cover cursor-pointer"
            onClick={() => setIsInfoOpen(true)}
          />
        ) : (
          <div 
            className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold cursor-pointer"
            onClick={() => setIsInfoOpen(true)}
          >
            {currentGroup?.name?.charAt(0) || 'G'}
          </div>
        )}

        <div className="flex flex-col">
          <h2 className="font-medium text-gray-900 dark:text-white">
            {currentGroup?.name || 'Group Chat'}
          </h2>
          
          <div className="flex items-center space-x-1">
            {isTyping && typingMember ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                <span className="font-medium">{typingMember}</span> is typing...
              </p>
            ) : (
              <>
                <UserGroupIcon className="h-3 w-3 text-gray-400" />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {members.length} member{members.length !== 1 ? 's' : ''}
                  {onlineMembers.length > 0 && ` • ${onlineMembers.length} online`}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right section - Status and actions */}
      <div className="flex items-center space-x-2">
        {/* Online status indicator */}
        <div 
          className={`h-3 w-3 rounded-full ${isSocketConnected ? 'bg-green-500' : 'bg-gray-400'}`}
          title={isSocketConnected ? 'Connected' : 'Disconnected'}
        />
        
        {/* Member avatars preview */}
        <MemberAvatars 
          members={onlineMembers.slice(0, 3)} 
          totalMembers={members.length}
          onClick={() => setIsInfoOpen(true)}
        />
        
        {/* Group actions menu */}
        <button 
          onClick={() => setIsInfoOpen(true)}
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <EllipsisVerticalIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* Group info modal */}
      {isInfoOpen && currentGroup && (
        <GroupInfoModal
          group={currentGroup}
          members={members}
          onlineMembers={onlineMembers}
          onClose={() => setIsInfoOpen(false)}
          onUpdate={onUpdateGroup}
        />
      )}
    </div>
  );
};

export default GroupChatHeader;