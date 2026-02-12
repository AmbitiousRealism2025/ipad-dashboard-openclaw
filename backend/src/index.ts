import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import authRoutes from './routes/auth';
import agentRoutes from './routes/agents';
import taskRoutes from './routes/tasks';
import notificationRoutes from './routes/notifications';
import { authMiddleware } from './middleware/auth';
import { setupWebSocket } from './services/websocket';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Health check (public)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/agents', authMiddleware, agentRoutes);
app.use('/api/tasks', authMiddleware, taskRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);

// WebSocket server
const wss = new WebSocketServer({ server, path: '/ws' });
setupWebSocket(wss);

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

server.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server listening on ws://localhost:${PORT}/ws`);
});

export { app, server, wss };
