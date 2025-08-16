import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const GroupInfoModal = ({ group, members, onlineMembers, onClose, onUpdate }) => {
  console.log(members, "members")
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Modal header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Group Info
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        {/* Group info */}
        <div className="p-4 space-y-4">
          <div className="flex flex-col items-center space-y-2">
            {group.avatar ? (
              <img
                src={group.avatar}
                alt={group.name}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
               {group?.name?.charAt(0) || 'G'}
              </div>
            )}
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {group.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Created on {new Date(group.createdAt).toLocaleDateString()}
            </p>
          </div>
          
          {/* Members section */}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Members ({members.length})
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {members.map(member => (
                <div key={member.user._id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                  <div className="flex items-center space-x-3">
                    {member.user.avatar ? (
                      <img
                        src={member.user.avatar}
                        alt={member.user.name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                        {member?.user?.name?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {member.user.name}
                        {member.user._id === group.createdBy?._id && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 rounded">
                            {member.role}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {onlineMembers.some(m => m.user._id === member.user._id) 
                          ? 'Online' 
                          : 'Offline'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Modal footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupInfoModal;