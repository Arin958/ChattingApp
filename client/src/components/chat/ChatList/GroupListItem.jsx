import React from "react";
import { useNavigate } from "react-router-dom";



const GroupListItem = ({ group }) => {
  const navigate = useNavigate();

  const handleGroupClick = () => {
    navigate(`/group/${group._id}`);
  };

   const formatTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

  return (
    <li
      onClick={handleGroupClick}
      className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
    >
      <div className="relative flex-shrink-0">
        {group.avatar ? (
          <img
            src={group.avatar}
            className="w-12 h-12 rounded-full object-cover"
            alt={group.name}
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
            {group.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="ml-4 flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {group.name}
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {group.members?.length || 0} members
          </span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {group.lastMessage?.content || "No messages yet"}
          </p>
          <span className="text-xs text-gray-400">
            {group.lastMessage
              ? formatTime(group.lastMessage.createdAt)
              : ""}
          </span>
        </div>
      </div>
    </li>
  );
};

export default GroupListItem;