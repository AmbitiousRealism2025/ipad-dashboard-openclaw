import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { WSMessage, Agent, AgentStatus, Task, Notification } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  isAlive?: boolean;
}

// Store connected clients
const clients: Set<AuthenticatedWebSocket> = new Set();

export const setupWebSocket = (wss: WebSocketServer): void => {
  // Heartbeat interval for connection health
  const interval = setInterval(() => {
    wss.clients.forEach((ws: WebSocket) => {
      const client = ws as AuthenticatedWebSocket;
      if (client.isAlive === false) {
        clients.delete(client);
        return client.terminate();
      }
      client.isAlive = false;
      client.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  wss.on('connection', (ws: WebSocket, req) => {
    const client = ws as AuthenticatedWebSocket;
    client.isAlive = true;

    // Extract token from query string or subprotocol
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    // Validate JWT
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        client.userId = decoded.userId;
      } catch {
        client.send(JSON.stringify({ type: 'error', payload: { message: 'Invalid token' } }));
        client.close();
        return;
      }
    }

    clients.add(client);

    // Send welcome message
    sendMessage(client, {
      type: 'status_update',
      payload: { message: 'Connected to dashboard' },
      timestamp: new Date(),
    });

    // Handle incoming messages
    client.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleMessage(client, message);
      } catch (error) {
        sendMessage(client, {
          type: 'error',
          payload: { message: 'Invalid message format' },
          timestamp: new Date(),
        });
      }
    });

    // Handle pong for heartbeat
    client.on('pong', () => {
      client.isAlive = true;
    });

    // Handle disconnect
    client.on('close', () => {
      clients.delete(client);
    });
  });
};

const handleMessage = (client: AuthenticatedWebSocket, message: unknown): void => {
  // Handle client-to-server messages (e.g., subscribe to specific agents)
  const msg = message as { type: string; payload?: unknown };

  switch (msg.type) {
    case 'ping':
      sendMessage(client, { type: 'pong', payload: {}, timestamp: new Date() });
      break;
    case 'subscribe':
      // In Phase 2, implement agent-specific subscriptions
      sendMessage(client, {
        type: 'status_update',
        payload: { message: 'Subscribed to updates' },
        timestamp: new Date(),
      });
      break;
    default:
      sendMessage(client, {
        type: 'error',
        payload: { message: `Unknown message type: ${msg.type}` },
        timestamp: new Date(),
      });
  }
};

const sendMessage = (client: AuthenticatedWebSocket, message: WSMessage): void => {
  if (client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(message));
  }
};

// Broadcast functions for real-time updates
export const broadcastAgentStatus = (agentId: string, status: AgentStatus): void => {
  const message: WSMessage = {
    type: 'status_update',
    payload: { agentId, status, timestamp: new Date().toISOString() },
    timestamp: new Date(),
  };

  broadcast(message);
};

export const broadcastAgentMessage = (agentId: string, content: string): void => {
  const message: WSMessage = {
    type: 'agent_message',
    payload: { agentId, content, timestamp: new Date().toISOString() },
    timestamp: new Date(),
  };

  broadcast(message);
};

export const broadcastTaskUpdate = (task: Task): void => {
  const message: WSMessage = {
    type: 'task_update',
    payload: {
      ...task,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      completedAt: task.completedAt?.toISOString(),
    },
    timestamp: new Date(),
  };

  broadcast(message);
};

export const broadcastNotification = (notification: Notification): void => {
  const message: WSMessage = {
    type: 'notification',
    payload: {
      ...notification,
      createdAt: notification.createdAt.toISOString(),
    },
    timestamp: new Date(),
  };

  // Broadcast to specific user
  for (const client of clients) {
    if (client.userId === notification.userId) {
      sendMessage(client, message);
    }
  }
};

const broadcast = (message: WSMessage): void => {
  const data = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
};

export const getConnectedClientCount = (): number => clients.size;
