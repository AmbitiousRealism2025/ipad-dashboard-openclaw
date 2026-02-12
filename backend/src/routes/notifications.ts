import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedRequest } from '../middleware/auth';
import { Notification, NotificationType } from '../types';

const router = Router();

// In-memory notification store (per user)
const notifications: Map<string, Notification[]> = new Map();

// GET /api/notifications
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId || 'default';
  const userNotifications = notifications.get(userId) || [];

  res.json({
    notifications: userNotifications.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
    })),
    unreadCount: userNotifications.filter((n) => !n.read).length,
  });
});

// POST /api/notifications (create notification)
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  const { type, title, message, metadata } = req.body as {
    type: NotificationType;
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
  };

  if (!type || !title || !message) {
    return res.status(400).json({ error: 'Type, title, and message required' });
  }

  const userId = req.user?.userId || 'default';
  const userNotifications = notifications.get(userId) || [];

  const notification: Notification = {
    id: uuidv4(),
    type,
    title,
    message,
    userId,
    read: false,
    createdAt: new Date(),
    metadata,
  };

  userNotifications.unshift(notification);
  // Keep only last 100 notifications
  if (userNotifications.length > 100) {
    userNotifications.pop();
  }
  notifications.set(userId, userNotifications);

  res.status(201).json({
    ...notification,
    createdAt: notification.createdAt.toISOString(),
  });
});

// PUT /api/notifications/:id/read
router.put('/:id/read', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId || 'default';
  const userNotifications = notifications.get(userId) || [];

  const notification = userNotifications.find((n) => n.id === req.params.id);
  if (!notification) {
    return res.status(404).json({ error: 'Notification not found' });
  }

  notification.read = true;
  notifications.set(userId, userNotifications);

  res.json({ message: 'Marked as read' });
});

// PUT /api/notifications/read-all
router.put('/read-all', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId || 'default';
  const userNotifications = notifications.get(userId) || [];

  userNotifications.forEach((n) => {
    n.read = true;
  });
  notifications.set(userId, userNotifications);

  res.json({ message: 'All notifications marked as read' });
});

export default router;
