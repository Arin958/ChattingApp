import React from 'react';

const Avatar = ({ src, alt, size = "md", className = "" }) => {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  return (
    <div
      className={`flex-shrink-0 rounded-full overflow-hidden ${sizes[size]} bg-gray-200 flex items-center justify-center ${className}`}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <span className="text-gray-600 font-medium">
          {alt?.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
};

export default Avatar;