import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchFriends } from "../../Store/User/userSlice";
import {
  sendFriendRequest,
  cancelFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
} from "../../Store/User/friendSlice";
import {
  FaUserPlus,
  FaUserTimes,
  FaUserClock,
  FaUserCheck,
  FaUsers,
} from "react-icons/fa";
import { initializeSocket, getSocket } from "../../socket/socket";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getUserGroups } from "../../Store/User/groupSlice";

const API = import.meta.env.VITE_API_URL;

const UserList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { friends, loading, error, actionLoading } = useSelector(
    (state) => state.users
  );
  const { groups } = useSelector((state) => state.groups);


  const [activeTab, setActiveTab] = useState("direct"); // 'direct' or 'group'
  const [searchTerm, setSearchTerm] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    dispatch(fetchFriends());
    dispatch(getUserGroups())

    // Initialize socket connection
    initializeSocket();
    const socket = getSocket();
    if (!socket) return;

    const updateOnlineUsers = (onlineUserIds) => {
      setOnlineUsers(onlineUserIds);
    };

    socket.on("online-users", updateOnlineUsers);
    socket.emit("get-online-users");

    return () => {
      socket.off("online-users", updateOnlineUsers);
    };
  }, [dispatch]);

  const handleUserClick = async (userId) => {
    try {
      await axios.get(`${API}/api/chat/${userId}`, { withCredentials: true });

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId ? { ...user, unreadCount: 0 } : user
        )
      );

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

  const handleGroupClick = (groupId) => {
    navigate(`/group-chats/${groupId}`);
  };

  const handleSendRequest = (receiverId) => {
    dispatch(sendFriendRequest({ receiverId }));
  };

  const handleCancelRequest = (requestId) => {
    dispatch(cancelFriendRequest(requestId));
  };

  const handleAcceptRequest = (requestId) => {
    dispatch(acceptFriendRequest(requestId));
  };

  const handleRejectRequest = (requestId) => {
    dispatch(rejectFriendRequest(requestId));
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const filteredUsers = friends
    .filter((user) =>
      user.username?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .map((user) => ({
      ...user,
      status: onlineUsers.includes(user._id) ? "online" : "offline",
    }));

  const filteredGroups = groups
    .filter((group) =>
      group.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));



  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-500">Loading...</p>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-red-500 mb-4">Error: {error}</p>
        <button
          onClick={() => dispatch(fetchFriends())}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Retry
        </button>
      </div>
    );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Chats
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b dark:border-gray-700">
        <button
          className={`flex-1 py-3 font-medium text-sm ${
            activeTab === "direct"
              ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
          onClick={() => setActiveTab("direct")}
        >
          Direct Messages
        </button>
        <button
          className={`flex-1 py-3 font-medium text-sm ${
            activeTab === "group"
              ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
          onClick={() => setActiveTab("group")}
        >
          Group Chats
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4">
        <div className="relative">
          <input
            type="text"
            placeholder={`Search ${activeTab === "direct" ? "users" : "groups"}...`}
            className="w-full p-3 pl-10 rounded-lg bg-gray-100 dark:bg-gray-800 border-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg
            className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "direct" ? (
          filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <svg
                className="h-16 w-16 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
                No users found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm
                  ? "Try a different search term"
                  : "No users available"}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <li
                  onClick={() => handleUserClick(user._id)}
                  key={user._id}
                  className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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
                            onClick={() => handleCancelRequest(user.requestId)}
                            disabled={actionLoading}
                          >
                            <FaUserTimes className="mr-1" /> Cancel
                          </button>
                        ) : user.requestStatus === "request_received" ? (
                          <div className="flex space-x-1">
                            <button
                              className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center"
                              onClick={() => handleAcceptRequest(user.requestId)}
                              disabled={actionLoading}
                            >
                              Accept
                            </button>
                            <button
                              className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center"
                              onClick={() => handleRejectRequest(user.requestId)}
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
                            onClick={() => handleSendRequest(user._id)}
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
              ))}
            </ul>
          )
        ) : filteredGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <FaUsers className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
              No groups found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm
                ? "Try a different search term"
                : "No groups available"}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredGroups.map((group) => (
              <li
                onClick={() => handleGroupClick(group._id)}
                key={group._id}
                className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="relative flex-shrink-0">
                  {group.avatar ? (
                    <img
                      src={group.avatar}
                      className="w-12 h-12 rounded-full object-cover"
                      alt={group.name}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                      {group.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {group.name}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {group.members?.length || 0} members
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {group.lastMessage?.content || "No messages yet"}
                    </p>
                    <span className="text-xs text-gray-400">
                      {group.lastMessage
                        ? formatTime(group.lastMessage.createdAt)
                        : ""}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default UserList;