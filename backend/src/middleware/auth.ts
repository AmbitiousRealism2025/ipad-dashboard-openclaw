import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { JWTPayload, UserRole } from '../types';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    res.status(500).json({ error: 'Authentication failed' });
  }
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!roles.includes(user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

export const generateAccessToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  const options: SignOptions = { expiresIn: '15m' };
  return jwt.sign(payload as object, JWT_SECRET, options);
};

export const generateRefreshToken = (userId: string): string => {
  const options: SignOptions = { expiresIn: '7d' };
  return jwt.sign({ userId, type: 'refresh' }, JWT_SECRET, options);
};

export const verifyRefreshToken = (token: string): { userId: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; type: string };
    if (decoded.type !== 'refresh') return null;
    return { userId: decoded.userId };
  } catch {
    return null;
  }
};

export const getTokenExpiration = (): number => {
  const expiresIn = JWT_EXPIRES_IN;
  const unit = expiresIn.slice(-1);
  const value = parseInt(expiresIn.slice(0, -1));

  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 60 * 60;
    case 'd': return value * 60 * 60 * 24;
    default: return 900; // 15 minutes default
  }
};
