import { useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { debounce } from 'lodash';
import { markMessagesAsSeen } from '../Store/message/messageSlice';

export const useMessageVisibility = (user, messages) => {
  const dispatch = useDispatch();

  // Handle message seen status with debouncing
  const handleMessageSeen = useCallback(
    debounce(async (messageId) => {
      const message = messages.find((m) => m._id === messageId);
      if (!message || message.seen || message.sender._id === user._id) return;

      try {
        await dispatch(markMessagesAsSeen(messageId)).unwrap();
      } catch (err) {
        console.error('Error marking message as seen:', err);
      }
    }, 300),
    [messages, user._id, dispatch]
  );

  // Setup intersection observer for message visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.dataset.messageId;
            if (messageId) {
              const message = messages.find((m) => m._id === messageId);
              if (message && !message.seen && message.sender._id !== user._id) {
                handleMessageSeen(messageId);
              }
            }
          }
        });
      },
      { threshold: 0.5, rootMargin: '0px 0px -100px 0px' }
    );

    const currentMessageElements = document.querySelectorAll('[data-message-id]');
    currentMessageElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [messages, user._id, handleMessageSeen]);

  return { handleMessageSeen };
};