import { FaRegClock } from "react-icons/fa";
import { IoMdSettings } from "react-icons/io";

export const ProfileActivity = ({ user, formatDateSafe, getMemberSince }) => (
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
);