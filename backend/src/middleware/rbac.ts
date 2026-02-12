import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { UserRole } from '../types';

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: user.role,
      });
      return;
    }

    next();
  };
};

// Predefined role checks
export const requireAdmin = requireRole('admin');
export const requireViewer = requireRole('viewer', 'admin'); // Both viewer and admin can access

// Resource ownership check
export const requireOwnershipOrAdmin = (getUserIdFromParams: (req: Request) => string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Admins can access any resource
    if (user.role === 'admin') {
      next();
      return;
    }

    // Check ownership
    const resourceUserId = getUserIdFromParams(req);
    if (user.userId === resourceUserId) {
      next();
      return;
    }

    res.status(403).json({ error: 'Access denied' });
  };
};

// Permission definitions
export const PERMISSIONS = {
  // Viewer permissions
  VIEW_AGENTS: 'view:agents',
  VIEW_TASKS: 'view:tasks',
  VIEW_NOTIFICATIONS: 'view:notifications',

  // Admin permissions
  SEND_COMMANDS: 'command:send',
  MANAGE_AGENTS: 'manage:agents',
  MANAGE_USERS: 'manage:users',
  VIEW_AUDIT_LOGS: 'view:audit_logs',
  REVOKE_SESSIONS: 'session:revoke',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Role to permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  viewer: [
    PERMISSIONS.VIEW_AGENTS,
    PERMISSIONS.VIEW_TASKS,
    PERMISSIONS.VIEW_NOTIFICATIONS,
  ],
  admin: [
    PERMISSIONS.VIEW_AGENTS,
    PERMISSIONS.VIEW_TASKS,
    PERMISSIONS.VIEW_NOTIFICATIONS,
    PERMISSIONS.SEND_COMMANDS,
    PERMISSIONS.MANAGE_AGENTS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.REVOKE_SESSIONS,
  ],
};

// Check if user has a specific permission
export const hasPermission = (userRole: UserRole, permission: Permission): boolean => {
  return ROLE_PERMISSIONS[userRole].includes(permission);
};

// Middleware to check specific permission
export const requirePermission = (permission: Permission) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!hasPermission(user.role, permission)) {
      res.status(403).json({
        error: 'Permission denied',
        required: permission,
      });
      return;
    }

    next();
  };
};
