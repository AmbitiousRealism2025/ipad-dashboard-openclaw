# iPad Dashboard MVP — Phased Execution Plan

Date: 2026-02-11
Owner: Duncan / OpenClaw Flock
Source: MASTER-PLAN.md, ipad-dashboard-mvp.md, diagram.md, summary.md

---

## How to Read This Plan

- **Workstreams** are grouped within each phase: Frontend, Backend, Integration, Security, DevOps.
- Tasks within a workstream are sequential unless marked `[PARALLEL]`.
- Cross-workstream parallelism is called out at the top of each phase.
- Dependencies on tasks from other workstreams use `[DEPENDS: task-id]`.
- Each phase ends with a **Milestone Checkpoint** and **Definition of Done**.

---

## Phase 1: Foundations (Week 1)

**Goal:** Standing scaffold — frontend renders, backend serves, auth works, two agents respond via MCP.

### Parallel Tracks

```
Track A: Frontend Scaffold ─────────────────────┐
Track B: Backend API + WebSocket Server ─────────┤─→ Integration smoke test (end of week)
Track C: Security / Auth Flow ───────────────────┘
Track D: DevOps / Environment Setup ──── (runs independently all week)
```

Tracks A, B, and D can start simultaneously on Day 1. Track C can start on Day 1 but its frontend integration depends on Track A having a login page.

### Frontend (Track A)

| ID | Task | Detail | Depends |
|----|------|--------|---------|
| F1.1 | Initialize frontend project | React (Vite) or Vue; configure TypeScript, linting, Tailwind/CSS framework. Commit to repo. | — |
| F1.2 | Create app shell and routing | Top-level layout with sidebar/nav placeholder, route structure for `/dashboard`, `/agents`, `/login`. Responsive grid targeting iPad viewport (1024×768 min). | F1.1 |
| F1.3 | Build login page | Email/password form, loading state, error display. Wire to auth endpoint (mock until B1.3 ready). | F1.2 |
| F1.4 | Build agent list view | Fetch and display agents from REST endpoint. Show name, status badge (online/offline/busy), last-seen timestamp. Use mock data until B1.2 is live. | F1.2 |
| F1.5 | Build basic command input component | Text input + send button scoped to a selected agent. POST to command endpoint. Display raw response. | F1.4 |

### Backend (Track B)

| ID | Task | Detail | Depends |
|----|------|--------|---------|
| B1.1 | Initialize backend project | Node/Express or Python/FastAPI; configure project structure, env vars, logging. Commit to repo. | — |
| B1.2 | Implement REST endpoints: agent list, agent detail | `GET /api/agents`, `GET /api/agents/:id`. Return hardcoded seed data initially, then swap to live MCP data. | B1.1 |
| B1.3 | Implement auth endpoints | `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`. Issue JWT access + refresh tokens. | B1.1 |
| B1.4 | Stand up WebSocket server | Basic WS endpoint at `/ws`. Accept connections, echo test. Authenticate connections via JWT in handshake. | B1.1, S1.2 |
| B1.5 | Implement command dispatch endpoint | `POST /api/agents/:id/command`. Accept command text, forward to MCP layer (I1.2), return response. | B1.2, I1.2 |

### Integration (Track C — starts mid-week after B1.2)

| ID | Task | Detail | Depends |
|----|------|--------|---------|
| I1.1 | Define MCP message schema | Document request/response envelope for agent status queries and command dispatch. Agree on message types: `status_request`, `command`, `status_update`. | — |
| I1.2 | Wire MCP client into backend | Backend connects to MCP endpoint(s). Implement `getAgentStatus()` and `sendCommand(agentId, text)` adapter functions. | B1.1, I1.1 |
| I1.3 | Connect two sample agents | Configure Atreides and/or Sisyphus-style agents to register with MCP and respond to status/command messages. Validate round-trip. | I1.2 |

### Security (Track D — auth tasks parallel with Tracks A/B)

| ID | Task | Detail | Depends |
|----|------|--------|---------|
| S1.1 | Choose and configure auth strategy | Decide OAuth2 vs. local JWT. Document token lifetimes, refresh strategy, storage (httpOnly cookie vs. localStorage). | — |
| S1.2 | Implement JWT issuance and validation middleware | Backend middleware that validates `Authorization: Bearer <token>` on protected routes. Reject expired/malformed tokens. | B1.1, S1.1 |
| S1.3 | Enable TLS for local dev | Self-signed cert or mkcert for HTTPS in dev. Document production TLS plan. | D1.1 |

### DevOps (Track E — independent)

| ID | Task | Detail | Depends |
|----|------|--------|---------|
| D1.1 | Set up dev environment | Docker Compose (or equivalent) for backend + frontend + any dependencies. `.env.example`, `Makefile` or `just` commands for common tasks. | — |
| D1.2 | Set up CI pipeline | GitHub Actions (or equivalent): lint, type-check, unit tests on push. | D1.1 |
| D1.3 | Configure hosting target | Decide: self-hosted (VPS/Tailscale) vs. cloud (Fly.io/Railway). Document decision and create deployment stub. | — |

### Milestone Checkpoint — End of Week 1

- [ ] Frontend renders login page and agent list (with mock or live data)
- [ ] Backend serves `/api/agents` and `/api/auth/login` with JWT
- [ ] WebSocket endpoint accepts authenticated connections
- [ ] Two sample agents respond to status queries via MCP round-trip
- [ ] TLS enabled in dev, CI pipeline green

### Definition of Done — Phase 1

A user can open the dashboard in an iPad browser, log in, see a list of agents with status indicators, and send a text command to an agent that returns a response. All transport is over TLS. CI runs on every push.

---

## Phase 2: Real-time & UX Polish (Week 2)

**Goal:** Live data streams, command UX, notifications, task view. The dashboard feels responsive and useful.

### Parallel Tracks

```
Track A: Frontend real-time + UX ──────────────┐
Track B: Backend real-time + notifications ─────┤─→ End-to-end real-time demo (end of week)
Track C: Security hardening ───────────────────┘
```

Tracks A and B advance together (frontend consumes what backend emits). Track C runs independently.

### Frontend

| ID | Task | Detail | Depends |
|----|------|--------|---------|
| F2.1 | Integrate WebSocket client | Connect to `/ws` on auth. Reconnect on disconnect. Parse incoming messages by type. | F1.3, B1.4 |
| F2.2 | Real-time agent status updates | Update agent list view live when `status_update` messages arrive over WS. Visual transition on status change (color fade, badge update). | F2.1 |
| F2.3 | Message stream view | Per-agent message log panel. New messages append in real time. Scrollable, auto-scroll-to-bottom with manual override. | F2.1 |
| F2.4 | Command input — response display | Enhance F1.5: show command history, display structured responses (not just raw text), loading spinner while awaiting response. | F1.5 |
| F2.5 | Notifications center | Bell icon with unread count. Dropdown showing recent alerts (agent errors, task completions, critical events). Mark-as-read. | F2.1 |
| F2.6 | Task/job dashboard view | `/tasks` route. Table or card view of active tasks: name, assigned agent, status (queued/running/done/failed), progress %, duration. | F2.1, B2.4 |
| F2.7 | Responsive polish pass | Test all views at iPad resolutions (1024×768, 1112×834, 1194×834). Fix overflow, touch target sizes (min 44×44px), font scaling. | F2.2–F2.6 |

### Backend

| ID | Task | Detail | Depends |
|----|------|--------|---------|
| B2.1 | Broadcast agent status over WebSocket | When MCP reports agent status change, push `status_update` message to all connected WS clients subscribed to that agent. | B1.4, I1.2 |
| B2.2 | Stream agent messages over WebSocket | Forward agent message events to relevant WS clients in real time. | B2.1 |
| B2.3 | Implement notification event system | Define notification types (agent_error, task_complete, security_alert). Store in lightweight in-memory or SQLite queue. Expose `GET /api/notifications` and push new notifications over WS. | B1.4 |
| B2.4 | Implement task/job endpoints | `GET /api/tasks` (list), `GET /api/tasks/:id` (detail). Source data from MCP agent task reports or internal task registry. Push task status changes over WS. | B1.2, I1.2 |
| B2.5 | Rate limiting and request validation | Add rate limiting middleware (e.g., 60 req/min per user). Validate request bodies with schema (Zod/Pydantic). | B1.3 |

### Integration

| ID | Task | Detail | Depends |
|----|------|--------|---------|
| I2.1 | Implement MCP event subscription | Backend subscribes to agent event streams (status changes, messages, task updates) rather than polling. | I1.2 |
| I2.2 | Validate latency target | Measure round-trip: agent status change → UI update. Target: < 200ms. Profile and optimize if needed. | B2.1, F2.2 |

### Security

| ID | Task | Detail | Depends |
|----|------|--------|---------|
| S2.1 | Implement session management | Token refresh flow. Invalidate sessions on logout. Enforce single-session or configurable max-sessions per user. | S1.2 |
| S2.2 | Add role-based access control | Define roles: `viewer` (read-only), `admin` (commands + config). Enforce on backend routes and conditionally hide UI elements. | S1.2, B1.3 |
| S2.3 | Implement audit logging | Log all command dispatches, auth events, and config changes with timestamp, user, action, target. Store in append-only log (file or DB table). | B1.5 |
| S2.4 | Token revocation endpoint | `POST /api/auth/revoke`. Allow admin to revoke another user's sessions. Maintain a revocation list checked on every request. | S2.1 |

### Milestone Checkpoint — End of Week 2

- [ ] Agent status updates appear in the UI within 200ms of the agent reporting a change
- [ ] Command input shows structured responses with loading states
- [ ] Notification bell shows unread alerts; alerts push in real time
- [ ] Task dashboard displays active jobs with live status updates
- [ ] All views render correctly on iPad-sized viewports
- [ ] Rate limiting and input validation active on all endpoints
- [ ] Audit log captures every command dispatch and auth event

### Definition of Done — Phase 2

The dashboard is a live, real-time operational tool. A user on an iPad can monitor agent activity as it happens, send commands and see responses, view running tasks, and receive notifications — all with sub-200ms latency. Security controls enforce role-based access and log all actions.

---

## Phase 3: MVP Readiness & Validation (Week 3)

**Goal:** Production-grade quality. Tested on real iPad hardware, accessible, documented, and ready for daily use.

### Parallel Tracks

```
Track A: QA & Accessibility ───────────────────┐
Track B: Obsidian integration + traceability ───┤─→ MVP sign-off (end of week)
Track C: Documentation & deployment ───────────┘
```

All three tracks are independent and can run fully in parallel.

### Frontend / QA (Track A)

| ID | Task | Detail | Depends |
|----|------|--------|---------|
| F3.1 | iPad hardware testing | Test on physical iPad (Safari). Verify touch interactions, scroll behavior, keyboard input, orientation changes. Log and fix issues. | F2.7 |
| F3.2 | Accessibility audit | Run axe/Lighthouse. Verify: keyboard navigation, focus management, ARIA labels on interactive elements, color contrast (WCAG AA). Fix violations. | F2.7 |
| F3.3 | Error state UX | Ensure graceful handling: network offline banner, WebSocket reconnection indicator, API error toasts, empty states for agent list / tasks. | F2.7 |
| F3.4 | Performance pass | Lighthouse performance score > 80. Lazy-load routes. Optimize bundle size. Verify WS doesn't leak connections on navigation. | F3.1 |
| F3.5 | PWA baseline | Add web app manifest, service worker for app-shell caching (not full offline). "Add to Home Screen" works on iPad. | F3.4 |

### Integration / Traceability (Track B)

| ID | Task | Detail | Depends |
|----|------|--------|---------|
| I3.1 | Obsidian traceability hook | Read-only integration: dashboard can link to or display Obsidian note references for research traces. Backend endpoint `GET /api/traces?agent=X` returns linked note metadata. | B2.4 |
| I3.2 | Vault view (read-only) | Optional: minimal UI to view credential vault entries (name, service, last-rotated — no secrets displayed). Scoped to admin role only. | S2.2 |
| I3.3 | End-to-end integration test suite | Automated tests covering: login → view agents → send command → receive response → view task → receive notification. Run in CI. | All Phase 2 tasks |

### Documentation & Deployment (Track C)

| ID | Task | Detail | Depends |
|----|------|--------|---------|
| D3.1 | Write install/run guide | Step-by-step: clone, configure `.env`, install dependencies, start dev server, access on iPad. Include troubleshooting section. | D1.1 |
| D3.2 | Write API reference | Document all REST endpoints and WebSocket message types. Request/response examples. Auth requirements per endpoint. | B2.4, B2.5 |
| D3.3 | Prepare MVP readiness checklist | Checklist covering: all success criteria met, security controls verified, iPad tested, docs complete, CI green, deployment tested. | — |
| D3.4 | Production deployment dry-run | Deploy to staging/production target. Verify TLS, auth, WebSocket connectivity, agent communication from iPad over real network. | D1.3 |
| D3.5 | Create Obsidian-linked executive summary | Update summary.md with final status. Link to all deliverables. Format as Obsidian-compatible report for Sean. | D3.3 |

### Milestone Checkpoint — End of Week 3

- [ ] Dashboard tested and working on physical iPad in Safari
- [ ] Accessibility audit passes WCAG AA (no critical violations)
- [ ] PWA installable on iPad home screen
- [ ] End-to-end test suite passes in CI
- [ ] Install/run guide tested by someone other than the author
- [ ] Production deployment successful with TLS and auth working
- [ ] MVP readiness checklist fully checked off

### Definition of Done — Phase 3

The MVP is production-ready. It runs on a deployed server, is accessible via iPad browser or home screen shortcut, passes accessibility and performance checks, has comprehensive documentation, and meets all success criteria from MASTER-PLAN.md. Sean can use it daily to monitor agents.

---

## Phase 4: Handoff & Expansion Path (Week 4+)

**Goal:** Preserve decisions, prepare for growth, and hand off a clean, extensible codebase.

### Tasks (Sequential — low urgency)

| ID | Task | Detail | Depends |
|----|------|--------|---------|
| H4.1 | Archive design decisions | Write an ADR (Architecture Decision Record) document covering: tech stack choices, auth strategy, MCP message schema, hosting decision. Commit to repo. | — |
| H4.2 | Document expansion roadmap | Outline potential next features ranked by value: additional agents, deeper task orchestration, home automation integration, native app wrapper (Capacitor/Expo), offline mode, multi-user support. | — |
| H4.3 | Refactor for extensibility | Review codebase for hardcoded agent references or assumptions. Extract agent adapter interface so new agent types can plug in without modifying core. | — |
| H4.4 | Security review | External or peer review of auth flow, token handling, WebSocket security, input validation. Address findings. | — |
| H4.5 | Handoff session | Walkthrough with stakeholders: architecture, how to add agents, how to deploy updates, monitoring/alerting setup. | H4.1, H4.2 |

### Milestone Checkpoint — End of Week 4

- [ ] ADR document committed to repo
- [ ] Expansion roadmap documented and shared
- [ ] Codebase reviewed for extensibility; adapter interface extracted
- [ ] Security review completed; findings addressed
- [ ] Handoff session conducted

### Definition of Done — Phase 4

The project is fully documented, extensible, and handed off. A new developer can onboard from the docs, add a new agent type via the adapter interface, and deploy an update without tribal knowledge. The expansion roadmap provides a clear path forward.

---

## Appendix A: Task Dependency Graph (Critical Path)

```
Phase 1 Critical Path:
  B1.1 → B1.2 → I1.2 → I1.3 (backend → MCP → agents live)
  B1.1 → B1.3 → S1.2 → B1.4 (backend → auth → WebSocket)
  F1.1 → F1.2 → F1.4 → F1.5 (frontend → agent list → commands)

Phase 2 Critical Path:
  I1.3 → I2.1 → B2.1 → F2.2 (MCP events → backend broadcast → frontend live)
  B2.1 → I2.2 (latency validation)

Phase 3 Critical Path:
  F2.7 → F3.1 → F3.4 → F3.5 (responsive → iPad test → perf → PWA)
  All Phase 2 → I3.3 → D3.3 → D3.4 (integration tests → readiness → deploy)
```

## Appendix B: Success Criteria Traceability

| Success Criterion (from MASTER-PLAN.md) | Validated By |
|----------------------------------------|--------------|
| MVP accessible on iPad via browser with responsive UI | F3.1, F3.5 |
| Real-time agent status updates for at least 2 agents | I1.3, I2.2, F2.2 |
| Secure authentication (OAuth2/JWT) and TLS | S1.2, S1.3, S2.1, D3.4 |
| MCP/WebSocket integration end-to-end | I1.3, I2.1, I3.3 |
| Clear executive summary linked in Obsidian | D3.5, I3.1 |

## Appendix C: Risk Mitigations Mapped to Tasks

| Risk | Mitigation Tasks |
|------|-----------------|
| Tool access friction (MCP unavailability) | I1.2 (adapter with fallback), I3.3 (integration tests) |
| Data exposure (vault secrets) | I3.2 (read-only, admin-only), S2.2 (RBAC) |
| Performance / latency | I2.2 (latency validation), F3.4 (performance pass) |
| Browser dependency / iPad quirks | F3.1 (hardware test), F3.5 (PWA), F3.3 (error states) |
| Agent compatibility | I1.1 (schema definition), I1.3 (validate with 2 agents) |
