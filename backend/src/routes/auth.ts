import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import {
  generateAccessToken,
  generateRefreshToken,
  authMiddleware,
} from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';
import { sessionManager } from '../services/sessionManager';
import { auditLogger } from '../services/auditLog';
import { defaultRateLimiter, authRateLimiter } from '../middleware/rateLimit';

const router = Router();

// In-memory user store (replace with database in production)
const users: Map<
  string,
  { id: string; email: string; passwordHash: string; name: string; role: 'viewer' | 'admin' }
> = new Map();

// Initialize demo users
const initDemoUsers = async () => {
  const adminHash = await bcrypt.hash('admin123', 10);
  const viewerHash = await bcrypt.hash('viewer123', 10);
  const demoHash = await bcrypt.hash('demo123', 10);

  users.set('admin@example.com', {
    id: uuidv4(),
    email: 'admin@example.com',
    passwordHash: adminHash,
    name: 'Admin User',
    role: 'admin',
  });

  users.set('viewer@example.com', {
    id: uuidv4(),
    email: 'viewer@example.com',
    passwordHash: viewerHash,
    name: 'Viewer User',
    role: 'viewer',
  });

  users.set('demo@example.com', {
    id: uuidv4(),
    email: 'demo@example.com',
    passwordHash: demoHash,
    name: 'Demo User',
    role: 'admin',
  });
};
initDemoUsers();

// Helper to find user by ID
const findUserById = (userId: string) => {
  for (const user of users.values()) {
    if (user.id === userId) return user;
  }
  return null;
};

// POST /api/auth/login
router.post('/login', authRateLimiter, async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const user = users.get(email);
  if (!user) {
    auditLogger.log({
      userId: 'unknown',
      email,
      action: 'login',
      details: { success: false, reason: 'user_not_found' },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    auditLogger.log({
      userId: user.id,
      email: user.email,
      action: 'login',
      details: { success: false, reason: 'invalid_password' },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = generateRefreshToken(user.id);

  // Create session
  sessionManager.createSession(user.id, refreshToken, {
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });

  // Audit log
  auditLogger.log({
    userId: user.id,
    email: user.email,
    action: 'login',
    details: { success: true },
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.json({
    accessToken,
    refreshToken,
    expiresIn: 15 * 60,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
});

// POST /api/auth/logout
router.post('/logout', defaultRateLimiter, (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const user = (req as any).user;

  if (refreshToken) {
    // Get user ID from token before removing
    sessionManager.revokeToken(refreshToken);
  }

  if (user) {
    auditLogger.log({
      userId: user.userId,
      email: user.email,
      action: 'logout',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  res.json({ message: 'Logged out successfully' });
});

// POST /api/auth/refresh
router.post('/refresh', defaultRateLimiter, (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  // Check if token is revoked
  if (sessionManager.isTokenRevoked(refreshToken)) {
    return res.status(401).json({ error: 'Token has been revoked' });
  }

  // Verify token structure and extract userId
  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as { userId: string; type: string };

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    // Validate session
    if (!sessionManager.validateSession(decoded.userId, refreshToken)) {
      return res.status(401).json({ error: 'Session invalid or expired' });
    }

    const user = findUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    auditLogger.log({
      userId: user.id,
      email: user.email,
      action: 'token_refresh',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      accessToken,
      expiresIn: 15 * 60,
    });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// GET /api/auth/me
router.get('/me', defaultRateLimiter, authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user;

  res.json({
    id: user.userId,
    email: user.email,
    role: user.role,
  });
});

// GET /api/auth/sessions
router.get('/sessions', defaultRateLimiter, authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user;
  const sessions = sessionManager.getActiveSessions(user.userId);

  res.json({ sessions });
});

// POST /api/auth/revoke - Admin only: revoke another user's sessions
router.post('/revoke', defaultRateLimiter, authMiddleware, requireAdmin, (req: Request, res: Response) => {
  const { userId, refreshToken } = req.body;
  const adminUser = (req as any).user;

  if (!userId && !refreshToken) {
    return res.status(400).json({ error: 'userId or refreshToken required' });
  }

  let revokedCount = 0;

  if (refreshToken) {
    sessionManager.revokeToken(refreshToken);
    revokedCount = 1;
    auditLogger.log({
      userId: adminUser.userId,
      email: adminUser.email,
      action: 'token_revoked',
      target: refreshToken.slice(0, 10) + '...',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  } else if (userId) {
    revokedCount = sessionManager.revokeAllUserSessions(userId);
    auditLogger.log({
      userId: adminUser.userId,
      email: adminUser.email,
      action: 'token_revoked',
      target: userId,
      details: { sessionsRevoked: revokedCount },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  res.json({
    message: 'Sessions revoked successfully',
    revokedCount,
  });
});

export default router;
