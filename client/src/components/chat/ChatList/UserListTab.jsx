import React from "react";

const UserListTabs = ({ activeTab, setActiveTab }) => {
  return (
    <div className="flex border-b dark:border-gray-700">
      <TabButton
        label="Direct Messages"
        value="direct"
        activeTab={activeTab}
        onClick={() => setActiveTab("direct")}
      />
      <TabButton
        label="Group Chats"
        value="group"
        activeTab={activeTab}
        onClick={() => setActiveTab("group")}
      />
    </div>
  );
};

const TabButton = ({ label, value, activeTab, onClick }) => {
  const isActive = activeTab === value;
  return (
    <button
      className={`flex-1 py-3 font-medium text-sm ${
        isActive
          ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400"
          : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};

export default UserListTabs;