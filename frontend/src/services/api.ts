const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiService {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Health check
  async health() {
    return this.request<{ status: string; timestamp: string }>('/health');
  }

  // Auth
  async login(email: string, password: string) {
    return this.request<{ accessToken: string; refreshToken: string; expiresIn: number; user: { id: string; email: string; name: string; role: string } }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout(refreshToken: string) {
    return this.request<{ message: string }>('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async refreshToken(refreshToken: string) {
    return this.request<{ accessToken: string; expiresIn: number }>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async getCurrentUser() {
    return this.request<{ id: string; email: string; role: string }>('/api/auth/me');
  }

  // Agents
  async getAgents() {
    return this.request<{ agents: import('../types').Agent[]; total: number }>('/api/agents');
  }

  async getAgent(id: string) {
    return this.request<import('../types').Agent>(`/api/agents/${id}`);
  }

  async sendCommand(agentId: string, command: string, parameters?: Record<string, unknown>) {
    return this.request<import('../types').CommandResponse>(`/api/agents/${agentId}/command`, {
      method: 'POST',
      body: JSON.stringify({ agentId, command, parameters }),
    });
  }

  // Tasks
  async getTasks() {
    return this.request<{ tasks: import('../types').Task[]; total: number }>('/api/tasks');
  }

  async getTask(id: string) {
    return this.request<import('../types').Task>(`/api/tasks/${id}`);
  }

  async createTask(name: string, agentId: string, description?: string) {
    return this.request<import('../types').Task>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ name, agentId, description }),
    });
  }

  // Notifications
  async getNotifications() {
    return this.request<{ notifications: import('../types').Notification[]; unreadCount: number }>('/api/notifications');
  }

  async markNotificationRead(id: string) {
    return this.request<{ message: string }>(`/api/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsRead() {
    return this.request<{ message: string }>('/api/notifications/read-all', {
      method: 'PUT',
    });
  }
}

export const api = new ApiService(API_URL);
export default api;
