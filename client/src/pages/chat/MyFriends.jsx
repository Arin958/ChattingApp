import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchFriends } from "../../Store/User/userSlice";
import { unfriend } from "../../Store/User/friendSlice";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const MyFriends = () => {
  const dispatch = useDispatch();
  const { friends, loading, error, actionLoading } = useSelector(
    (state) => state.users
  );
  const [localLoading, setLocalLoading] = useState({});

  useEffect(() => {
    dispatch(fetchFriends());
  }, [dispatch]);

  const handleUnfriend = async (friendId) => {
    try {
      setLocalLoading(prev => ({ ...prev, [friendId]: true }));
      await dispatch(unfriend(friendId)).unwrap();
      // Show success message
      alert("Friend removed successfully");
    } catch (err) {
      // Show error message
      alert(err.message || "Failed to remove friend");
    } finally {
      setLocalLoading(prev => ({ ...prev, [friendId]: false }));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "offline":
        return "bg-gray-500";
      case "away":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center p-4 border-b border-gray-200">
            <div className="w-12 h-12 rounded-full bg-gray-300 animate-pulse mr-4"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-2 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">My Friends ({friends?.length || 0})</h1>
      
      {friends?.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          You don't have any friends yet
        </div>
      ) : (
        <div className="space-y-4">
          {friends?.map((friend) => (
            <div 
              key={friend._id}
              className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-4">
                <div className="relative">
                  {friend.avatar ? (
                    <img
                      src={friend.avatar}
                      alt={friend.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                  )}
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(friend.status)}`}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{friend.username}</h3>
                  <p className="text-sm text-gray-500 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Last seen {dayjs(friend.lastSeen).fromNow()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleUnfriend(friend._id)}
                disabled={localLoading[friend._id]}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {localLoading[friend._id] ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Removing...
                  </span>
                ) : (
                  "Unfriend"
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyFriends;