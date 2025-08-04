import React from "react";
import SearchBar from "./SearchBar";
import DirectMessagesList from "./DirectMessageList";
import GroupChatsList from "./GroupChatList";


const UserListContent = ({
  activeTab,
  searchTerm,
  setSearchTerm,
  friends,
  groups,
  onlineUsers,
}) => {
  return (
    <div className="flex-1 overflow-y-auto">
      <SearchBar
        activeTab={activeTab}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />
      {activeTab === "direct" ? (
        <DirectMessagesList
          friends={friends}
          searchTerm={searchTerm}
          onlineUsers={onlineUsers}
        />
      ) : (
        <GroupChatsList groups={groups} searchTerm={searchTerm} />
      )}
    </div>
  );
};

export default UserListContent;