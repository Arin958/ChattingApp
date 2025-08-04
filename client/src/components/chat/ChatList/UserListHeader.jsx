import React from "react";

const UserListHeader = ({ title }) => {
  return (
    <div className="p-4 border-b dark:border-gray-700">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
        {title}
      </h1>
    </div>
  );
};

export default UserListHeader;