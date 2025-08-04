import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL;

// Async Thunks
export const createGroup = createAsyncThunk(
  'groups/create',
  async ({ name, description, memberIds = [], isPublic }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API}/api/groups`,
        { name, description, memberIds, isPublic },
        { withCredentials: true }
      );
      return response.data.group;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const getUserGroups = createAsyncThunk(
  'groups/getUserGroups',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API}/api/groups`,
        { withCredentials: true }
      );
      return response.data.groups;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const getGroupDetails = createAsyncThunk(
  'groups/getDetails',
  async (groupId, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API}/api/groups/${groupId}`,
        { withCredentials: true }
      );
      return response.data.group;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const updateGroup = createAsyncThunk(
  'groups/update',
  async ({ groupId, name, description, avatar }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API}/api/groups/${groupId}`,
        { name, description, avatar },
        { withCredentials: true }
      );
      return response.data.group;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const addGroupMembers = createAsyncThunk(
  'groups/addMembers',
  async ({ groupId, memberIds }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API}/api/groups/${groupId}/member`,
        { memberIds },
        { withCredentials: true }
      );
      return response.data.group;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const removeGroupMember = createAsyncThunk(
  'groups/removeMember',
  async ({ groupId, memberId }, { rejectWithValue }) => {
    try {
      const response = await axios.delete(
        `${API}/api/groups/${groupId}/members/${memberId}`,
        { withCredentials: true }
      );
      return { groupId, memberId, group: response.data?.group };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const promoteToAdmin = createAsyncThunk(
  'groups/promote',
  async ({ groupId, memberId }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API}/api/groups/${groupId}/promote/${memberId}`,
        {},
        { withCredentials: true }
      );
      return response.data.group;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const demoteAdmin = createAsyncThunk(
  'groups/demote',
  async ({ groupId, memberId }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API}/api/groups/${groupId}/demote/${memberId}`,
        {},
        { withCredentials: true }
      );
      return response.data.group;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const initialState = {
  groups: [],
  currentGroup: null,
  loading: false,
  error: null,
  actionLoading: false,
  actionError: null,
};

const groupSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    setCurrentGroup: (state, action) => {
      state.currentGroup = action.payload;
    },
    clearCurrentGroup: (state) => {
      state.currentGroup = null;
    },
    updateGroupInList: (state, action) => {
      const updatedGroup = action.payload;
      state.groups = state.groups.map(group => 
        group._id === updatedGroup._id ? updatedGroup : group
      );
      if (state.currentGroup?._id === updatedGroup._id) {
        state.currentGroup = updatedGroup;
      }
    },
    addGroup: (state, action) => {
      if (!state.groups.some(g => g._id === action.payload._id)) {
        state.groups.unshift(action.payload);
      }
    },
    removeGroup: (state, action) => {
      state.groups = state.groups.filter(g => g._id !== action.payload);
      if (state.currentGroup?._id === action.payload) {
        state.currentGroup = null;
      }
    },
    clearGroups: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Create Group
      .addCase(createGroup.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(createGroup.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.groups.unshift(action.payload);
      })
      .addCase(createGroup.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })
      
      // Get User Groups
      .addCase(getUserGroups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserGroups.fulfilled, (state, action) => {
        state.loading = false;
        state.groups = action.payload;
      })
      .addCase(getUserGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get Group Details
      .addCase(getGroupDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getGroupDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentGroup = action.payload;
      })
      .addCase(getGroupDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update Group
      .addCase(updateGroup.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(updateGroup.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.groups = state.groups.map(group => 
          group._id === action.payload._id ? action.payload : group
        );
        if (state.currentGroup?._id === action.payload._id) {
          state.currentGroup = action.payload;
        }
      })
      .addCase(updateGroup.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })
      
      // Add Group Members
      .addCase(addGroupMembers.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(addGroupMembers.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.groups = state.groups.map(group => 
          group._id === action.payload._id ? action.payload : group
        );
        if (state.currentGroup?._id === action.payload._id) {
          state.currentGroup = action.payload;
        }
      })
      .addCase(addGroupMembers.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })
      
      // Remove Group Member
      .addCase(removeGroupMember.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(removeGroupMember.fulfilled, (state, action) => {
        state.actionLoading = false;
        if (action.payload.group) {
          state.groups = state.groups.map(group => 
            group._id === action.payload.group._id ? action.payload.group : group
          );
          if (state.currentGroup?._id === action.payload.group._id) {
            state.currentGroup = action.payload.group;
          }
        } else {
          // Group was deleted
          state.groups = state.groups.filter(g => g._id !== action.payload.groupId);
          if (state.currentGroup?._id === action.payload.groupId) {
            state.currentGroup = null;
          }
        }
      })
      .addCase(removeGroupMember.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })
      
      // Promote to Admin
      .addCase(promoteToAdmin.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(promoteToAdmin.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.groups = state.groups.map(group => 
          group._id === action.payload._id ? action.payload : group
        );
        if (state.currentGroup?._id === action.payload._id) {
          state.currentGroup = action.payload;
        }
      })
      .addCase(promoteToAdmin.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      })
      
      // Demote Admin
      .addCase(demoteAdmin.pending, (state) => {
        state.actionLoading = true;
        state.actionError = null;
      })
      .addCase(demoteAdmin.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.groups = state.groups.map(group => 
          group._id === action.payload._id ? action.payload : group
        );
        if (state.currentGroup?._id === action.payload._id) {
          state.currentGroup = action.payload;
        }
      })
      .addCase(demoteAdmin.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload;
      });
  },
});

export const {
  setCurrentGroup,
  clearCurrentGroup,
  updateGroupInList,
  addGroup,
  removeGroup,
  clearGroups,
} = groupSlice.actions;

export default groupSlice.reducer;