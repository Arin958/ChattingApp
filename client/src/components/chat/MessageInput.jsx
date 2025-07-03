import React, { useRef } from 'react';
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  FaceSmileIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const MessageInput = ({
  newMessage,
  isUploading,
  sendError,
  selectedFile,
  filePreview,
  onMessageChange,
  onFileChange,
  onRemoveFile,
  onSendMessage,
}) => {
  const fileInputRef = useRef(null);

  return (
    <div className="bg-white border-t border-gray-200">
      {/* Error message */}
      {sendError && (
        <div className="px-4 py-2 bg-red-50 text-red-600 text-sm">
          {sendError}
        </div>
      )}

      {/* File preview */}
      {filePreview && (
        <div className="px-4 py-2 bg-gray-50 relative">
          <div className="flex items-center justify-between">
            {filePreview.startsWith('data:image') ? (
              <img src={filePreview} alt="Preview" className="max-h-40 rounded-lg" />
            ) : filePreview.startsWith('blob:') ? (
              <video src={filePreview} controls className="max-h-40 rounded-lg" />
            ) : (
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700">
                  File: {selectedFile.name}
                </span>
              </div>
            )}
            <button
              onClick={onRemoveFile}
              className="p-1 rounded-full hover:bg-gray-200 text-gray-500"
              aria-label="Remove file"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Input form */}
      <form onSubmit={onSendMessage} className="flex items-center p-3">
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileChange}
          accept="image/*,video/*"
          className="hidden"
          key={filePreview ? 'file-input-with-preview' : 'file-input'}
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current.click()}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
          aria-label="Attach file"
          disabled={isUploading}
        >
          <PaperClipIcon className="w-6 h-6" />
        </button>
        
        <input
          type="text"
          value={newMessage}
          onChange={onMessageChange}
          placeholder="Type a message..."
          className="flex-1 mx-2 py-2 px-4 rounded-full border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-gray-100"
          disabled={isUploading}
        />
        
        <button
          type="submit"
          disabled={(!newMessage.trim() && !selectedFile) || isUploading}
          className={`p-2 rounded-full ${
            (newMessage.trim() || selectedFile) && !isUploading
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
          aria-label="Send message"
        >
          {isUploading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <PaperAirplaneIcon className="w-5 h-5 transform rotate-90" />
          )}
        </button>
      </form>
    </div>
  );
};

export default MessageInput;