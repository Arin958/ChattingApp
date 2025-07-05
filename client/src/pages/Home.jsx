import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const Home = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const timeoutDuration = 5000; // 5 seconds
  const intervalDuration = 50;  // For smooth animation

  useEffect(() => {
    const startTime = Date.now();
    const endTime = startTime + timeoutDuration;

    const updateProgress = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const percentage = Math.min((elapsed / timeoutDuration) * 100, 100);
      setProgress(percentage);

      if (now >= endTime) {
        const justLoggedIn = sessionStorage.getItem("justLoggedIn");

        if (justLoggedIn) {
          sessionStorage.removeItem("justLoggedIn"); // ✅ Prevent future reloads
          navigate("/chats");
          sessionStorage.setItem("justOpenedChat", "true");
          window.location.reload(); // ✅ Only refres
          // h ONCE after login
        } else {
          navigate("/chats");
        }
      } else {
        requestAnimationFrame(updateProgress); // ✅ Continue animation loop
      }
    };

    requestAnimationFrame(updateProgress);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 flex flex-col items-center justify-center p-6">
      {/* Circular Progress Loader */}
      <div className="relative w-32 h-32 mb-8">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#4f46e5"
            strokeWidth="8"
            strokeLinecap="round"
            initial={{ strokeDashoffset: 283 }}
            animate={{
              strokeDashoffset: 283 - (283 * progress) / 100,
            }}
            transition={{ duration: intervalDuration / 1000 }}
            strokeDasharray="283"
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className="text-2xl font-bold text-indigo-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {Math.round(progress)}%
          </motion.span>
        </div>
      </div>

      {/* App Title */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-center mb-12"
      >
        <h1 className="text-5xl font-bold text-gray-800 mb-4">
          <span className="text-indigo-600">Chat</span>
          <span className="text-gray-600">App</span>
        </h1>
        <div className="flex justify-center items-center">
          <p className="text-gray-600 text-lg mr-2">Loading your chats</p>
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -5, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 1,
                  delay: i * 0.2,
                }}
                className="w-2 h-2 bg-gray-500 rounded-full"
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute bottom-6 text-center text-gray-500 text-sm"
      >
        <p>Simple, beautiful messaging</p>
      </motion.div>
    </div>
  );
};

export default Home;
