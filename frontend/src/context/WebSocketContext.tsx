import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { WSMessage, WSEventType } from '../types';
import { wsService } from '../services/websocket';
import { useAuth } from './AuthContext';

interface WebSocketContextType {
  isConnected: boolean;
  subscribe: <T>(eventType: WSEventType, handler: (payload: T) => void) => () => void;
  send: (message: unknown) => void;
  lastMessage: WSMessage | null;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { tokens, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const [handlers, setHandlers] = useState<Map<WSEventType, Set<(payload: unknown) => void>>>(
    new Map()
  );

  // Connect when authenticated
  useEffect(() => {
    if (!isAuthenticated || !tokens.accessToken) {
      wsService.disconnect();
      setIsConnected(false);
      return;
    }

    wsService.setToken(tokens.accessToken);

    // Set up connection handler
    const unsubConnection = wsService.onConnectionChange((connected) => {
      setIsConnected(connected);
    });

    // Set up message handler
    const unsubMessage = wsService.subscribe((message) => {
      setLastMessage(message);

      // Notify all handlers for this event type
      const typeHandlers = handlers.get(message.type);
      if (typeHandlers) {
        typeHandlers.forEach((handler) => handler(message.payload));
      }
    });

    // Connect
    wsService.connect().catch(console.error);

    return () => {
      unsubConnection();
      unsubMessage();
    };
  }, [isAuthenticated, tokens.accessToken]);

  const subscribe = useCallback(<T,>(eventType: WSEventType, handler: (payload: T) => void) => {
    const typedHandler = handler as (payload: unknown) => void;

    setHandlers((prev) => {
      const newHandlers = new Map(prev);
      const typeHandlers = newHandlers.get(eventType) || new Set();
      typeHandlers.add(typedHandler);
      newHandlers.set(eventType, typeHandlers);
      return newHandlers;
    });

    // Return unsubscribe function
    return () => {
      setHandlers((prev) => {
        const newHandlers = new Map(prev);
        const typeHandlers = newHandlers.get(eventType);
        if (typeHandlers) {
          typeHandlers.delete(typedHandler);
          if (typeHandlers.size === 0) {
            newHandlers.delete(eventType);
          }
        }
        return newHandlers;
      });
    };
  }, []);

  const send = useCallback((message: unknown) => {
    wsService.send(message);
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        subscribe,
        send,
        lastMessage,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
