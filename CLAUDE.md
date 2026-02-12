# iPad Agent Dashboard - Claude Code Instructions

This file contains project-specific instructions for Claude Code when working on this codebase.

## Project Overview

An **iPad Agent Dashboard MVP** for monitoring and commanding AI agents (Atreides, Sisyphus, etc.) via a web interface optimized for iPad. The system uses MCP (Model Context Protocol) for agent communication.

**Repository:** https://github.com/AmbitiousRealism2025/ipad-dashboard-openclaw

## Current Status

| Phase | Status | Key Deliverables |
|-------|--------|-----------------|
| Phase 1 | ✅ Complete | Core scaffold, auth, agents, WebSocket |
| Phase 2 | ✅ Complete | Real-time updates, RBAC, session management, audit logs |
| Phase 3 | ✅ Complete | Accessibility, PWA, E2E tests, performance |
| Phase 4 | 🔄 In Progress | Agent adapters, ADR, roadmap |

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | React 19 + Vite + TypeScript | Lazy-loaded routes |
| Styling | Tailwind CSS v4 | Custom theme in index.css |
| State | TanStack Query + React Context | Server + client state |
| Backend | Express 5 + TypeScript | Async error handling |
| Auth | JWT (access + refresh) | 15min access, 7day refresh |
| Real-time | WebSocket | JWT auth in handshake |
| Testing | Playwright | E2E tests in frontend/e2e/ |

## Project Structure

```
ipad-dashboard-openclaw/
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI (Layout, Toast, EmptyState, etc.)
│   │   ├── context/        # AuthContext, WebSocketContext
│   │   ├── hooks/          # useAgentStatus, useNotifications, useTaskUpdates
│   │   ├── pages/          # Dashboard, Agents, Tasks, Notifications, Login
│   │   ├── services/       # api.ts, websocket.ts
│   │   └── types/          # TypeScript interfaces
│   ├── public/             # manifest.json, sw.js (PWA)
│   ├── e2e/                # Playwright tests
│   └── playwright.config.ts
│
├── backend/
│   ├── src/
│   │   ├── adapters/       # Agent type adapters (Atreides, Sisyphus)
│   │   ├── middleware/     # auth, rbac, rateLimit, validation
│   │   ├── routes/         # agents, auth, tasks, notifications
│   │   ├── services/       # mcp, websocket, sessionManager, auditLog, agentAdapter
│   │   └── types/          # TypeScript interfaces
│   └── logs/               # audit.log (generated)
│
├── docs/
│   ├── ADR.md              # Architecture Decision Records
│   └── ROADMAP.md          # Future features and priorities
│
├── schemas/                # MCP schema documentation
├── README.md               # Project overview
├── API.md                  # Complete API reference
├── MVP-CHECKLIST.md        # Success criteria
├── progress.md             # Detailed progress tracker
├── Makefile                # Common commands
└── docker-compose.yml      # Docker configuration
```

## Development Commands

```bash
# Development
make dev              # Start both servers
cd backend && npm run dev
cd frontend && npm run dev

# Production
make build            # Build both
make docker-up        # Start with Docker

# Testing
cd frontend && npm run test:e2e      # Run E2E tests
cd frontend && npm run test:e2e:ui   # Run with Playwright UI

# Linting
cd frontend && npm run lint
cd backend && npm run lint
```

## Key Files to Know

| File | Purpose | When to Edit |
|------|---------|--------------|
| `progress.md` | Track phase completion | After each major change |
| `backend/src/services/agentAdapter.ts` | Agent adapter interface | Adding new agent types |
| `backend/src/middleware/auth.ts` | JWT validation | Auth changes |
| `frontend/src/context/AuthContext.tsx` | Auth state | Login/logout changes |
| `frontend/src/context/WebSocketContext.tsx` | WS connection | Real-time changes |
| `frontend/src/index.css` | Tailwind theme | Color/design changes |

## Coding Conventions

### TypeScript
- Strict mode enabled
- Use type imports: `import type { X } from './types'`
- Prefer interfaces over types for objects
- Use const assertions for literal types

### React
- Functional components only
- Use React Query for server state
- Use context for global client state (auth, websocket)
- Extract hooks for complex logic

### Tailwind CSS v4
- `@import "tailwindcss"` in index.css
- Custom theme via `@theme` directive
- iPad-first responsive (min 1024x768)
- Touch targets: minimum 44x44px

### API Patterns
- REST endpoints under `/api/`
- WebSocket at `/ws`
- JWT in `Authorization: Bearer` header
- Zod validation on all inputs
- Consistent error response format

## Authentication Flow

```
1. POST /api/auth/login → { accessToken, refreshToken, user }
2. Store tokens in localStorage
3. Include accessToken in API requests
4. When 401, POST /api/auth/refresh with refreshToken
5. Store new accessToken, retry request
6. On logout, POST /api/auth/logout
```

**Demo Credentials:**
- `demo@example.com` / `demo123` (admin)
- `viewer@example.com` / `viewer123` (viewer)

## WebSocket Protocol

```typescript
// Connect with JWT token
const ws = new WebSocket('ws://host/ws?token=<jwt>');

// Server → Client messages
{
  type: 'status_update' | 'agent_message' | 'task_update' | 'notification',
  payload: { ... },
  timestamp: '2026-02-12T10:00:00Z'
}

// Client subscribes via useWebSocket hook
const { subscribe, isConnected } = useWebSocket();
useEffect(() => {
  const unsub = subscribe('status_update', handler);
  return unsub;
}, []);
```

## Adding New Agent Types

1. Create adapter in `backend/src/adapters/`:

```typescript
import { BaseAgentAdapter, AgentConfig, type CommandRequest } from '../services/agentAdapter';
import type { Agent, AgentStatus, CommandResponse } from '../types';

export class MyAgentAdapter extends BaseAgentAdapter {
  readonly type = 'my-agent';
  readonly displayName = 'My Agent';

  async connect(config: AgentConfig): Promise<Agent> { /* ... */ }
  async disconnect(agentId: string): Promise<void> { /* ... */ }
  async sendCommand(agentId: string, request: CommandRequest): Promise<CommandResponse> { /* ... */ }
  async getStatus(agentId: string): Promise<AgentStatus> { /* ... */ }
}
```

2. Register adapter at startup

3. Add agent type styling in `frontend/src/pages/AgentsPage.tsx`

See `backend/src/adapters/AtreidesAdapter.ts` for complete example.

## Common Tasks

### Adding a New API Endpoint

1. Define types in `backend/src/types/index.ts`
2. Create route handler in `backend/src/routes/`
3. Add Zod validation schema in `backend/src/middleware/validation.ts`
4. Update API client in `frontend/src/services/api.ts`
5. Add React Query hook if needed
6. Document in `API.md`

### Adding a New Page

1. Create component in `frontend/src/pages/`
2. Add route in `frontend/src/App.tsx`
3. Add nav item in `frontend/src/components/Layout.tsx`
4. Consider lazy loading for performance

### Adding WebSocket Events

1. Define event type in backend
2. Emit from appropriate service
3. Add subscription hook in frontend
4. Update `WebSocketContext.tsx` if needed

## iPad Considerations

- Touch targets: minimum 44x44px (use `.touch-target` class)
- Test resolutions: 1024x768, 1112x834, 1194x834
- Support portrait and landscape
- PWA icons needed: 192x192, 512x512

## Security Checklist

- [ ] Never commit `.env` files
- [ ] JWT_SECRET must be changed in production
- [ ] Use HTTPS in production (Tailscale or reverse proxy)
- [ ] Demo users should be disabled/changed in production
- [ ] Rate limiting is enabled (60 req/min default)
- [ ] Audit logs capture security events

## Deferred Items

These require external resources:

- **iPad hardware testing** - Requires physical device
- **Real MCP integration** - Requires agent endpoints
- **Database persistence** - PostgreSQL + Redis setup
- **Production deployment** - Requires hosting target
- **External security review** - Requires auditor

## When Starting a New Session

1. Read `progress.md` for current status
2. Check `docs/ROADMAP.md` for next priorities
3. Run `make dev` to verify everything works
4. Review any TODO comments in code

## Progress Tracking

**After completing significant work:**

1. Update `progress.md`:
   - Mark tasks complete with ✅
   - Add notes for decisions made
   - List files created/modified

2. Update relevant documentation:
   - `API.md` for API changes
   - `docs/ADR.md` for architectural decisions
   - `README.md` for feature changes

3. Commit with descriptive message

---

*Last updated: 2026-02-12 - Phase 3 Complete, Phase 4 In Progress*
