# iPad Agent Dashboard

A responsive web dashboard for monitoring and commanding AI agents, optimized for iPad.

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- An iPad on the same network (for testing)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ipad-dashboard-atgy

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

# Or manually:
cd backend && npm run build
cd ../frontend && npm run build
```

## Configuration

### Environment Variables

Create a `.env` file in the backend directory:

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
├── frontend/           # React + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── context/    # React context providers
│   │   ├── hooks/      # Custom React hooks
│   │   ├── pages/      # Page components
│   │   └── services/   # API client services
│   └── public/         # Static assets, manifest, service worker
│
├── backend/            # Express + TypeScript
│   ├── src/
│   │   ├── middleware/ # Express middleware (auth, RBAC, rate limiting)
│   │   ├── routes/     # API route handlers
│   │   ├── services/   # Business logic services
│   │   └── types/      # TypeScript type definitions
│   └── logs/           # Audit logs (generated)
│
└── Makefile            # Build and run commands
```

## Features

### Phase 1 (Complete)
- ✅ React frontend with Vite and TypeScript
- ✅ Express backend with TypeScript
- ✅ JWT authentication with refresh tokens
- ✅ WebSocket server for real-time communication
- ✅ MCP client for agent communication
- ✅ Agent list and command dispatch

### Phase 2 (Complete)
- ✅ Real-time agent status updates via WebSocket
- ✅ Message stream per agent
- ✅ Command history with keyboard navigation
- ✅ Notifications center with unread count
- ✅ Task/job dashboard with filtering
- ✅ Session management and RBAC
- ✅ Audit logging
- ✅ Rate limiting

### Phase 3 (In Progress)
- ✅ Error state UX (offline banner, toasts, empty states)
- ✅ Accessibility audit (ARIA labels, keyboard navigation)
- ✅ Performance optimization (lazy loading)
- ✅ PWA baseline (manifest, service worker)
- 🔄 End-to-end tests
- 🔄 Documentation

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user
- `GET /api/auth/sessions` - List active sessions
- `POST /api/auth/revoke` - Revoke sessions (admin only)

### Agents
- `GET /api/agents` - List all agents
- `GET /api/agents/:id` - Get agent details
- `POST /api/agents/:id/command` - Send command to agent
- `PUT /api/agents/:id/status` - Update agent status

### Tasks
- `GET /api/tasks` - List all tasks
- `GET /api/tasks/:id` - Get task details
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task

### Notifications
- `GET /api/notifications` - List notifications
- `POST /api/notifications/:id/read` - Mark as read
- `POST /api/notifications/read-all` - Mark all as read

### WebSocket Events
- `status_update` - Agent status changed
- `agent_message` - New message from agent
- `task_update` - Task status changed
- `notification` - New notification

## iPad Access

### Local Network Access

1. Find your machine's local IP address:
   ```bash
   # macOS
   ipconfig getifaddr en0
   ```

2. On your iPad, open Safari and navigate to:
   ```
   http://<your-ip>:5173
   ```

### Add to Home Screen

1. Open the dashboard in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. Name it "Agent Dashboard" and tap Add

## Troubleshooting

### Frontend won't start
- Check that port 5173 is not in use
- Try deleting `node_modules` and running `npm install` again

### Backend won't start
- Check that port 3001 is not in use
- Ensure you have a valid `.env` file

### Can't access from iPad
- Ensure your iPad and computer are on the same WiFi network
- Check your firewall settings
- Verify you're using the correct IP address

### WebSocket connection fails
- The backend must be running for WebSocket to work
- Check browser console for connection errors

### Login fails
- Verify the backend is running
- Check the demo credentials
- Look at backend logs for errors

## Development Commands

```bash
# Install dependencies
make install

# Start development servers
make dev

# Build for production
make build

# Run linting
cd frontend && npm run lint
cd backend && npm run lint

# Type check
cd frontend && npm run typecheck
cd backend && npm run typecheck
```

## Security Notes

- **Change JWT_SECRET** in production
- Use HTTPS in production
- The demo users should be disabled in production
- Audit logs are stored in `backend/logs/audit.log`
- Rate limiting is enabled (60 req/min default)

## License

MIT
