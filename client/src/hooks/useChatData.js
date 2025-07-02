import { useEffect, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { resetMessages, fetchMessages } from '../Store/message/messageSlice';

export const useChatData = (API) => {
  const dispatch = useDispatch();
  const { userId } = useParams();
  const [currentChat, setCurrentChat] = useState(null);
  const [loadingChat, setLoadingChat] = useState(true);

  const fetchChatData = useCallback(async () => {
    if (!userId) return;

    try {
      setLoadingChat(true);
      dispatch(resetMessages());

      const [userRes] = await Promise.all([
        axios.get(`${API}/api/get-users/${userId}`, {
          withCredentials: true,
        }),
        dispatch(fetchMessages(userId)),
      ]);

      setCurrentChat(userRes.data);
    } catch (err) {
      console.error('Error fetching chat data:', err);
    } finally {
      setLoadingChat(false);
    }
  }, [userId, dispatch]);

  useEffect(() => {
    fetchChatData();
  }, [fetchChatData]);

  return { currentChat, loadingChat };
};