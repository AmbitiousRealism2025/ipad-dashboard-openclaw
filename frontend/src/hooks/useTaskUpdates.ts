import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '../context/WebSocketContext';
import type { Task } from '../types';

export function useTaskUpdates() {
  const { isConnected, subscribe } = useWebSocket();
  const queryClient = useQueryClient();
  const [recentUpdates, setRecentUpdates] = useState<Task[]>([]);

  // Subscribe to task update events
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribe<Task>('task_update', (payload) => {
      // Add to recent updates
      setRecentUpdates((prev) => {
        // Remove any existing entry for this task
        const filtered = prev.filter((t) => t.id !== payload.id);
        return [payload, ...filtered].slice(0, 10);
      });

      // Update the tasks query cache
      queryClient.setQueryData<{ tasks: Task[]; total: number }>(
        ['tasks'],
        (oldData) => {
          if (!oldData) return oldData;

          const taskIndex = oldData.tasks.findIndex((t) => t.id === payload.id);
          let updatedTasks: Task[];

          if (taskIndex >= 0) {
            // Update existing task
            updatedTasks = [...oldData.tasks];
            updatedTasks[taskIndex] = payload;
          } else {
            // Add new task at the beginning
            updatedTasks = [payload, ...oldData.tasks];
          }

          return { ...oldData, tasks: updatedTasks, total: updatedTasks.length };
        }
      );
    });

    return unsubscribe;
  }, [isConnected, subscribe, queryClient]);

  const clearUpdates = useCallback(() => {
    setRecentUpdates([]);
  }, []);

  return {
    isConnected,
    recentUpdates,
    clearUpdates,
  };
}
