import { useState } from 'react';
import { MdPassword } from "react-icons/md";
import { IoMdSettings } from "react-icons/io";
import { FaSignOutAlt } from "react-icons/fa";
import PasswordForm from './PasswordForm'; // Import the PasswordForm component

export const ProfileSidebar = () => {
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  return (
    <div className="space-y-6">
      {/* Password Change Modal */}
      {showPasswordForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Change Password</h2>
            <PasswordForm onCancel={() => setShowPasswordForm(false)} />
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="space-y-3">
          <button 
            onClick={() => setShowPasswordForm(true)}
            className="w-full flex items-center px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-md transition"
          >
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
  );
};