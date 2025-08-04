import { Routes, Route } from "react-router-dom";
import PublicRoute from "./components/auth/PublicRoute";
import PrivateRoute from "./components/auth/PrivateRoute";
import ChatLayout from "./layout/AppLayout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ChatList from "./pages/chat/ChatList";
import ChatRoom from "./pages/chat/ChatRoom";
import GroupChat from "./pages/chat/GroupChat";
import Profile from "./pages/user/Profile";
import Settings from "./pages/user/Settings";
import NotFound from "./pages/NotFound";
import Home from "./pages/Home";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { checkAuth } from "./Store/auth/authSlice";
import UnderDevelopment from "./pages/UnderDevelopment";
import UserList from "./pages/user/People";
import MyFriends from "./pages/chat/MyFriends";
import GroupManagement from "./pages/user/Group";
import GroupChatRoom from "./pages/chat/GroupChatRoom";

function App() {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(checkAuth());
    }
  }, [isAuthenticated, dispatch]);
  return (
    <Routes>
      {/* Public routes (outside ChatLayout) */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Protected routes with ChatLayout */}
      <Route element={<ChatLayout />}>
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
        <Route
          path="/chats"
          element={
            <PrivateRoute>
              <ChatList />
            </PrivateRoute>
          }
        />
        <Route
          path="/chats/:userId"
          element={
            <PrivateRoute>
              <ChatRoom />
            </PrivateRoute>
          }
        />
        <Route
          path="/group/:groupId"
          element={
            <PrivateRoute>
              <GroupChatRoom />
            </PrivateRoute>
          }
        />
        <Route
          path="/chats/:userId"
          element={
            <PrivateRoute>
              <ChatRoom />
            </PrivateRoute>
          }
        />
        <Route
          path="/groups"
          element={
            <PrivateRoute>
              <GroupManagement />
            </PrivateRoute>
          }
        />
        <Route
          path="/people"
          element={
            <PrivateRoute>
              <UserList />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/my-friends"
          element={
            <PrivateRoute>
              <MyFriends />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <UnderDevelopment />
            </PrivateRoute>
          }
        />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
