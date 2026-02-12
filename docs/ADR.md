# Architecture Decision Records (ADR)

This document captures the key architectural decisions made during the development of the iPad Agent Dashboard.

---

## ADR-001: Frontend Framework Selection

**Status:** Accepted
**Date:** 2026-02-12
**Decision Makers:** Development Team

### Context

We needed a frontend framework that supports:
- TypeScript for type safety
- Component-based architecture
- Responsive design optimized for iPad
- Fast development and build times
- Good ecosystem for state management and routing

### Decision

Selected **React with Vite** as the frontend framework.

### Rationale

| Option | Pros | Cons |
|--------|------|------|
| React + Vite | Industry standard, great DX, fast HMR, mature ecosystem | Larger bundle size than Vue |
| Vue + Vite | Smaller bundle, simpler learning curve | Smaller ecosystem, fewer contributors |
| Svelte | Smallest bundle, compiled | Smaller ecosystem, fewer resources |
| Next.js | SSR, full-stack capabilities | Overkill for SPA, complexity |

React + Vite provides the best balance of developer experience, ecosystem maturity, and performance for a SPA dashboard.

### Consequences

- Use React 19 with hooks
- Use TanStack Query for server state
- Use React Router for client-side routing
- Tailwind CSS v4 for styling

---

## ADR-002: Backend Framework Selection

**Status:** Accepted
**Date:** 2026-02-12

### Context

We needed a backend framework that:
- Uses the same language as frontend (TypeScript)
- Supports WebSocket for real-time communication
- Has good middleware ecosystem
- Is lightweight and fast

### Decision

Selected **Node.js with Express 5** as the backend framework.

### Rationale

| Option | Pros | Cons |
|--------|------|------|
| Express | Minimal, flexible, huge ecosystem | Requires more setup |
| Fastify | Faster, built-in validation | Smaller ecosystem |
| NestJS | Full framework, DI, decorators | Overkill for MVP |
| Python/FastAPI | Great async, data science | Different language from frontend |

Express provides the flexibility needed while sharing TypeScript with the frontend, making full-stack development seamless.

### Consequences

- Use Express 5 with async error handling
- Custom middleware for auth, rate limiting, RBAC
- Zod for request validation
- WebSocket via ws library

---

## ADR-003: Authentication Strategy

**Status:** Accepted
**Date:** 2026-02-12

### Context

We needed authentication that:
- Works with WebSocket connections
- Supports multiple sessions per user
- Allows token revocation
- Is stateless where possible

### Decision

Selected **JWT with Access + Refresh Tokens** pattern.

### Rationale

| Option | Pros | Cons |
|--------|------|------|
| JWT only | Stateless, scalable | Can't revoke easily |
| Session cookies | Simple, revocable | Requires sticky sessions |
| JWT + Refresh | Balance of stateless + revocable | More complexity |
| OAuth2 | Delegated auth, no password handling | External dependency, overkill |

JWT with refresh tokens provides stateless access tokens (15min expiry) while allowing session management through revocable refresh tokens.

### Consequences

- Access tokens: 15 minutes expiry
- Refresh tokens: 7 days expiry, stored in session manager
- Max 5 sessions per user
- Admin can revoke sessions
- WebSocket auth via token in query string

---

## ADR-004: CSS Framework

**Status:** Accepted
**Date:** 2026-02-12

### Context

We needed styling that:
- Supports responsive iPad-first design
- Allows rapid prototyping
- Has dark mode support
- Produces small production bundles

### Decision

Selected **Tailwind CSS v4**.

### Rationale

| Option | Pros | Cons |
|--------|------|------|
| Tailwind v4 | Utility-first, JIT, smallest bundle | Learning curve |
| CSS Modules | Scoped, familiar | More boilerplate |
| Styled Components | CSS-in-JS, dynamic | Runtime cost, larger bundle |
| plain CSS | No dependencies | More boilerplate |

Tailwind CSS v4 with its new engine provides the best performance and developer experience for component-based styling.

### Consequences

- Use utility classes for all styling
- Custom theme for brand colors
- Dark mode via class strategy
- Touch targets minimum 44x44px for iPad

---

## ADR-005: Hosting Strategy

**Status:** Accepted
**Date:** 2026-02-12

### Context

We needed hosting that:
- Keeps the dashboard private (internal tool)
- Allows access from iPad on local network
- Supports WebSocket connections
- Is cost-effective

### Decision

Selected **Self-hosted VPS with Tailscale**.

### Rationale

| Option | Pros | Cons |
|--------|------|------|
| Self-hosted VPS | Full control, low cost | Requires ops knowledge |
| Cloud (Fly/Railway) | Easy deploy, managed | Public by default |
| On-premise | Full control, no internet needed | Hardware management |

Self-hosting with Tailscale mesh VPN provides secure private access without exposing the dashboard to the public internet.

### Consequences

- Deploy to a VPS (DigitalOcean, Linode, etc.)
- Use Tailscale for secure private access
- Use nginx/Caddy as reverse proxy
- HTTPS via Let's Encrypt or Tailscale

---

## ADR-006: MCP Transport Protocol

**Status:** Accepted
**Date:** 2026-02-12

### Context

We needed a protocol for agent communication that:
- Supports bidirectional real-time communication
- Works with the Model Context Protocol
- Allows pushing updates from agents

### Decision

Selected **WebSocket** as the MCP transport.

### Rationale

| Option | Pros | Cons |
|--------|------|------|
| WebSocket | Bidirectional, low latency | Connection management |
| HTTP polling | Simple, works everywhere | Higher latency, more requests |
| Server-Sent Events | Server push, simple | Unidirectional |
| gRPC streaming | Efficient, typed | More complex setup |

WebSocket provides true bidirectional communication needed for real-time agent status and command dispatch.

### Consequences

- Single WebSocket connection per client
- Message types: status_update, agent_message, task_update, notification
- Reconnection logic on client side
- JWT authentication in WebSocket handshake

---

## ADR-007: State Management

**Status:** Accepted
**Date:** 2026-02-12

### Context

We needed state management for:
- Server state (agents, tasks, notifications)
- Client state (UI, forms)
- Real-time updates

### Decision

Selected **TanStack Query + React Context**.

### Rationale

| Option | Pros | Cons |
|--------|------|------|
| TanStack Query | Server state, caching, invalidation | Learning curve |
| Redux | Predictable, devtools | Boilerplate, overkill |
| Zustand | Simple, lightweight | No server state handling |
| Context only | Built-in | Performance issues, no caching |

TanStack Query handles server state with caching and real-time invalidation, while React Context manages client-side state like auth.

### Consequences

- TanStack Query for all API data
- React Query DevTools in development
- Context for auth and WebSocket connection
- Optimistic updates where appropriate

---

## ADR-008: Database Strategy (Deferred)

**Status:** Proposed
**Date:** 2026-02-12

### Context

The MVP uses in-memory storage which is lost on restart.

### Decision

**PostgreSQL + Redis** for production.

### Rationale

- PostgreSQL: Primary data store (users, agents, tasks, notifications)
- Redis: Session storage, rate limiting counters, WebSocket pub/sub

This will be implemented when moving to production deployment.

---

## Summary

| Decision | Choice | Primary Reason |
|----------|--------|----------------|
| Frontend | React + Vite | Ecosystem, DX |
| Backend | Express + TypeScript | Same language as frontend |
| Auth | JWT + Refresh | Stateless + revocable |
| CSS | Tailwind CSS v4 | Performance, utility-first |
| Hosting | Self-hosted + Tailscale | Private, cost-effective |
| MCP Transport | WebSocket | Bidirectional real-time |
| State | TanStack Query | Server state management |
| Database (prod) | PostgreSQL + Redis | Persistence + performance |
