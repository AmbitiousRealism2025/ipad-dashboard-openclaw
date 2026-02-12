# iPad Agent Dashboard

A responsive web dashboard for monitoring and commanding AI agents, optimized for iPad.

**Repository:** https://github.com/AmbitiousRealism2025/ipad-dashboard-openclaw

## Status

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ Complete | Core scaffold, auth, agents, WebSocket |
| Phase 2 | ✅ Complete | Real-time updates, RBAC, audit logs |
| Phase 3 | ✅ Complete | Accessibility, PWA, E2E tests |
| Phase 4 | 🔄 In Progress | Extensibility, documentation |

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- An iPad on the same network (for testing)

### Installation

```bash
# Clone the repository
git clone https://github.com/AmbitiousRealism2025/ipad-dashboard-openclaw.git
cd ipad-dashboard-openclaw

# Install all dependencies
make install
# Or manually:
# cd backend && npm install
# cd ../frontend && npm install
```

### Development

```bash
# Start both frontend and backend in development mode
make dev

# Or start individually:
cd backend && npm run dev    # Backend on http://localhost:3001
cd frontend && npm run dev   # Frontend on http://localhost:5173
```

### Production Build

```bash
# Build both frontend and backend
make build
```

### Testing

```bash
# E2E tests (requires frontend dev server running)
cd frontend
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui
```

## Configuration

### Environment Variables

Create a `.env` file in the backend directory (copy from `.env.example`):

```env
# Server
PORT=3001
NODE_ENV=development

# Authentication
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# MCP Agent Connection (optional)
MCP_WS_URL=ws://localhost:8080
```

### Demo Users

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | admin123 | admin |
| viewer@example.com | viewer123 | viewer |
| demo@example.com | demo123 | admin |

## Architecture

```
ipad-dashboard-openclaw/
├── frontend/              # React + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── context/       # React context providers (Auth, WebSocket)
│   │   ├── hooks/         # Custom React hooks
│   │   ├── pages/         # Page components
│   │   └── services/      # API client services
│   ├── public/            # Static assets, PWA manifest, service worker
│   └── e2e/               # Playwright E2E tests
│
├── backend/               # Express + TypeScript
│   ├── src/
│   │   ├── adapters/      # Agent type adapters (extensible)
│   │   ├── middleware/    # Auth, RBAC, rate limiting, validation
│   │   ├── routes/        # API route handlers
│   │   ├── services/      # Business logic (MCP, WebSocket, session)
│   │   └── types/         # TypeScript type definitions
│   └── logs/              # Audit logs (generated)
│
├── docs/                  # Architecture decisions, roadmap
├── schemas/               # MCP schema documentation
├── progress.md            # Detailed progress tracker
└── Makefile               # Common commands
```

## Features

### Core Features (Complete)
- ✅ JWT authentication with refresh tokens
- ✅ Real-time agent status via WebSocket
- ✅ Command dispatch with response display
- ✅ Task/job tracking with filtering
- ✅ Notifications center
- ✅ Role-based access control (viewer/admin)
- ✅ Session management with revocation
- ✅ Audit logging
- ✅ Rate limiting

### UX Features (Complete)
- ✅ Offline detection with banner
- ✅ Toast notifications
- ✅ Empty states for all lists
- ✅ Command history with keyboard navigation
- ✅ Message stream per agent

### Quality Features (Complete)
- ✅ Accessibility (ARIA labels, skip links, keyboard nav)
- ✅ Lazy-loaded routes (code splitting)
- ✅ PWA support (manifest, service worker)
- ✅ E2E test setup with Playwright

### Extensibility (In Progress)
- ✅ Agent adapter interface for new agent types
- ✅ Architecture Decision Records
- ✅ Expansion roadmap
- 🔄 Real MCP integration

## API Endpoints

See [API.md](./API.md) for complete API documentation.

### Quick Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Login |
| `/api/auth/refresh` | POST | Refresh token |
| `/api/agents` | GET | List agents |
| `/api/agents/:id/command` | POST | Send command |
| `/api/tasks` | GET/POST | List/create tasks |
| `/api/notifications` | GET | List notifications |

### WebSocket Events

| Event | Description |
|-------|-------------|
| `status_update` | Agent status changed |
| `agent_message` | Message from agent |
| `task_update` | Task status changed |
| `notification` | New notification |

## iPad Access

### Local Network Access

1. Find your machine's local IP:
   ```bash
   ipconfig getifaddr en0  # macOS
   ```

2. On iPad Safari, navigate to: `http://<your-ip>:5173`

### Add to Home Screen

1. Open dashboard in Safari
2. Tap Share → "Add to Home Screen"
3. Name it "Agent Dashboard"

## Adding New Agent Types

The system uses an adapter pattern for agent types. To add a new agent:

1. Create a new adapter in `backend/src/adapters/`:

```typescript
import { BaseAgentAdapter, AgentConfig, type CommandRequest } from '../services/agentAdapter';
import type { Agent, AgentStatus, CommandResponse } from '../types';

export class MyAgentAdapter extends BaseAgentAdapter {
  readonly type = 'my-agent';
  readonly displayName = 'My Custom Agent';

  async connect(config: AgentConfig): Promise<Agent> { /* ... */ }
  async disconnect(agentId: string): Promise<void> { /* ... */ }
  async sendCommand(agentId: string, request: CommandRequest): Promise<CommandResponse> { /* ... */ }
  async getStatus(agentId: string): Promise<AgentStatus> { /* ... */ }
}
```

2. Register in the adapter registry (see `agentAdapter.ts`)

See `backend/src/adapters/AtreidesAdapter.ts` for a complete example.

## Development Commands

```bash
make install     # Install dependencies
make dev         # Start dev servers
make build       # Build for production
make docker-up   # Start with Docker
make docker-down # Stop Docker
```

## Documentation

| File | Description |
|------|-------------|
| [README.md](./README.md) | This file - project overview |
| [CLAUDE.md](./CLAUDE.md) | Claude Code instructions |
| [API.md](./API.md) | Complete API reference |
| [docs/ADR.md](./docs/ADR.md) | Architecture decisions |
| [docs/ROADMAP.md](./docs/ROADMAP.md) | Future features |
| [MVP-CHECKLIST.md](./MVP-CHECKLIST.md) | Success criteria |
| [progress.md](./progress.md) | Detailed progress tracker |

## Security Notes

- **Change JWT_SECRET** in production
- Use HTTPS in production (Tailscale or reverse proxy)
- Disable or change demo users in production
- Audit logs stored in `backend/logs/audit.log`
- Rate limiting: 60 req/min general, 5 req/min auth

## Known Limitations

1. **In-memory storage** - Data lost on restart (PostgreSQL for production)
2. **Demo agents only** - No real MCP connections yet
3. **No database** - Production requires PostgreSQL/Redis
4. **No HTTPS** - Development only; production needs TLS

## License

MIT
