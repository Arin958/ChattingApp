import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchFriends } from "../../Store/User/userSlice";
import { getUserGroups } from "../../Store/User/groupSlice";
import { initializeSocket, getSocket } from "../../socket/socket";
import UserListHeader from "../../components/chat/ChatList/UserListHeader";
import UserListTabs from "../../components/chat/ChatList/UserListTab";
import UserListContent from "../../components/chat/ChatList/UserListContent";
import LoadingState from "../../components/chat/ChatList/LoadingState";


const UserList = () => {
  const dispatch = useDispatch();
  const { friends, loading, error } = useSelector((state) => state.users);
  const { groups } = useSelector((state) => state.groups);
  const [activeTab, setActiveTab] = useState("direct");
  const [searchTerm, setSearchTerm] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    dispatch(fetchFriends());
    dispatch(getUserGroups());

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

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <UserListHeader title="Chats" />
      <UserListTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      <UserListContent
        activeTab={activeTab}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        friends={friends}
        groups={groups}
        onlineUsers={onlineUsers}
      />
    </div>
  );
};

export default UserList;