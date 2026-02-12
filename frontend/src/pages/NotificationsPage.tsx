import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Notification, NotificationType } from '../types';
import { Bell, CheckCircle, XCircle, AlertTriangle, Info, Check } from 'lucide-react';
import clsx from 'clsx';

export function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.getNotifications(),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Failed to load notifications: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Notifications
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="btn-secondary text-sm"
          >
            Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="card text-center py-12">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onMarkRead={() => markReadMutation.mutate(notification.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface NotificationCardProps {
  notification: Notification;
  onMarkRead: () => void;
}

function NotificationCard({ notification, onMarkRead }: NotificationCardProps) {
  const iconConfig: Record<NotificationType, { icon: typeof Bell; color: string }> = {
    agent_error: { icon: XCircle, color: 'text-red-500' },
    task_complete: { icon: CheckCircle, color: 'text-green-500' },
    task_failed: { icon: XCircle, color: 'text-red-500' },
    security_alert: { icon: AlertTriangle, color: 'text-amber-500' },
    system: { icon: Info, color: 'text-blue-500' },
  };

  const config = iconConfig[notification.type];
  const Icon = config.icon;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className={clsx(
        'card flex items-start gap-4 transition-colors',
        !notification.read && 'bg-primary-50 dark:bg-primary-900/10 border-l-4 border-primary-500'
      )}
    >
      <div className={clsx('flex-shrink-0 mt-0.5', config.color)}>
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <h3
          className={clsx(
            'font-medium',
            notification.read ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-white'
          )}
        >
          {notification.title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {notification.message}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
          {formatTime(notification.createdAt)}
        </p>
      </div>

      {!notification.read && (
        <button
          onClick={onMarkRead}
          className="flex-shrink-0 touch-target p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
          title="Mark as read"
        >
          <Check className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
