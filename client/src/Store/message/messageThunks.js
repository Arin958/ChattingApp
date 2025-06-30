import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const sendMessage = createAsyncThunk(
  'message/send',
  async ({ receiver, content, type = 'text', mediaUrl }, thunkAPI) => {
    try {
      const res = await axios.post('/api/messages', { receiver, content, type, mediaUrl }, { withCredentials: true });
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response.data.message);
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'message/fetch',
  async ({ userId, before, limit = 20 }, thunkAPI) => {
    try {
      const url = `/api/messages/${userId}?limit=${limit}${before ? `&before=${before}` : ''}`;
      const res = await axios.get(url, { withCredentials: true });
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response.data.message);
    }
  }
);

export const deleteMessage = createAsyncThunk(
  'message/delete',
  async (messageId, thunkAPI) => {
    try {
      const res = await axios.delete(`/api/messages/${messageId}`, { withCredentials: true });
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response.data.message);
    }
  }
);

export const markMessagesAsSeen = createAsyncThunk(
  'message/markSeen',
  async (senderId, thunkAPI) => {
    try {
      const res = await axios.put(`/api/messages/mark-seen`, { senderId }, { withCredentials: true });
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response.data.message);
    }
  }
);
