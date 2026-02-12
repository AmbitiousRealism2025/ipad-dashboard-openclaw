# MCP Message Schema

**Version:** 1.0.0
**Last Updated:** 2026-02-11

## Overview

This document defines the Model Context Protocol (MCP) message schema for communication between the iPad Dashboard backend and agent systems (Atreides, Sisyphus, etc.).

---

## Message Envelope

All MCP messages follow a standard envelope structure:

```typescript
interface MCPMessage<T = unknown> {
  id: string;           // UUID v4 for request/response correlation
  type: MCPMessageType; // Message type identifier
  timestamp: Date;      // ISO 8601 timestamp
  source: string;       // Origin identifier (e.g., "dashboard-backend", "atreides-agent")
  target?: string;      // Destination identifier (optional for broadcasts)
  payload: T;           // Type-specific payload
}

type MCPMessageType =
  | 'status_request'
  | 'status_update'
  | 'command'
  | 'command_response'
  | 'event'
  | 'error';
```

---

## Message Types

### 1. Status Request

Request current status from an agent.

**Request:**
```typescript
interface StatusRequestPayload {
  // Empty payload - agent returns full status
}
```

**Response:**
```typescript
interface StatusUpdatePayload {
  agentId: string;
  status: 'online' | 'offline' | 'busy' | 'error';
  lastSeen: string;       // ISO 8601 timestamp
  capabilities: string[]; // List of supported commands/features
  metadata?: {
    version?: string;
    uptime?: number;      // seconds
    currentTask?: string;
    healthScore?: number; // 0-100
  };
}
```

**Example:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "status_request",
  "timestamp": "2026-02-11T10:30:00Z",
  "source": "dashboard-backend",
  "target": "atreides-agent"
}
```

---

### 2. Status Update

Agent reports its status (response to status_request or proactive update).

**Payload:**
```typescript
interface StatusUpdatePayload {
  agentId: string;
  status: 'online' | 'offline' | 'busy' | 'error';
  lastSeen: string;
  capabilities: string[];
  metadata?: Record<string, unknown>;
}
```

**Example:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "type": "status_update",
  "timestamp": "2026-02-11T10:30:01Z",
  "source": "atreides-agent",
  "target": "dashboard-backend",
  "payload": {
    "agentId": "atreides-001",
    "status": "online",
    "lastSeen": "2026-02-11T10:30:01Z",
    "capabilities": ["research", "analysis", "code-review"],
    "metadata": {
      "version": "1.0.0",
      "uptime": 86400,
      "healthScore": 95
    }
  }
}
```

---

### 3. Command

Send a command to an agent.

**Request:**
```typescript
interface CommandPayload {
  command: string;                    // Command name
  parameters?: Record<string, unknown>; // Command-specific parameters
  correlationId?: string;             // Optional: link to task/notification
}
```

**Response:** See `command_response` below.

**Example:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "type": "command",
  "timestamp": "2026-02-11T10:31:00Z",
  "source": "dashboard-backend",
  "target": "sisyphus-agent",
  "payload": {
    "command": "run_task",
    "parameters": {
      "taskId": "task-123",
      "taskType": "health_check"
    }
  }
}
```

---

### 4. Command Response

Agent responds to a command.

**Payload:**
```typescript
interface CommandResponsePayload {
  requestId: string;       // ID of the original command message
  success: boolean;
  result?: unknown;        // Command-specific result
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  executionTime: number;   // milliseconds
}
```

**Example:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "type": "command_response",
  "timestamp": "2026-02-11T10:31:05Z",
  "source": "sisyphus-agent",
  "target": "dashboard-backend",
  "payload": {
    "requestId": "550e8400-e29b-41d4-a716-446655440002",
    "success": true,
    "result": {
      "taskId": "task-123",
      "status": "completed",
      "output": "All systems operational"
    },
    "executionTime": 234
  }
}
```

---

### 5. Event

Agent emits an event (task completion, error, etc.).

**Payload:**
```typescript
interface EventPayload {
  eventType:
    | 'task_started'
    | 'task_progress'
    | 'task_completed'
    | 'task_failed'
    | 'error'
    | 'warning'
    | 'info';
  agentId: string;
  data: Record<string, unknown>;
}
```

**Example:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440004",
  "type": "event",
  "timestamp": "2026-02-11T10:35:00Z",
  "source": "atreides-agent",
  "target": "dashboard-backend",
  "payload": {
    "eventType": "task_completed",
    "agentId": "atreides-001",
    "data": {
      "taskId": "task-456",
      "result": "Research summary generated",
      "artifacts": ["summary.md"]
    }
  }
}
```

---

### 6. Error

General error message.

**Payload:**
```typescript
interface ErrorPayload {
  code: string;
  message: string;
  details?: unknown;
  recoverable: boolean;
}
```

**Example:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440005",
  "type": "error",
  "timestamp": "2026-02-11T10:40:00Z",
  "source": "sisyphus-agent",
  "target": "dashboard-backend",
  "payload": {
    "code": "TASK_TIMEOUT",
    "message": "Task execution exceeded timeout limit",
    "details": {
      "taskId": "task-789",
      "timeout": 30000
    },
    "recoverable": true
  }
}
```

---

## Agent Registration

Agents should register themselves on startup:

```typescript
interface AgentRegistrationPayload {
  agentId: string;
  name: string;
  type: 'atreides' | 'sisyphus' | 'custom';
  capabilities: string[];
  endpoint: string;        // WebSocket or HTTP endpoint
  metadata?: Record<string, unknown>;
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_COMMAND` | Unknown or malformed command |
| `UNAUTHORIZED` | Agent not authorized for this operation |
| `AGENT_NOT_FOUND` | Target agent does not exist |
| `AGENT_OFFLINE` | Target agent is not connected |
| `TASK_TIMEOUT` | Task execution exceeded time limit |
| `RESOURCE_EXHAUSTED` | Agent at capacity, cannot accept new tasks |
| `INTERNAL_ERROR` | Unexpected agent error |

---

## Transport

- **Primary:** WebSocket for real-time bidirectional communication
- **Fallback:** HTTP REST for simple request/response (Phase 2+)

## Security

- All messages must be authenticated via JWT in handshake
- Sensitive data should be encrypted at the application layer
- Rate limiting: 60 requests/minute per client

---

## Versioning

Schema version is included in the WebSocket handshake:
```
ws://host/ws?version=1.0&token=JWT
```

Breaking changes will increment the major version.
