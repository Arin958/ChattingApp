import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsers } from "../../Store/User/userSlice";
import {
  sendFriendRequest,
  cancelFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
} from "../../Store/User/friendSlice";
import {
  FaUserPlus,
  FaUserCheck,
  FaUserClock,
  FaUserTimes,
  FaCircle,
  FaRegCircle,
} from "react-icons/fa";
import { IoMdCheckmarkCircle } from "react-icons/io";
import { formatDistanceToNow } from "date-fns";
import { toast } from "react-toastify";

const UserList = () => {
  const dispatch = useDispatch();
  const { allUsers, loading, error, actionLoading } = useSelector(
    (state) => state.users
  );

  // Fix: Access the array properly from the receivedRequests object
  const { receivedRequests: friendRequestsState } = useSelector(
    (state) => state.friendRequests
  );
  const receivedRequests = friendRequestsState.receivedRequests || [];

  const currentUser = useSelector((state) => state.auth.user);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    dispatch(getFriendRequests());
  }, [dispatch]);

  const handleSendRequest = async (userId) => {
    try {
      await dispatch(sendFriendRequest({ receiverId: userId })).unwrap();
      toast.success("Friend request sent!");
      dispatch(fetchUsers());
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast.error("Failed to send friend request.");
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      await dispatch(cancelFriendRequest(requestId)).unwrap();
      toast.success("Friend request canceled!");
      dispatch(fetchUsers());
    } catch (error) {
      console.log(error);
      toast.error("Failed to cancel friend request.");
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await dispatch(acceptFriendRequest(requestId)).unwrap();
      dispatch(acceptFriendRequest(requestId));
      toast.success("Friend request accepted!");
      dispatch(fetchUsers());
    } catch (error) {
      console.log(error);
      toast.error("Failed to accept friend request.");
    }
  };

  const handleRejectRequest = (requestId) => {
    dispatch(rejectFriendRequest(requestId));
    toast.success("Friend request rejected!");
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4" />
        <p className="mt-4 text-gray-500">Loading users...</p>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-red-500 mb-4">Error: {error}</p>
        <button
          onClick={() => dispatch(fetchUsers())}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Retry
        </button>
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">All Users</h2>
        <div className="flex space-x-4">
          <div className="flex items-center">
            <FaCircle className="text-green-500 text-xs mr-1" />
            <span className="text-sm text-gray-600">Online</span>
          </div>
          <div className="flex items-center">
            <FaRegCircle className="text-gray-400 text-xs mr-1" />
            <span className="text-sm text-gray-600">Offline</span>
          </div>
        </div>
      </div>

      {/* Received Requests Section */}
      {receivedRequests.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            Pending Friend Requests
          </h3>
          <div className="space-y-3">
            {receivedRequests.map((request) => (
              <div
                key={request._id}
                className="flex items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition border-l-4 border-blue-500"
              >
                <div className="relative mr-4">
                  <img
                    src={request.sender.avatar || "/default-avatar.png"}
                    alt={request.sender.username}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                      request.sender.status === "online"
                        ? "bg-green-500"
                        : "bg-gray-400"
                    }`}
                  ></span>
                </div>

                <div className="flex-grow">
                  <h3 className="font-medium text-gray-800">
                    {request.sender.username}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Sent{" "}
                    {formatDistanceToNow(new Date(request.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleAcceptRequest(request._id)}
                    className={`flex items-center px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium ${
                      actionLoading ? "opacity-70" : "hover:bg-green-200"
                    }`}
                    disabled={actionLoading}
                  >
                    <IoMdCheckmarkCircle className="mr-1" />
                    Accept
                  </button>
                  <button
                    onClick={() => handleRejectRequest(request._id)}
                    className={`flex items-center px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-medium ${
                      actionLoading ? "opacity-70" : "hover:bg-red-200"
                    }`}
                    disabled={actionLoading}
                  >
                    <FaUserTimes className="mr-1" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Users Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">All Users</h3>
        {allUsers
          .filter(
            (user) => user._id !== currentUser?._id && user.isFriend === false
          )
          .map((user) => {
            const requestStatus = user.requestStatus;

            return (
              <div
                key={user._id}
                className="flex items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition"
              >
                <div className="relative mr-4">
                  <img
                    src={user.avatar || "/default-avatar.png"}
                    alt={user.username}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                      user.status === "online" ? "bg-green-500" : "bg-gray-400"
                    }`}
                  ></span>
                </div>

                <div className="flex-grow">
                  <h3 className="font-medium text-gray-800">{user.username}</h3>
                  <p className="text-sm text-gray-500">
                    {user.status === "online"
                      ? "Online now"
                      : `Last seen ${formatDistanceToNow(
                          new Date(user.lastSeen),
                          { addSuffix: true }
                        )}`}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  {requestStatus?.type === "received" ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() =>
                          handleAcceptRequest(requestStatus.request._id)
                        }
                        className={`flex items-center px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium ${
                          actionLoading ? "opacity-70" : "hover:bg-green-200"
                        }`}
                        disabled={actionLoading}
                      >
                        <IoMdCheckmarkCircle className="mr-1" />
                        Accept
                      </button>
                      <button
                        onClick={() =>
                          handleRejectRequest(requestStatus.request._id)
                        }
                        className={`flex items-center px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-medium ${
                          actionLoading ? "opacity-70" : "hover:bg-red-200"
                        }`}
                        disabled={actionLoading}
                      >
                        <FaUserTimes className="mr-1" />
                        Reject
                      </button>
                    </div>
                  ) : requestStatus === "request_sent" ? (
                    <button
                      className={`flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium ${
                        actionLoading ? "opacity-70" : "hover:bg-gray-200"
                      }`}
                      onClick={() => handleCancelRequest(user.requestId)}
                      disabled={actionLoading}
                    >
                      <FaUserClock className="mr-1" />
                      Request Sent
                    </button>
                  ) : (
                    <button
                      className={`flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium ${
                        actionLoading ? "opacity-70" : "hover:bg-blue-200"
                      }`}
                      onClick={() => handleSendRequest(user._id)}
                      disabled={actionLoading}
                    >
                      <FaUserPlus className="mr-1" />
                      Add Friend
                    </button>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default UserList;
