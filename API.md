# API Reference

Base URL: `http://localhost:3001/api`

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

Access tokens expire after 15 minutes. Use the refresh token to get a new access token.

---

## Auth Endpoints

### POST /auth/login

Authenticate with email and password.

**Request Body:**
```json
{
  "email": "demo@example.com",
  "password": "demo123"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 900,
  "user": {
    "id": "uuid",
    "email": "demo@example.com",
    "name": "Demo User",
    "role": "admin"
  }
}
```

**Error (401):**
```json
{
  "error": "Invalid credentials"
}
```

### POST /auth/logout

Logout and invalidate session.

**Request Body (optional):**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

### POST /auth/refresh

Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 900
}
```

### GET /auth/me

Get current authenticated user.

**Response (200):**
```json
{
  "id": "uuid",
  "email": "demo@example.com",
  "role": "admin"
}
```

### GET /auth/sessions

List active sessions for current user.

**Response (200):**
```json
{
  "sessions": [
    {
      "id": "session-uuid",
      "createdAt": "2026-02-12T10:00:00Z",
      "userAgent": "Mozilla/5.0...",
      "ip": "192.168.1.1"
    }
  ]
}
```

### POST /auth/revoke (Admin Only)

Revoke another user's sessions.

**Request Body:**
```json
{
  "userId": "user-uuid"
}
// or
{
  "refreshToken": "token-to-revoke"
}
```

**Response (200):**
```json
{
  "message": "Sessions revoked successfully",
  "revokedCount": 2
}
```

---

## Agent Endpoints

### GET /agents

List all registered agents.

**Response (200):**
```json
{
  "agents": [
    {
      "id": "agent-uuid",
      "name": "Atreides",
      "type": "atreides",
      "status": "online",
      "lastSeen": "2026-02-12T10:00:00Z",
      "capabilities": ["research", "analysis", "code-review"],
      "metadata": {
        "version": "1.0.0"
      }
    }
  ],
  "total": 2
}
```

### GET /agents/:id

Get a specific agent by ID.

**Response (200):**
```json
{
  "id": "agent-uuid",
  "name": "Atreides",
  "type": "atreides",
  "status": "online",
  "lastSeen": "2026-02-12T10:00:00Z",
  "capabilities": ["research", "analysis", "code-review"],
  "metadata": {
    "version": "1.0.0"
  }
}
```

**Error (404):**
```json
{
  "error": "Agent not found"
}
```

### POST /agents/:id/command

Send a command to an agent.

**Request Body:**
```json
{
  "command": "research",
  "parameters": {
    "topic": "quantum computing"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "result": {
    "status": "acknowledged",
    "taskId": "task-uuid"
  },
  "executionTime": 45
}
```

**Error (400):**
```json
{
  "success": false,
  "error": "Agent is offline",
  "executionTime": 0
}
```

### PUT /agents/:id/status

Update agent status (used by MCP layer).

**Request Body:**
```json
{
  "status": "busy"
}
```

**Response (200):**
```json
{
  "id": "agent-uuid",
  "status": "busy",
  "lastSeen": "2026-02-12T10:05:00Z"
}
```

---

## Task Endpoints

### GET /tasks

List all tasks.

**Query Parameters:**
- `status` - Filter by status (queued, running, completed, failed, cancelled)
- `agentId` - Filter by agent ID

**Response (200):**
```json
{
  "tasks": [
    {
      "id": "task-uuid",
      "name": "Research Task",
      "description": "Research quantum computing",
      "status": "running",
      "agentId": "agent-uuid",
      "progress": 50,
      "createdAt": "2026-02-12T10:00:00Z",
      "completedAt": null,
      "error": null
    }
  ],
  "total": 5
}
```

### GET /tasks/:id

Get task details.

**Response (200):**
```json
{
  "id": "task-uuid",
  "name": "Research Task",
  "description": "Research quantum computing",
  "status": "completed",
  "agentId": "agent-uuid",
  "progress": 100,
  "createdAt": "2026-02-12T10:00:00Z",
  "completedAt": "2026-02-12T10:05:00Z",
  "result": {
    "summary": "Quantum computing research completed..."
  },
  "error": null
}
```

### POST /tasks

Create a new task.

**Request Body:**
```json
{
  "name": "New Task",
  "description": "Task description",
  "agentId": "agent-uuid"
}
```

**Response (201):**
```json
{
  "id": "task-uuid",
  "name": "New Task",
  "status": "queued",
  "progress": 0,
  "createdAt": "2026-02-12T10:00:00Z"
}
```

### PUT /tasks/:id

Update task status/progress.

**Request Body:**
```json
{
  "status": "running",
  "progress": 75
}
```

**Response (200):**
```json
{
  "id": "task-uuid",
  "status": "running",
  "progress": 75
}
```

---

## Notification Endpoints

### GET /notifications

List notifications for current user.

**Query Parameters:**
- `unreadOnly` - Only return unread notifications (default: true)

**Response (200):**
```json
{
  "notifications": [
    {
      "id": "notif-uuid",
      "type": "task_complete",
      "title": "Task Completed",
      "message": "Research task finished successfully",
      "read": false,
      "createdAt": "2026-02-12T10:05:00Z"
    }
  ],
  "unreadCount": 3,
  "total": 10
}
```

### POST /notifications/:id/read

Mark a notification as read.

**Response (200):**
```json
{
  "success": true
}
```

### POST /notifications/read-all

Mark all notifications as read.

**Response (200):**
```json
{
  "success": true,
  "updatedCount": 3
}
```

---

## WebSocket Events

Connect to: `ws://localhost:3001/ws`

Include access token in query string or handshake:
```
ws://localhost:3001/ws?token=<access_token>
```

### Client → Server Events

None currently defined. Server pushes events to clients.

### Server → Client Events

#### status_update

Agent status changed.

```json
{
  "type": "status_update",
  "payload": {
    "agentId": "agent-uuid",
    "status": "online",
    "timestamp": "2026-02-12T10:00:00Z"
  }
}
```

#### agent_message

New message from agent.

```json
{
  "type": "agent_message",
  "payload": {
    "agentId": "agent-uuid",
    "content": "Task completed successfully",
    "timestamp": "2026-02-12T10:05:00Z"
  }
}
```

#### task_update

Task status changed.

```json
{
  "type": "task_update",
  "payload": {
    "taskId": "task-uuid",
    "status": "completed",
    "progress": 100,
    "timestamp": "2026-02-12T10:05:00Z"
  }
}
```

#### notification

New notification.

```json
{
  "type": "notification",
  "payload": {
    "id": "notif-uuid",
    "type": "task_complete",
    "title": "Task Completed",
    "message": "Research task finished",
    "timestamp": "2026-02-12T10:05:00Z"
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request body"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid token"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions",
  "required": ["admin"],
  "current": "viewer"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "Too many requests, please try again later"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Rate Limiting

| Endpoint Type | Rate Limit |
|--------------|------------|
| General | 60 requests/minute |
| Auth | 5 requests/minute |
| Commands | 30 requests/minute |

Rate limit headers are included in responses:
- `X-RateLimit-Limit` - Maximum requests per window
- `X-RateLimit-Remaining` - Requests remaining in current window
- `X-RateLimit-Reset` - Unix timestamp when window resets

---

## Roles & Permissions

| Permission | Viewer | Admin |
|------------|--------|-------|
| View Agents | ✅ | ✅ |
| View Tasks | ✅ | ✅ |
| View Notifications | ✅ | ✅ |
| Send Commands | ❌ | ✅ |
| Manage Agents | ❌ | ✅ |
| Manage Users | ❌ | ✅ |
| View Audit Logs | ❌ | ✅ |
| Revoke Sessions | ❌ | ✅ |
