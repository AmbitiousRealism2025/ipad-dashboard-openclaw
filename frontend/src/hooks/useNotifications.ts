import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '../context/WebSocketContext';
import type { Notification } from '../types';

export function useNotifications() {
  const { isConnected, subscribe } = useWebSocket();
  const queryClient = useQueryClient();
  const [newNotifications, setNewNotifications] = useState<Notification[]>([]);

  // Subscribe to notification events
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribe<Notification>('notification', (payload) => {
      // Add to new notifications
      setNewNotifications((prev) => [payload, ...prev].slice(0, 20));

      // Invalidate the notifications query to refetch
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    return unsubscribe;
  }, [isConnected, subscribe, queryClient]);

  const clearNewNotifications = useCallback(() => {
    setNewNotifications([]);
  }, []);

  return {
    isConnected,
    newNotifications,
    clearNewNotifications,
  };
}
