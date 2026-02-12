import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '../context/WebSocketContext';
import type { Agent, AgentStatus } from '../types';

interface AgentStatusUpdate {
  agentId: string;
  status: AgentStatus;
  timestamp: string;
}

export function useAgentStatus() {
  const { isConnected, subscribe } = useWebSocket();
  const queryClient = useQueryClient();
  const [statusUpdates, setStatusUpdates] = useState<AgentStatusUpdate[]>([]);

  // Subscribe to agent status updates
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribe<AgentStatusUpdate>('status_update', (payload) => {
      // Add to recent updates
      setStatusUpdates((prev) => {
        const newUpdates = [payload, ...prev].slice(0, 50); // Keep last 50
        return newUpdates;
      });

      // Update the agents query cache
      queryClient.setQueryData<{ agents: Agent[]; total: number }>(
        ['agents'],
        (oldData) => {
          if (!oldData) return oldData;

          const updatedAgents = oldData.agents.map((agent) =>
            agent.id === payload.agentId
              ? { ...agent, status: payload.status, lastSeen: payload.timestamp }
              : agent
          );

          return { ...oldData, agents: updatedAgents };
        }
      );
    });

    return unsubscribe;
  }, [isConnected, subscribe, queryClient]);

  const clearUpdates = useCallback(() => {
    setStatusUpdates([]);
  }, []);

  return {
    isConnected,
    statusUpdates,
    clearUpdates,
  };
}
