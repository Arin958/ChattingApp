import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getMe } from "../../Store/auth/authSlice";
import { FaCircle, FaUserEdit, FaSignOutAlt, FaCamera, FaCheck, FaRegClock } from "react-icons/fa";
import { IoMdMail, IoMdSettings } from "react-icons/io";
import { MdPassword } from "react-icons/md";
import { format, isValid, parseISO } from "date-fns";

const Profile = () => {
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector((state) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [tempAvatar, setTempAvatar] = useState(null);

  // Default avatar URL
  const defaultAvatar = "https://www.gravatar.com/avatar/default?s=200&d=mp";

  useEffect(() => {
    dispatch(getMe());
  }, [dispatch]);

  const statusColor = user?.status === "online" ? "text-green-500" : "text-gray-500";

  // Safe date formatting with validation
  const formatDateSafe = (dateString) => {
    if (!dateString) return "Not available";
    
    try {
      // Try parsing as ISO string first
      const date = parseISO(dateString);
      if (isValid(date)) return format(date, "MMMM d, yyyy 'at' h:mm a");
      
      // If ISO parsing fails, try regular Date parsing
      const fallbackDate = new Date(dateString);
      return isValid(fallbackDate) ? format(fallbackDate, "MMMM d, yyyy 'at' h:mm a") : "Not available";
    } catch (e) {
      return "Not available";
    }
  };

  // Safe member since date from MongoDB _id
  const getMemberSince = () => {
    if (!user?._id) return "Not available";
    
    try {
      // Extract timestamp from MongoDB _id (first 4 bytes)
      const timestamp = parseInt(user._id.substring(0, 8), 16) * 1000;
      const date = new Date(timestamp);
      return isValid(date) ? format(date, "MMMM d, yyyy") : "Not available";
    } catch (e) {
      return "Not available";
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfileChanges = () => {
    setIsEditing(false);
    setTempAvatar(null);
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );

  if (error) return (
    <div className="flex justify-center items-center h-screen text-red-500">
      Error loading profile: {error}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="relative h-48 bg-gradient-to-r from-indigo-500 to-purple-600">
            {isEditing && (
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                <button className="px-4 py-2 bg-white text-indigo-600 rounded-md font-medium">
                  Change Cover Photo
                </button>
              </div>
            )}
          </div>
          
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
                    defaultValue={user?.username || ""} 
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
                      defaultValue={user?.email || ""} 
                      className="bg-gray-100 px-2 py-1 rounded text-gray-700"
                    />
                  ) : (
                    <span>{user?.email || "No email"}</span>
                  )}
                </div>
              </div>
              
              <div className="flex space-x-3">
                {isEditing ? (
                  <button 
                    onClick={saveProfileChanges}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition flex items-center"
                  >
                    <FaCheck className="mr-2" /> Save
                  </button>
                ) : (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition flex items-center"
                  >
                    <FaUserEdit className="mr-2" /> Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Profile Info */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">About Me</h2>
              {isEditing ? (
                <textarea 
                  placeholder="Tell something about yourself..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  defaultValue={user?.bio || ""}
                />
              ) : (
                <p className="text-gray-600">
                  {user?.bio || "No information provided. Tell others about yourself!"}
                </p>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Activity</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-indigo-100 p-3 rounded-full mr-4">
                    <FaRegClock className="text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700">Last Active</h3>
                    <p className="text-gray-500">{formatDateSafe(user?.lastSeen)}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-indigo-100 p-3 rounded-full mr-4">
                    <IoMdSettings className="text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700">Account Created</h3>
                    <p className="text-gray-500">{getMemberSince()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button className="w-full flex items-center px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-md transition">
                  <MdPassword className="text-indigo-600 mr-3 text-lg" />
                  <span>Change Password</span>
                </button>
                <button className="w-full flex items-center px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-md transition">
                  <IoMdSettings className="text-indigo-600 mr-3 text-lg" />
                  <span>Account Settings</span>
                </button>
                <button className="w-full flex items-center px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-md text-red-500 transition">
                  <FaSignOutAlt className="mr-3 text-lg" />
                  <span>Logout</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Statistics</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-indigo-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-indigo-600">24</p>
                  <p className="text-sm text-gray-600">Friends</p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-indigo-600">156</p>
                  <p className="text-sm text-gray-600">Posts</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;