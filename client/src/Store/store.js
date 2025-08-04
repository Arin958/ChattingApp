import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth/authSlice";
import messageReducer from "./message/messageSlice";
import userReducer from "./User/userSlice";
import storage from "redux-persist/lib/storage";
import { persistReducer, persistStore } from "redux-persist";
import { combineReducers } from "redux";
import friendRequestReducer from "./User/friendSlice";
import groupReducer from "./User/groupSlice";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth"],
};

const rootReducer = combineReducers({
  auth: authReducer,
  message: messageReducer,
  users: userReducer,
  friendRequests: friendRequestReducer,
  groups: groupReducer
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }), // ✅ No need to add thunk manually
});

export const persistor = persistStore(store);
