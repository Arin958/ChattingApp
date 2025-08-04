// src/hooks/useGroupData.js
import { useEffect, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import axios from "axios";
import { addMessage, fetchGroupMessages } from "../Store/message/messageSlice";
import { getSocket } from "../socket/socket";

export const useGroupData = (API, groupId) => {
  const [currentGroup, setCurrentGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loadingGroup, setLoadingGroup] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const dispatch = useDispatch();

  

  const fetchGroupData = useCallback(async (before = null) => {
    if (!groupId) return;

    try {
      setLoadingGroup(true);
      setError(null);

      const params = { limit: 20 };
      if (before) params.before = before;

      const response = await axios.get(`${API}/api/chat/group/${groupId}`, {
        params,
        withCredentials: true,
      });

      // Handle case where response doesn't contain group data
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || "Failed to load group data");
      }

      // First load or full refresh
      if (!before) {
        setCurrentGroup(response.data.group || null);
        setMembers(response.data.group?.members || []);
      }

      // Handle messages if they exist
      console.log("Fetching group messages for groupId:", groupId);
  
        dispatch(fetchGroupMessages({groupId}));
      

      setHasMore(response.data.hasMore || false);

      return response.data.messages || [];
    } catch (err) {
      console.error("Error fetching group data:", err);
      setError(err.response?.data?.message || err.message);
      setCurrentGroup(null);
      setMembers([]);
      throw err;
    } finally {
      setLoadingGroup(false);
    }
  }, [groupId, dispatch]);

  // Initial load
  useEffect(() => {
    setLoadingGroup(true);
    fetchGroupData();
  }, [fetchGroupData]);

  // Socket listeners
  useEffect(() => {
    if (!groupId) return;

    const socket = getSocket();
    if (!socket) return;

    const handleNewMember = ({
      groupId: updatedGroupId,
      members: updatedMembers,
    }) => {
      if (updatedGroupId === groupId) {
        setMembers(updatedMembers);
      }
    };

    const handleGroupUpdate = (updatedGroup) => {
      if (updatedGroup._id === groupId) {
        setCurrentGroup((prev) => ({ ...prev, ...updatedGroup }));
      }
    };

    socket.on("groupMembersUpdated", handleNewMember);
    socket.on("groupUpdated", handleGroupUpdate);

    return () => {
      socket.off("groupMembersUpdated", handleNewMember);
      socket.off("groupUpdated", handleGroupUpdate);
    };
  }, [groupId]);

  return {
    currentGroup,
    members,
    loadingGroup,
    error,
    hasMore,
    fetchMoreMessages: () => {
      if (currentGroup?.lastMessage) {
        return fetchGroupData(currentGroup.lastMessage.createdAt);
      }
    },
    refetchGroup: () => fetchGroupData(),
  };
};
