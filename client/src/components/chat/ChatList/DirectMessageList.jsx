import React from "react";
import UserListItem from "./UserListItem";
import EmptyState from "./EmptyState";

const DirectMessagesList = ({ friends, searchTerm, onlineUsers }) => {
  const filteredUsers = friends
    .filter((user) =>
      user.username?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .map((user) => ({
      ...user,
      status: onlineUsers.includes(user._id) ? "online" : "offline",
    }));

  if (filteredUsers.length === 0) {
    return (
      <EmptyState
        icon={
          <svg
            className="h-16 w-16 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        }
        title="No users found"
        description={
          searchTerm ? "Try a different search term" : "No users available"
        }
      />
    );
  }

  return (
    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
      {filteredUsers.map((user) => (
        <UserListItem key={user._id} user={user} />
      ))}
    </ul>
  );
};

export default DirectMessagesList;