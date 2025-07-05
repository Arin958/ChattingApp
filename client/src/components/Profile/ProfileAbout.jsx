export const ProfileAbout = ({ 
  isEditing, 
  formData, 
  handleInputChange, 
  user 
}) => (
  <div className="bg-white rounded-xl shadow-sm p-6">
    <h2 className="text-xl font-semibold text-gray-800 mb-4">About Me</h2>
    {isEditing ? (
      <textarea 
        name="bio"
        value={formData.bio}
        onChange={handleInputChange}
        placeholder="Tell something about yourself..."
        className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
    ) : (
      <p className="text-gray-600">
        {user?.bio || "No information provided. Tell others about yourself!"}
      </p>
    )}
  </div>
);