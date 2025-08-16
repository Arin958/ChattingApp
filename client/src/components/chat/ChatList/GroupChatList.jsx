import React from "react";
import GroupListItem from "./GroupListItem";
import EmptyState from "./EmptyState";
import { UsersIcon } from "@heroicons/react/24/outline";

const GroupChatsList = ({ groups, searchTerm }) => {
  const filteredGroups = groups
    .filter((group) =>
      group.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  if (filteredGroups.length === 0) {
    return (
      <EmptyState
        icon={<UsersIcon className="h-16 w-16 text-gray-400 mb-4" />}
        title="No groups found"
        description={
          searchTerm ? "Try a different search term" : "No groups available"
        }
      />
    );
  }

  return (
    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
      {filteredGroups.map((group) => (
        <GroupListItem key={group._id} group={group} />
      ))}
    </ul>
  );
};

export default GroupChatsList;