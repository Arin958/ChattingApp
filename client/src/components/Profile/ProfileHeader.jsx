import { FaCircle, FaCamera } from "react-icons/fa";
import { IoMdMail } from "react-icons/io";

export const ProfileHeader = ({ 
  user, 
  isEditing, 
  tempAvatar, 
  defaultAvatar, 
  statusColor, 
  formData, 
  handleInputChange, 
  handleAvatarChange 
}) => (
  <div className="px-6 py-4 relative">
    <div className="absolute -top-16 left-6">
      <div className="relative group">
        <img 
          src={tempAvatar || user?.avatar || defaultAvatar} 
          alt={user?.username || "User"} 
          className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-lg"
        />
        {isEditing && (
          <>
            <label htmlFor="avatar-upload" className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition">
              <FaCamera className="text-white text-2xl" />
            </label>
            <input 
              id="avatar-upload" 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleAvatarChange}
            />
          </>
        )}
        <FaCircle className={`absolute bottom-2 right-2 text-xl ${statusColor} bg-white rounded-full`} />
      </div>
    </div>
    
    <div className="ml-40 pt-4 flex justify-between items-start">
      <div>
        {isEditing ? (
          <input 
            type="text" 
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            className="text-3xl font-bold text-gray-800 bg-gray-100 px-3 py-1 rounded"
          />
        ) : (
          <h1 className="text-3xl font-bold text-gray-800 capitalize">
            {user?.username || "User"}
          </h1>
        )}
        <div className="flex items-center text-gray-600 mt-1">
          <IoMdMail className="mr-2" />
          {isEditing ? (
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="bg-gray-100 px-2 py-1 rounded text-gray-700"
            />
          ) : (
            <span>{user?.email || "No email"}</span>
          )}
        </div>
      </div>
    </div>
  </div>
);