import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaUserPlus, FaUserTimes, FaUserCheck } from "react-icons/fa";
import {
  sendFriendRequest,
  cancelFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
} from "../../../Store/User/friendSlice";

import { getSocket } from "../../../socket/socket";

const API = import.meta.env.VITE_API_URL;

const UserListItem = ({ user }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { actionLoading } = useSelector((state) => state.users);

    const formatTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

  const handleUserClick = async (userId) => {
    try {
      await axios.get(`${API}/api/chat/${userId}`, { withCredentials: true });

      const socket = getSocket();
      socket?.emit("markMessagesSeen", { userId });

      const needsRefresh = sessionStorage.getItem("justOpenedChat");
      navigate(`/chats/${userId}`);

      if (needsRefresh) {
        sessionStorage.removeItem("justOpenedChat");
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    } catch (err) {
      console.error("Open chat error:", err.message);
    }
  };

  const handleSendRequest = (e, receiverId) => {
    e.stopPropagation();
    dispatch(sendFriendRequest({ receiverId }));
  };

  const handleCancelRequest = (e, requestId) => {
    e.stopPropagation();
    dispatch(cancelFriendRequest(requestId));
  };

  const handleAcceptRequest = (e, requestId) => {
    e.stopPropagation();
    dispatch(acceptFriendRequest(requestId));
  };

  const handleRejectRequest = (e, requestId) => {
    e.stopPropagation();
    dispatch(rejectFriendRequest(requestId));
  };

  return (
    <li
      onClick={() => handleUserClick(user._id)}
      className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
    >
      <div className="relative flex-shrink-0">
        <img
          src={user.avatar}
          className="w-12 h-12 rounded-full object-cover"
          alt={user.username}
        />
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
            user.status === "online" ? "bg-green-500" : "bg-gray-400"
          }`}
        ></span>
      </div>
      <div className="ml-4 flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {user.username}
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {user.status === "online" ? "Online" : "Offline"}
          </span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {user.privacySettings?.profileVisibility === "private"
              ? "Private profile"
              : user.status === "online"
              ? "Active now"
              : `Last seen ${formatTime(user.lastSeen)}`}
          </p>
          <div className="flex space-x-2">
            {user.isFriend ? (
              <button
                className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center"
                disabled
              >
                <FaUserCheck className="mr-1" /> Friends
              </button>
            ) : user.requestStatus === "request_sent" ? (
              <button
                className={`px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center ${
                  actionLoading ? "opacity-70" : "hover:bg-red-200"
                }`}
                onClick={(e) => handleCancelRequest(e, user.requestId)}
                disabled={actionLoading}
              >
                <FaUserTimes className="mr-1" /> Cancel
              </button>
            ) : user.requestStatus === "request_received" ? (
              <div className="flex space-x-1">
                <button
                  className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center"
                  onClick={(e) => handleAcceptRequest(e, user.requestId)}
                  disabled={actionLoading}
                >
                  Accept
                </button>
                <button
                  className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center"
                  onClick={(e) => handleRejectRequest(e, user.requestId)}
                  disabled={actionLoading}
                >
                  Reject
                </button>
              </div>
            ) : (
              <button
                className={`px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center ${
                  actionLoading || !user.canSendRequest
                    ? "opacity-70"
                    : "hover:bg-blue-200"
                }`}
                onClick={(e) => handleSendRequest(e, user._id)}
                disabled={actionLoading || !user.canSendRequest}
                title={
                  !user.canSendRequest
                    ? "This user's privacy settings don't allow friend requests"
                    : ""
                }
              >
                <FaUserPlus className="mr-1" /> Add
              </button>
            )}
          </div>
        </div>
      </div>
    </li>
  );
};

export default UserListItem;
