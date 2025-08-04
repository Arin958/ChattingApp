// userSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

// Thunks
export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API}/api/getusers`, {
        withCredentials: true,
      });
      return res.data.users;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const fetchFriends = createAsyncThunk(
  "users/fetchFriends",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API}/api/getusers/my-friends`, {
        withCredentials: true,
      });
      return res.data.friends;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const searchUsers = createAsyncThunk(
  "users/searchUsers",
  async (query, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API}/api/getusers/search?q=${query}`, {
        withCredentials: true,
      });
      return res.data.users;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const getUserDetails = createAsyncThunk(
  "users/getUserDetails",
  async (userId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API}/api/getusers/${userId}`, {
        withCredentials: true,
      });
      return res.data.user;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const initialState = {
  allUsers: [],
  searchResults: [],
  friends: [],
  currentUserDetails: null,
  loading: false,
  searchLoading: false,
  detailsLoading: false,
  error: null,
  searchError: null,
  detailsError: null,
};

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchError = null;
    },
    resetUserDetails: (state) => {
      state.currentUserDetails = null;
      state.detailsError = null;
    },
    updateUserStatus: (state, action) => {
      const { userId, status } = action.payload;

      // Update in allUsers
      state.allUsers = state.allUsers.map((user) =>
        user._id === userId ? { ...user, status } : user
      );

      // Update in searchResults
      state.searchResults = state.searchResults.map((user) =>
        user._id === userId ? { ...user, status } : user
      );

      // Update in currentUserDetails
      if (state.currentUserDetails?._id === userId) {
        state.currentUserDetails.status = status;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.allUsers = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Search Users
      .addCase(searchUsers.pending, (state) => {
        state.searchLoading = true;
        state.searchError = null;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.payload;
      })

      // Get User Details
      .addCase(getUserDetails.pending, (state) => {
        state.detailsLoading = true;
        state.detailsError = null;
      })
      .addCase(getUserDetails.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.currentUserDetails = action.payload;
      })
      .addCase(getUserDetails.rejected, (state, action) => {
        state.detailsLoading = false;
        state.detailsError = action.payload;
      })

      // Get Friends
      .addCase(fetchFriends.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFriends.fulfilled, (state, action) => {
       
        state.loading = false;
        state.friends = action.payload;
      })
      .addCase(fetchFriends.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearSearchResults, resetUserDetails, updateUserStatus } =
  userSlice.actions;

export default userSlice.reducer;
