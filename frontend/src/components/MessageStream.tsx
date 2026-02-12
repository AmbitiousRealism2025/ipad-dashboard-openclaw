import { useState, useRef, useEffect } from 'react';
import type { Agent } from '../types';
import { useWebSocket } from '../context/WebSocketContext';
import { ArrowDown, MessageSquare, X } from 'lucide-react';
import clsx from 'clsx';

interface AgentMessage {
  id: string;
  agentId: string;
  content: string;
  timestamp: Date;
  type: 'status' | 'command' | 'response' | 'error';
}

interface MessageStreamProps {
  agent: Agent;
  messages: AgentMessage[];
  onClose?: () => void;
}

export function MessageStream({ agent, messages, onClose }: MessageStreamProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Filter messages for this agent
  const agentMessages = messages.filter((m) => m.agentId === agent.id);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [agentMessages, autoScroll]);

  // Handle scroll events to detect if user scrolled up
  const handleScroll = () => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

    setAutoScroll(isAtBottom);
    setShowScrollButton(!isAtBottom);
  };

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      setAutoScroll(true);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getMessageTypeStyles = (type: AgentMessage['type']) => {
    switch (type) {
      case 'status':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'command':
        return 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600';
      case 'response':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600';
    }
  };

  return (
    <div className="card h-80 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary-500" />
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
            {agent.name} Stream
          </h3>
          <span className="text-xs text-slate-400">
            {agentMessages.length} messages
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto space-y-2 scrollbar-thin"
      >
        {agentMessages.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No messages yet. Agent activity will appear here.
          </div>
        ) : (
          agentMessages.map((message) => (
            <div
              key={message.id}
              className={clsx(
                'p-2 rounded-lg border text-sm',
                getMessageTypeStyles(message.type)
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-slate-700 dark:text-slate-300 break-words">
                  {message.content}
                </p>
                <span className="text-xs text-slate-400 flex-shrink-0">
                  {formatTime(message.timestamp)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-16 right-4 p-2 bg-primary-500 text-white rounded-full shadow-lg hover:bg-primary-600 transition-colors"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// Hook for managing agent messages
export function useAgentMessages() {
  const { isConnected, subscribe } = useWebSocket();
  const [messages, setMessages] = useState<AgentMessage[]>([]);

  // Subscribe to agent messages
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribe<{ agentId: string; content: string; timestamp: string }>(
      'agent_message',
      (payload) => {
        const message: AgentMessage = {
          id: Date.now().toString(),
          agentId: payload.agentId,
          content: payload.content,
          timestamp: new Date(payload.timestamp),
          type: 'response',
        };
        setMessages((prev) => [...prev, message].slice(-100)); // Keep last 100
      }
    );

    // Also subscribe to status updates
    const unsubscribeStatus = subscribe<{ agentId: string; status: string; timestamp: string }>(
      'status_update',
      (payload) => {
        const message: AgentMessage = {
          id: Date.now().toString(),
          agentId: payload.agentId,
          content: `Status changed to: ${payload.status}`,
          timestamp: new Date(payload.timestamp),
          type: 'status',
        };
        setMessages((prev) => [...prev, message].slice(-100));
      }
    );

    return () => {
      unsubscribe();
      unsubscribeStatus();
    };
  }, [isConnected, subscribe]);

  const addMessage = (agentId: string, content: string, type: AgentMessage['type'] = 'command') => {
    const message: AgentMessage = {
      id: Date.now().toString(),
      agentId,
      content,
      timestamp: new Date(),
      type,
    };
    setMessages((prev) => [...prev, message].slice(-100));
  };

  const clearMessages = (agentId?: string) => {
    if (agentId) {
      setMessages((prev) => prev.filter((m) => m.agentId !== agentId));
    } else {
      setMessages([]);
    }
  };

  return {
    messages,
    addMessage,
    clearMessages,
  };
}
