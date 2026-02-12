# iPad Dashboard MVP - Claude Code Instructions

This file contains project-specific instructions for Claude Code when working on this codebase.

## Project Overview

This is an **iPad Agent Dashboard MVP** for monitoring and commanding AI agents (Atreides, Sisyphus, etc.) via a web interface optimized for iPad. The system uses MCP (Model Context Protocol) for agent communication.

## Tech Stack

- **Frontend:** React 19 + Vite + TypeScript + Tailwind CSS v4
- **Backend:** Node.js + Express 5 + TypeScript
- **Auth:** JWT (access + refresh tokens)
- **Real-time:** WebSocket with JWT authentication
- **State:** React Query (TanStack Query)
- **Hosting:** Self-hosted VPS + Tailscale

## Project Structure

```
ipad-dashboard-atgy/
├── backend/           # Express API server
│   ├── src/
│   │   ├── routes/    # API endpoints
│   │   ├── middleware/# Auth middleware
│   │   ├── services/  # MCP client, WebSocket
│   │   └── types/     # TypeScript types
│   └── dist/          # Compiled output
├── frontend/          # React app
│   ├── src/
│   │   ├── pages/     # Route pages
│   │   ├── components/# Reusable components
│   │   ├── context/   # React contexts
│   │   ├── services/  # API & WebSocket clients
│   │   └── types/     # TypeScript types
│   └── dist/          # Production build
├── schemas/           # Documentation (MCP schema)
├── docs/              # Additional documentation
├── progress.md        # Progress tracker (UPDATE AFTER EACH PHASE)
├── docker-compose.yml # Docker configuration
└── Makefile           # Common commands
```

## Development Commands

```bash
# Start both servers
make dev

# Build for production
make build

# Install dependencies
make install

# Docker
make docker-up
make docker-down
```

## Important Files

| File | Purpose |
|------|---------|
| `progress.md` | Track phase completion - **UPDATE AFTER EACH PHASE** |
| `schemas/mcp-schema.md` | MCP message format documentation |
| `.env.example` | Environment variable template |

## Coding Conventions

### TypeScript
- Use strict mode
- Prefer type imports: `import type { X } from './types'`
- Use const assertions for literal types

### React
- Functional components with hooks
- Use React Query for server state
- Use context for global client state (auth)

### Tailwind CSS v4
- Use `@import "tailwindcss"` in CSS
- Custom theme via `@theme` directive
- iPad-first responsive design (min 1024x768)

### API
- REST endpoints under `/api/`
- WebSocket at `/ws`
- JWT in `Authorization: Bearer` header
- All protected routes require authentication

## Agent Integration

Agents communicate via MCP (Model Context Protocol). See `schemas/mcp-schema.md` for message formats.

**Demo Agents:**
- Atreides (research, analysis, code-review)
- Sisyphus (task-execution, automation, monitoring)

## Authentication

- **Access tokens:** 15 minutes
- **Refresh tokens:** 7 days
- Stored in localStorage (Phase 2: move to httpOnly cookies)
- Demo: `demo@example.com` / `demo123`

## WebSocket Protocol

```typescript
// Connect with JWT
ws://host/ws?token=<jwt>

// Message format
{
  type: 'status_update' | 'agent_message' | 'task_update' | 'notification',
  payload: any,
  timestamp: string
}
```

## iPad Considerations

- Touch targets: minimum 44x44px
- Test at resolutions: 1024x768, 1112x834, 1194x834
- Support both portrait and landscape
- Consider PWA for home screen installation

## Progress Tracking

**After completing each phase:**

1. Update `progress.md` with:
   - Mark all completed tasks with ✅
   - Add notes for any deviations or decisions
   - List files created/modified
   - Document any blockers or deferred items

2. The `progress.md` file should be the single source of truth for project status.

## Security Notes

- Never commit `.env` files
- JWT secret must be changed in production
- TLS is required for production (Phase 3)
- Audit logging enabled in Phase 2

---

*Last updated: 2026-02-12 - Phase 1 Complete*
