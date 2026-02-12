// Agent types
export interface Agent {
  id: string;
  name: string;
  type: 'atreides' | 'sisyphus' | 'custom';
  status: AgentStatus;
  lastSeen: string;
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
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
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
  createdAt: string;
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
  name?: string;
  role: UserRole;
}

export type UserRole = 'viewer' | 'admin';

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface AuthTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

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

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface AgentsResponse {
  agents: Agent[];
  total: number;
}

export interface TasksResponse {
  tasks: Task[];
  total: number;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

// WebSocket message types
export interface WSMessage<T = unknown> {
  type: WSEventType;
  payload: T;
  timestamp: string;
}

export type WSEventType =
  | 'status_update'
  | 'agent_message'
  | 'task_update'
  | 'notification'
  | 'error'
  | 'pong';
