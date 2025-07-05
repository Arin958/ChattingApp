import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getMe, updateProfile, resetError } from "../../Store/auth/authSlice";
import { format, isValid, parseISO } from "date-fns";
import { ProfileHeader } from "../../components/Profile/ProfileHeader";
import { ProfileActions } from "../../components/Profile/ProfileActions";
import { ProfileAbout } from "../../components/Profile/ProfileAbout";
import { ProfileActivity } from "../../components/Profile/ProfileActivity";
import { ProfileSidebar } from "../../components/Profile/ProfileSidebar";


const Profile = () => {
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector((state) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [tempAvatar, setTempAvatar] = useState(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    bio: '',
    avatar: null
  });

  const defaultAvatar = "https://www.gravatar.com/avatar/default?s=200&d=mp";
  const statusColor = user?.status === "online" ? "text-green-500" : "text-gray-500";

  useEffect(() => {
    dispatch(getMe());
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        bio: user.bio || '',
        avatar: null
      });
    }
  }, [user]);

  const formatDateSafe = (dateString) => {
    if (!dateString) return "Not available";
    try {
      const date = parseISO(dateString);
      if (isValid(date)) return format(date, "MMMM d, yyyy 'at' h:mm a");
      const fallbackDate = new Date(dateString);
      return isValid(fallbackDate) ? format(fallbackDate, "MMMM d, yyyy 'at' h:mm a") : "Not available";
    } catch (e) {
      return "Not available";
    }
  };

  const getMemberSince = () => {
    if (!user?._id) return "Not available";
    try {
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
      reader.onloadend = () => setTempAvatar(reader.result);
      reader.readAsDataURL(file);
      setFormData(prev => ({ ...prev, avatar: file }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const saveProfileChanges = async () => {
    const data = new FormData();
    if (formData.username !== user.username) data.append('username', formData.username);
    if (formData.email !== user.email) data.append('email', formData.email);
    if (formData.bio !== user.bio) data.append('bio', formData.bio);
    if (formData.avatar) data.append('avatar', formData.avatar);

    try {
      await dispatch(updateProfile(data)).unwrap();
      setIsEditing(false);
      setTempAvatar(null);
      dispatch(resetError());
    } catch (error) {
      // Error is handled by the thunk
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setTempAvatar(null);
    setFormData({
      username: user.username || '',
      email: user.email || '',
      bio: user.bio || '',
      avatar: null
    });
    dispatch(resetError());
  };

  if (loading && !user) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );

  if (error && !user) return (
    <div className="flex justify-center items-center h-screen text-red-500">
      Error loading profile: {error}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
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
          
          <ProfileHeader 
            user={user}
            isEditing={isEditing}
            tempAvatar={tempAvatar}
            defaultAvatar={defaultAvatar}
            statusColor={statusColor}
            formData={formData}
            handleInputChange={handleInputChange}
            handleAvatarChange={handleAvatarChange}
          />
          
          <div className="px-6 pb-4 flex justify-end">
            <ProfileActions 
              isEditing={isEditing}
              loading={loading}
              setIsEditing={setIsEditing}
              saveProfileChanges={saveProfileChanges}
              cancelEditing={cancelEditing}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <ProfileAbout 
              isEditing={isEditing}
              formData={formData}
              handleInputChange={handleInputChange}
              user={user}
            />
            
            <ProfileActivity 
              user={user}
              formatDateSafe={formatDateSafe}
              getMemberSince={getMemberSince}
            />
          </div>

          <ProfileSidebar />
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;