import React from "react";
import { useDispatch } from "react-redux";
import { fetchFriends } from "../../Store/User/userSlice";

const ErrorState = ({ error }) => {
  const dispatch = useDispatch();
  
  return (
    <div className="flex flex-col items-center justify-center h-64">
      <p className="text-red-500 mb-4">Error: {error}</p>
      <button
        onClick={() => dispatch(fetchFriends())}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
      >
        Retry
      </button>
    </div>
  );
};

export default ErrorState;