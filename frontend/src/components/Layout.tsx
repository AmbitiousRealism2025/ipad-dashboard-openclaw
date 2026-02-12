import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Users,
  ListTodo,
  Bell,
  LogOut,
  Menu,
  X,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { useNotifications } from '../hooks/useNotifications';
import { api } from '../services/api';
import { NetworkStatus } from './NetworkStatus';
import clsx from 'clsx';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/agents', icon: Users, label: 'Agents' },
  { to: '/tasks', icon: ListTodo, label: 'Tasks' },
];

export function Layout() {
  const { user, logout } = useAuth();
  const { isConnected } = useWebSocket();
  const { newNotifications } = useNotifications();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  // Fetch notification count
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.getNotifications(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const unreadCount = (notificationsData?.unreadCount || 0) + newNotifications.length;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {/* Skip to main content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-500 focus:text-white focus:rounded-lg"
      >
        Skip to main content
      </a>

      {/* Network status banner */}
      <NetworkStatus />

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-30 w-64 transform bg-white dark:bg-slate-800 shadow-lg transition-transform duration-200 ease-in-out lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Main navigation"
      >
        <div className="flex h-full flex-col">
          {/* Logo with connection status */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-primary-600">Agent Dashboard</h1>
              <span aria-label={isConnected ? 'Connected' : 'Disconnected'}>
                {isConnected ? (
                  <Wifi className="w-4 h-4 text-green-500" aria-hidden="true" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" aria-hidden="true" />
                )}
              </span>
            </div>
            <button
              className="lg:hidden touch-target p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1" aria-label="Primary">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                aria-label={label}
                className={({ isActive }) =>
                  clsx(
                    'touch-target flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                  )
                }
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Notifications */}
          <div className="px-2 py-2">
            <NavLink
              to="/notifications"
              onClick={() => setSidebarOpen(false)}
              aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
              className={({ isActive }) =>
                clsx(
                  'touch-target flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                )
              }
            >
              <Bell className="w-5 h-5" aria-hidden="true" />
              Notifications
              {unreadCount > 0 && (
                <span className="ml-auto bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full" aria-label={`${unreadCount} unread notifications`}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </NavLink>
          </div>

          {/* Connection status banner (when disconnected) */}
          {!isConnected && (
            <div className="mx-2 mb-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg" role="status" aria-live="polite">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs">
                <WifiOff className="w-4 h-4" aria-hidden="true" />
                <span>Reconnecting...</span>
              </div>
            </div>
          )}

          {/* User section */}
          <div className="border-t border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center" aria-hidden="true">
                <span className="text-primary-700 font-medium">
                  {user?.email?.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {user?.name || user?.email}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {user?.role}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              aria-label="Sign out"
              className="touch-target w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden h-16 flex items-center px-4 bg-white dark:bg-slate-800 shadow-sm">
          <button
            className="touch-target p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={sidebarOpen}
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>
          <h1 className="ml-2 text-lg font-semibold text-slate-900 dark:text-white">
            Agent Dashboard
          </h1>
          <div className="ml-auto" aria-label={isConnected ? 'Connected' : 'Disconnected'}>
            {isConnected ? (
              <Wifi className="w-5 h-5 text-green-500" aria-hidden="true" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-500" aria-hidden="true" />
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6" id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
