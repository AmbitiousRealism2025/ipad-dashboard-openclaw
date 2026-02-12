import type { WSMessage } from '../types';

type MessageHandler = (message: WSMessage) => void;
type ConnectionHandler = (connected: boolean) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: Set<MessageHandler> = new Set();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
    this.url = wsUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      const tokenParam = this.token ? `?token=${this.token}` : '';
      const wsUrl = `${this.url}/ws${tokenParam}`;

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('[WS] Connected');
          this.reconnectAttempts = 0;
          this.notifyConnectionHandlers(true);
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as WSMessage;
            this.messageHandlers.forEach((handler) => handler(message));
          } catch (error) {
            console.error('[WS] Failed to parse message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('[WS] Disconnected:', event.code, event.reason);
          this.notifyConnectionHandlers(false);
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('[WS] Error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnect
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[WS] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect().catch(console.error);
    }, delay);
  }

  send(message: unknown) {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    this.ws.send(JSON.stringify(message));
  }

  subscribe(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  onConnectionChange(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    return () => {
      this.connectionHandlers.delete(handler);
    };
  }

  private notifyConnectionHandlers(connected: boolean) {
    this.connectionHandlers.forEach((handler) => handler(connected));
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const wsService = new WebSocketService();
export default wsService;
