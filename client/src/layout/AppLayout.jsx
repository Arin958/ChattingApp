import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { FiMenu, FiPlus } from "react-icons/fi";
import { BsThreeDotsVertical } from "react-icons/bs";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import Sidebar from "../components/layout/SideBar";

export default function ChatLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isChatRoom = location.pathname.includes("/chats/") || 
                    location.pathname.includes("/groups/");

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800">
      {/* Sidebar */}
      <Sidebar 
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen} 
      />

      {/* Mobile sidebar backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        {isChatRoom ? (
          <header className="md:hidden p-3 border-b border-gray-200 bg-white flex items-center">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 mr-2 rounded-lg hover:bg-gray-100"
            >
              <FiMenu className="h-5 w-5 text-gray-600" />
            </button>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center mr-2">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <h2 className="font-medium">Chat with {location.pathname.split('/')[2]}</h2>
                <p className="text-xs text-gray-500">Online</p>
              </div>
            </div>
            <button className="ml-auto p-2 rounded-lg hover:bg-gray-100">
              <BsThreeDotsVertical className="h-5 w-5 text-gray-600" />
            </button>
          </header>
        ) : (
          <header className="md:hidden p-3 border-b border-gray-200 bg-white flex items-center justify-between">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <FiMenu className="h-5 w-5 text-gray-600" />
            </button>
            <h2 className="text-lg font-medium">ChatApp</h2>
            {user?.isAuthenticated && (
              <button 
                onClick={() => navigate("/chats/new")}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <FiPlus className="h-5 w-5 text-gray-600" />
              </button>
            )}
          </header>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}