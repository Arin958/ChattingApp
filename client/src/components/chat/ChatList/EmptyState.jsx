import React from "react";

const EmptyState = ({ icon, title, description }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      {icon}
      <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
        {title}
      </h3>
      <p className="text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  );
};

export default EmptyState;