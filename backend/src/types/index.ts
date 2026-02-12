// Agent types
export interface Agent {
  id: string;
  name: string;
  type: 'atreides' | 'sisyphus' | 'custom';
  status: AgentStatus;
  lastSeen: Date;
  capabilities: string[];
  metadata?: Record<string, unknown>;
}

export type AgentStatus = 'online' | 'offline' | 'busy' | 'error';

// Task types
export interface Task {
  id: string;
  name: string;
  description?: string;
  agentId: string;
  status: TaskStatus;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  error?: string;
}

export type TaskStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

// Notification types
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  userId: string;
  read: boolean;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

export type NotificationType =
  | 'agent_error'
  | 'task_complete'
  | 'task_failed'
  | 'security_alert'
  | 'system';

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
}

export type UserRole = 'viewer' | 'admin';

// Auth types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// MCP message types (defined in schema)
export interface MCPMessage<T = unknown> {
  id: string;
  type: MCPMessageType;
  timestamp: Date;
  source: string;
  target?: string;
  payload: T;
}

export type MCPMessageType =
  | 'status_request'
  | 'status_update'
  | 'command'
  | 'command_response'
  | 'event'
  | 'error';

// WebSocket message types
export interface WSMessage<T = unknown> {
  type: WSEventType;
  payload: T;
  timestamp: Date;
}

export type WSEventType =
  | 'status_update'
  | 'agent_message'
  | 'task_update'
  | 'notification'
  | 'error'
  | 'pong';

// Command types
export interface CommandRequest {
  agentId: string;
  command: string;
  parameters?: Record<string, unknown>;
}

export interface CommandResponse {
  success: boolean;
  result?: unknown;
  error?: string;
  executionTime: number;
}
