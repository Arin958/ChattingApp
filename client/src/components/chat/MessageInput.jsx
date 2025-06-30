import { useState } from "react";
import { BsEmojiSmile, BsPaperclip } from "react-icons/bs";
import { IoMdSend } from "react-icons/io";

export default function MessageInput({ onSend }) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message);
      setMessage("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 bg-white">
      <div className="flex items-center">
        <button type="button" className="p-2 text-gray-500 hover:text-blue-500">
          <BsEmojiSmile className="h-5 w-5" />
        </button>
        <button type="button" className="p-2 text-gray-500 hover:text-blue-500">
          <BsPaperclip className="h-5 w-5" />
        </button>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 mx-2 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
        />
        <button
          type="submit"
          disabled={!message}
          className={`p-2 rounded-full ${
            message
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "text-gray-400"
          }`}
        >
          <IoMdSend className="h-5 w-5" />
        </button>
      </div>
    </form>
  );
}