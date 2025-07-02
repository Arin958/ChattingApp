import { useRef, useState, useEffect, useCallback } from 'react';
import { throttle } from 'lodash';

export const useScrollHandling = () => {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({
      behavior,
      block: 'end',
    });
  }, []);

  const handleScroll = useCallback(
    throttle(() => {
      if (!messagesContainerRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } =
        messagesContainerRef.current;
      const threshold = 50;
      const atBottom = scrollHeight - (scrollTop + clientHeight) < threshold;

      setIsAtBottom(atBottom);
    }, 200),
    []
  );

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  return { messagesEndRef, messagesContainerRef, isAtBottom, scrollToBottom };
};