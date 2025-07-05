import { FaUserEdit, FaCheck } from "react-icons/fa";

export const ProfileActions = ({ 
  isEditing, 
  loading, 
  setIsEditing, 
  saveProfileChanges, 
  cancelEditing 
}) => (
  <div className="flex space-x-3">
    {isEditing ? (
      <>
        <button 
          onClick={saveProfileChanges}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition flex items-center disabled:opacity-50"
        >
          {loading ? 'Saving...' : (
            <>
              <FaCheck className="mr-2" /> Save
            </>
          )}
        </button>
        <button 
          onClick={cancelEditing}
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
        >
          Cancel
        </button>
      </>
    ) : (
      <button 
        onClick={() => setIsEditing(true)}
        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition flex items-center"
      >
        <FaUserEdit className="mr-2" /> Edit Profile
      </button>
    )}
  </div>
);