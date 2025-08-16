import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL;

// Async Thunks
export const sendFriendRequest = createAsyncThunk(
  'friendRequests/send',
  async ({ receiverId }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API}/api/friend/friend-requests`,
        { receiverId },
        { withCredentials: true }
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const acceptFriendRequest = createAsyncThunk(
  'friendRequests/accept',
  async (requestId, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${API}/api/friend/friend-requests/${requestId}/accept`,
        {},
        { withCredentials: true }
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const rejectFriendRequest = createAsyncThunk(
  'friendRequests/reject',
  async (requestId, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${API}/api/friend-requests/${requestId}/reject`,
        {},
        { withCredentials: true }
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const cancelFriendRequest = createAsyncThunk(
  'friendRequests/cancel',
  async (requestId, { rejectWithValue }) => {
    try {
      await axios.delete(
        `${API}/api/friend/friend-requests/${requestId}`,
        { withCredentials: true }
      );
      return { requestId };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const getFriendRequests = createAsyncThunk(
  'friendRequests/getAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API}/api/friend/friend-requests`,
        { withCredentials: true }
      );
      console.log('Friend requests response:', response.data);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const unfriend = createAsyncThunk(
  'friendRequests/unfriend',
  async (friendId, { rejectWithValue }) => {
    try {
      const response = await axios.delete(
        `${API}/api/friend/unfriend/${friendId}`,
        { withCredentials: true }
      );
      return { friendId, ...response.data };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const initialState = {
  sentRequests: [],
  receivedRequests: [],
  loading: false,
  error: null,
  actionLoading: false,
  actionError: null,
};

const friendRequestSlice = createSlice({
  name: 'friendRequests',
  initialState,
  reducers: {
    addIncomingRequest: (state, action) => {
      if (!state.receivedRequests.some(req => req._id === action.payload._id)) {
        state.receivedRequests.unshift(action.payload);
      }
    },
    removeRequest: (state, action) => {
      state.sentRequests = state.sentRequests.filter(
        req => req._id !== action.payload
      );
      state.receivedRequests = state.receivedRequests.filter(
        req => req._id !== action.payload
      );
    },
    updateRequestStatus: (state, action) => {
      const { requestId, status } = action.payload;
      const allRequests = [...state.sentRequests, ...state.receivedRequests];
      const request = allRequests.find(req => req._id === requestId);
      
      if (request) {
        request.status = status;
      }
    },
    clearFriendRequests: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Get all friend requests
      .addCase(getFriendRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getFriendRequests.fulfilled, (state, action) => {
      
         state.loading = false;
  state.receivedRequests = Array.isArray(action.payload.receivedRequests)
    ? action.payload.receivedRequests
    : [];
  state.sentRequests = Array.isArray(action.payload.sentRequests)
    ? action.payload.sentRequests
    : [];
      })
      
      // Send friend request
      .addCase(sendFriendRequest.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(sendFriendRequest.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.sentRequests.unshift(action.payload.friendRequest);
      })
      .addCase(sendFriendRequest.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })
      
      // Accept friend request
      .addCase(acceptFriendRequest.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(acceptFriendRequest.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.receivedRequests = state.receivedRequests.filter(
          req => req._id !== action.payload.friendRequest._id
        );
      })
      .addCase(acceptFriendRequest.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })
      
      // Reject friend request
      .addCase(rejectFriendRequest.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(rejectFriendRequest.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.receivedRequests = state.receivedRequests.filter(
          req => req._id !== action.payload.friendRequest._id
        );
      })
      .addCase(rejectFriendRequest.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })
      
      // Cancel friend request
      .addCase(cancelFriendRequest.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(cancelFriendRequest.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.sentRequests = state.sentRequests.filter(
          req => req._id !== action.payload.requestId
        );
      })
      .addCase(cancelFriendRequest.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })
      
      // Unfriend
      .addCase(unfriend.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(unfriend.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(unfriend.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      });
  },
});

export const {
  addIncomingRequest,
  removeRequest,
  updateRequestStatus,
  clearFriendRequests,
} = friendRequestSlice.actions;

export default friendRequestSlice.reducer;