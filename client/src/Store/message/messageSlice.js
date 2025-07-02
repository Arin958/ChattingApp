import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

// Thunks
export const fetchMessages = createAsyncThunk(
  "message/fetchMessages",
  async (userId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API}/api/chat/${userId}`, {
        withCredentials: true,
      });
      return {
        messages: res.data.messages,
        hasMore: res.data.hasMore,
        senderId: userId,
      };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const sendMessage = createAsyncThunk(
  "message/sendMessage",
  async (messageData, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API}/api/chat`, messageData, {
        withCredentials: true,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const deleteMessage = createAsyncThunk(
  "message/deleteMessage",
  async (messageId, { rejectWithValue }) => {
    try {
      await axios.delete(`${API}/api/chat/${messageId}`, {
        withCredentials: true,
      });
      return { _id: messageId };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const markMessagesAsSeen = createAsyncThunk(
  "message/markMessagesAsSeen",
  async (messageId, { rejectWithValue }) => {
    // Now accepts messageId directly
    try {
      const res = await axios.put(
        `${API}/api/chat/seen/${messageId}`, // Matches your route
        {}, // No body needed since messageId is in URL
        { withCredentials: true }
      );
      return {
        messageId,
        seenAt: res.data.seenAt || new Date().toISOString(),
      };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const editMessage = createAsyncThunk(
  "message/editMessage",
  async ({ messageId, newContent }, { rejectWithValue }) => {
    try {
      const res = await axios.put(
        `${API}/api/chat/${messageId}`,
        { newContent },
        { withCredentials: true }
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const initialState = {
  messages: [],
  loading: false,
  error: null,
  hasMore: true,
  lastSeen: {}, // Track last seen timestamps per sender
};

const messageSlice = createSlice({
  name: "message",
  initialState,
  reducers: {
    resetMessages: (state) => {
      state.messages = [];
      state.hasMore = true;
      state.lastSeen = {};
    },
    addIncomingMessage: (state, action) => {
      const message = action.payload;
      if (!state.messages.some((msg) => msg._id === message._id)) {
        state.messages.push(message);
      }
    },
    removeMessage: (state, action) => {
      state.messages = state.messages.filter(
        (msg) => msg._id !== action.payload
      );
    },
    markSeenLocally: (state, action) => {
      const { messageId, seenAt } = action.payload;
      state.messages = state.messages.map((msg) =>
        msg._id === messageId ? { ...msg, seen: true, seenAt } : msg
      );
    },
    addSocketMessage: (state, action) => {
      const message = action.payload;
      if (!state.messages.some((m) => m._id === message._id)) {
        state.messages.push(message);
        // Sort by createdAt after adding new message
        state.messages.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
      }
    },
    // New reducer to handle bulk seen updates
    markMessagesSeen: (state, action) => {
      const { senderId, messageId, seenAt } = action.payload;
      state.messages = state.messages.map((msg) =>
        msg.sender._id === senderId && !msg.seen && msg._id <= messageId
          ? { ...msg, seen: true, seenAt }
          : msg
      );
      state.lastSeen[senderId] = seenAt;
    },
    editMessageLocally: (state, action) => {
      const { messageId, newContent } = action.payload;
      state.messages = state.messages.map((msg) =>
        msg._id === messageId
          ? { ...msg, content: newContent, edited: true }
          : msg
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        const { messages, senderId } = action.payload;

        // Merge new messages with existing ones
        const existingIds = new Set(state.messages.map((m) => m._id));
        const newMessages = messages.filter((msg) => !existingIds.has(msg._id));

        state.messages = [...state.messages, ...newMessages].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );

        state.hasMore = action.payload.hasMore;

        // Mark messages as seen if they're from the sender
        if (senderId) {
          const lastMessage = messages
            .filter((m) => m.sender._id === senderId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

          if (lastMessage && !lastMessage.seen) {
            state.messages = state.messages.map((msg) =>
              msg.sender._id === senderId && !msg.seen
                ? { ...msg, seen: true, seenAt: new Date().toISOString() }
                : msg
            );
            state.lastSeen[senderId] = new Date().toISOString();
          }
        }
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        if (!state.messages.some((m) => m._id === action.payload._id)) {
          state.messages.push(action.payload);
          state.messages.sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          );
        }
      })
      .addCase(deleteMessage.fulfilled, (state, action) => {
        state.messages = state.messages.filter(
          (m) => m._id !== action.payload._id
        );
      })
      .addCase(markMessagesAsSeen.fulfilled, (state, action) => {
        const { messageId, seenAt } = action.payload;
        state.messages = state.messages.map((msg) =>
          msg._id === messageId ? { ...msg, seen: true, seenAt } : msg
        );
        state.lastSeen[action.payload.senderId] = seenAt;
      })

      .addCase(editMessage.fulfilled, (state, action) => {
        const { _id, content, edited } = action.payload;
        state.messages = state.messages.map((msg) =>
          msg._id === _id ? { ...msg, content, edited } : msg
        );
      });
  },
});

export const {
  resetMessages,
  addIncomingMessage,
  removeMessage,
  markSeenLocally,
  addSocketMessage,
  markMessagesSeen,
  editMessageLocally
} = messageSlice.actions;

export default messageSlice.reducer;
