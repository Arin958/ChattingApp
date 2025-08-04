import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  createGroup,
  getUserGroups,
  getGroupDetails,
  updateGroup,
  addGroupMembers,
  removeGroupMember,
  promoteToAdmin,
  demoteAdmin,
  clearCurrentGroup,
} from "../../Store/User/groupSlice";
import { fetchFriends } from "../../Store/User/userSlice";

const FriendGroupManager = () => {
  const dispatch = useDispatch();
  const { groups, currentGroup, loading } = useSelector(
    (state) => state.groups
  );
  const {
    friends,
    loading: friendsLoading,
    error: friendsError,
  } = useSelector((state) => state.users);

  const [form, setForm] = useState({
    name: "",
    description: "",
    isPublic: true,
    selectedFriends: [],
  });

  useEffect(() => {
    dispatch(getUserGroups());
    dispatch(fetchFriends());
  }, [dispatch]);

  const toggleFriend = (friendId) => {
    setForm((prev) => ({
      ...prev,
      selectedFriends: prev.selectedFriends.includes(friendId)
        ? prev.selectedFriends.filter((id) => id !== friendId)
        : [...prev.selectedFriends, friendId],
    }));
  };

  const handleCreate = (e) => {
    e.preventDefault();
    dispatch(
      createGroup({
        name: form.name,
        description: form.description,
        isPublic: form.isPublic,
        memberIds: form.selectedFriends,
      })
    ).then(() => {
      setForm({
        name: "",
        description: "",
        isPublic: true,
        selectedFriends: [],
      });
    });
  };

  const handleAddMembers = () => {
    dispatch(
      addGroupMembers({
        groupId: currentGroup._id,
        memberIds: form.selectedFriends,
      })
    ).then(() => {
      setForm((prev) => ({ ...prev, selectedFriends: [] }));
    });
  };

  // Filter friends who are not already in the current group
  const getFriendsNotInGroup = () => {
    if (!currentGroup || !currentGroup.members) return friends;
    
    const memberIds = currentGroup.members.map(member => member.user._id);
    return friends.filter(friend => !memberIds.includes(friend._id));
  };

  return (
    <div className="p-5 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Group Manager</h1>

      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Group List */}
        <div className="w-full lg:w-1/3 bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">Your Groups</h2>
            <button
              onClick={() => dispatch(clearCurrentGroup())}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition duration-200"
            >
              + New Group
            </button>
          </div>

          <ul className="space-y-2">
            {groups.map((group) => (
              <li
                key={group._id}
                onClick={() => dispatch(getGroupDetails(group._id))}
                className={`p-3 rounded-md cursor-pointer transition duration-200 ${
                  currentGroup?._id === group._id
                    ? "bg-blue-100 border-l-4 border-blue-500"
                    : "hover:bg-gray-100"
                }`}
              >
                <div className="font-medium text-gray-800">{group.name}</div>
                <div className="text-sm text-gray-500">
                  {group.members?.length || 0} members
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Group Details or Create Form */}
        <div className="w-full lg:w-2/3 bg-white rounded-lg shadow-md p-6">
          {currentGroup ? (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {currentGroup.name}
              </h2>

              {/* Group Info Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">
                  Group Info
                </h3>
                <input
                  placeholder="Group name"
                  defaultValue={currentGroup.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full p-2 mb-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  placeholder="Description"
                  defaultValue={currentGroup.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full p-2 mb-3 border border-gray-300 rounded-md h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() =>
                    dispatch(
                      updateGroup({
                        groupId: currentGroup._id,
                        name: form.name || currentGroup.name,
                        description:
                          form.description || currentGroup.description,
                      })
                    )
                  }
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition duration-200"
                >
                  Update Group Info
                </button>
              </div>

              {/* Current Members */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">
                  Current Members
                </h3>
                <ul className="space-y-3">
                  {currentGroup.members?.map((member) => (
                    <li
                      key={member.user._id}
                      className="p-3 bg-gray-50 rounded-md"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <img
                            src={member.user.avatar || "https://via.placeholder.com/40"}
                            alt={member.user.username}
                            className="w-8 h-8 rounded-full mr-3"
                          />
                          <div>
                            <div className="font-medium">
                              {member.user.username}
                              {currentGroup.admins.includes(member.user._id) && (
                                <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                  Admin
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {member.user.status || "offline"}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {!currentGroup.admins.includes(member.user._id) && (
                            <button
                              onClick={() =>
                                dispatch(
                                  promoteToAdmin({
                                    groupId: currentGroup._id,
                                    memberId: member.user._id,
                                  })
                                )
                              }
                              className="text-xs bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded-md transition duration-200"
                            >
                              Promote
                            </button>
                          )}
                          {currentGroup.admins.includes(member.user._id) &&
                            member.user._id !== currentGroup.creator._id && (
                              <button
                                onClick={() =>
                                  dispatch(
                                    demoteAdmin({
                                      groupId: currentGroup._id,
                                      memberId: member.user._id,
                                    })
                                  )
                                }
                                className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded-md transition duration-200"
                              >
                                Demote
                              </button>
                            )}
                          {member.user._id !== currentGroup.creator._id && (
                            <button
                              onClick={() =>
                                dispatch(
                                  removeGroupMember({
                                    groupId: currentGroup._id,
                                    memberId: member.user._id,
                                  })
                                )
                              }
                              className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-md transition duration-200"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Add Friends Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">
                  Add Friends
                </h3>
                {getFriendsNotInGroup().length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
                      {getFriendsNotInGroup().map((friend) => (
                        <div
                          key={friend._id}
                          onClick={() => toggleFriend(friend._id)}
                          className={`p-3 border rounded-lg cursor-pointer transition duration-200 flex items-center ${
                            form.selectedFriends.includes(friend._id)
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center">
                            <div className="relative mr-3">
                              <img
                                src={friend.avatar || "https://via.placeholder.com/40"}
                                alt={friend.username}
                                className="w-8 h-8 rounded-full"
                              />
                              {friend.status === "online" && (
                                <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white"></div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-sm">
                                {friend.username}
                              </div>
                              <div className="text-xs text-gray-500">
                                {friend.isFriend ? "Friend" : "Not Friend"}
                              </div>
                            </div>
                          </div>
                          <div className="ml-auto">
                            {form.selectedFriends.includes(friend._id) ? (
                              <span className="text-blue-500">✓</span>
                            ) : (
                              <span className="text-gray-400">+</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleAddMembers}
                      disabled={form.selectedFriends.length === 0}
                      className={`px-4 py-2 rounded-md transition duration-200 ${
                        form.selectedFriends.length > 0
                          ? "bg-blue-500 hover:bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      Add Selected Friends ({form.selectedFriends.length})
                    </button>
                  </>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-md text-center text-gray-500">
                    All your friends are already in this group.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Create New Group
              </h2>
              <form onSubmit={handleCreate}>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Group Name</label>
                  <input
                    placeholder="Enter group name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    placeholder="What's this group about?"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="mb-6">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={form.isPublic}
                      onChange={(e) =>
                        setForm({ ...form, isPublic: e.target.checked })
                      }
                      className="rounded text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">Public Group</span>
                  </label>
                  <p className="text-sm text-gray-500 mt-1">
                    Public groups can be found by anyone, private groups are
                    invite-only.
                  </p>
                </div>

                <h3 className="text-lg font-semibold text-gray-700 mb-3">
                  Select Friends to Add
                </h3>
                {friends.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
                      {friends.map((friend) => (
                        <div
                          key={friend._id}
                          onClick={() => toggleFriend(friend._id)}
                          className={`p-3 border rounded-lg cursor-pointer transition duration-200 flex items-center ${
                            form.selectedFriends.includes(friend._id)
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center">
                            <div className="relative mr-3">
                              <img
                                src={friend.avatar || "https://via.placeholder.com/40"}
                                alt={friend.username}
                                className="w-8 h-8 rounded-full"
                              />
                              {friend.status === "online" && (
                                <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white"></div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-sm">
                                {friend.username}
                              </div>
                              <div className="text-xs text-gray-500">
                                {friend.isFriend ? "Friend" : "Not Friend"}
                              </div>
                            </div>
                          </div>
                          <div className="ml-auto">
                            {form.selectedFriends.includes(friend._id) ? (
                              <span className="text-blue-500">✓</span>
                            ) : (
                              <span className="text-gray-400">+</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      type="submit"
                      disabled={!form.name || form.selectedFriends.length === 0}
                      className={`w-full py-2 rounded-md transition duration-200 ${
                        form.name && form.selectedFriends.length > 0
                          ? "bg-blue-500 hover:bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      Create Group
                    </button>
                  </>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-md text-center text-gray-500 mb-6">
                    You don't have any friends to add to this group yet.
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendGroupManager;