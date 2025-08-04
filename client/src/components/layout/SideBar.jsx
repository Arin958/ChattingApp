import { NavLink, useNavigate } from "react-router-dom";
import {
  FiMessageSquare,
  FiUsers,
  FiSettings,
  FiLogOut,
  FiUser,
  FiSearch,
} from "react-icons/fi";
import { BsPeople, BsThreeDotsVertical } from "react-icons/bs";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getMe, logoutUser } from "../../Store/auth/authSlice";
import { persistor } from "../../Store/store";
import { Link } from "react-router-dom";
import { FaUserFriends } from "react-icons/fa";
import { getFriendRequests } from "../../Store/User/friendSlice";

export default function Sidebar({ mobileMenuOpen, setMobileMenuOpen }) {
  const dispatch = useDispatch()
  const [searchOpen, setSearchOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const { receivedRequests } = useSelector((state) => state.friendRequests);

  const receivedLength = receivedRequests?.receivedRequests?.length


  const navigate = useNavigate();
  

  useEffect(() => {
    if (user) {
      dispatch(getMe());
    }
  }, [dispatch]);

  
    useEffect(() => {
    dispatch(getFriendRequests())
  }, [dispatch])

  const handleLogout = async () => {
    await dispatch(logoutUser()).unwrap();
    await persistor.purge();
    navigate("/login");
  };

  return (
    <div
      className={`${
        mobileMenuOpen ? "fixed inset-0 z-50 md:relative" : "hidden md:flex"
      } w-72 flex-col border-r border-gray-200 bg-white`}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <Link to="/">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            ChatApp
          </h1>
        </Link>
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <FiSearch className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Search Bar */}
      {searchOpen && (
        <div className="px-4 pb-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search chats..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        <NavLink
          to="/chats"
          className={({ isActive }) =>
            `flex items-center w-full p-3 rounded-lg hover:bg-gray-100 ${
              isActive ? "bg-blue-50 text-blue-600" : "text-gray-700"
            }`
          }
        >
          <FiMessageSquare className="mr-3" />
          Chats
        </NavLink>
        <NavLink
          to="/groups"
          className={({ isActive }) =>
            `flex items-center w-full p-3 rounded-lg hover:bg-gray-100 ${
              isActive ? "bg-blue-50 text-blue-600" : "text-gray-700"
            }`
          }
        >
          <FiUsers className="mr-3" />
          Groups
        </NavLink>
        <NavLink
          to="/people"
          className={({ isActive }) =>
            `flex items-center w-full p-3 rounded-lg hover:bg-gray-100 ${
              isActive ? "bg-blue-50 text-blue-600" : "text-gray-700"
            }`
          }
        >
          <BsPeople className="mr-3" />
          People
           <span>{receivedLength > 0 && <span className="bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center">{receivedLength}</span>}</span>
        </NavLink>
        <NavLink
          to="/my-friends"
          className={({ isActive }) =>
            `flex items-center w-full p-3 rounded-lg hover:bg-gray-100 ${
              isActive ? "bg-blue-50 text-blue-600" : "text-gray-700"
            }`
          }
        >
          <FaUserFriends className="mr-3" />
          My Friends
         
        </NavLink>
      </nav>

      {/* User Profile or Auth Buttons */}
      <div className="p-3 border-t border-gray-200 relative">
        {user ? (
          <>
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center w-full group p-2 rounded-lg hover:bg-gray-100"
            >
              <div className="relative">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
                    {user?.name?.charAt(0) || "U"}
                  </div>
                )}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="ml-3 text-left">
                <h3 className="font-medium">{user?.username || "User"}</h3>
                <p className="text-xs text-gray-500">Online</p>
              </div>
              <BsThreeDotsVertical className="ml-auto text-gray-400 group-hover:text-gray-600" />
            </button>

            <AnimatePresence>
              {showProfileDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-16 left-3 right-3 bg-white rounded-lg shadow-lg z-50 overflow-hidden border border-gray-200"
                >
                  <NavLink
                    to="/profile"
                    className="block px-4 py-3 text-left hover:bg-gray-50 flex items-center"
                    onClick={() => setShowProfileDropdown(false)}
                  >
                    <FiUser className="mr-2" /> Profile
                  </NavLink>
                  <NavLink
                    to="/settings"
                    className="block px-4 py-3 text-left hover:bg-gray-50 flex items-center"
                    onClick={() => setShowProfileDropdown(false)}
                  >
                    <FiSettings className="mr-2" /> Settings
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center text-red-500"
                  >
                    <FiLogOut className="mr-2" /> Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <div className="space-y-2">
            <button
              onClick={() => navigate("/login")}
              className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              Login
            </button>
            <button
              onClick={() => navigate("/register")}
              className="w-full py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
            >
              Sign Up
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
