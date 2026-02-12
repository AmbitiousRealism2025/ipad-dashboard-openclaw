import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Task } from '../types';
import { useTaskUpdates } from '../hooks/useTaskUpdates';
import { EmptyState } from '../components/EmptyState';
import { Clock, CheckCircle, XCircle, Loader2, AlertCircle, RefreshCw, ListTodo } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

type TaskFilter = 'all' | 'running' | 'completed' | 'failed';

export function TasksPage() {
  const [filter, setFilter] = useState<TaskFilter>('all');
  const { isConnected, recentUpdates } = useTaskUpdates();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.getTasks(),
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const allTasks = data?.tasks || [];

  // Apply filter
  const filteredTasks = allTasks.filter((task) => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  // Count by status
  const statusCounts = {
    all: allTasks.length,
    running: allTasks.filter((t) => t.status === 'running').length,
    completed: allTasks.filter((t) => t.status === 'completed').length,
    failed: allTasks.filter((t) => t.status === 'failed').length,
  };

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tasks</h1>
        <EmptyState
          icon={ListTodo}
          title="Failed to load tasks"
          description="There was an error loading the task list. Please try again."
          action={{
            label: 'Retry',
            onClick: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tasks</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Monitor agent task execution
            {isConnected && (
              <span className="ml-2 text-green-500">• Live updates</span>
            )}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard
          label="Total"
          value={statusCounts.all}
          icon={Clock}
          color="slate"
          isActive={filter === 'all'}
          onClick={() => setFilter('all')}
        />
        <StatusCard
          label="Running"
          value={statusCounts.running}
          icon={Loader2}
          color="blue"
          isActive={filter === 'running'}
          onClick={() => setFilter('running')}
        />
        <StatusCard
          label="Completed"
          value={statusCounts.completed}
          icon={CheckCircle}
          color="green"
          isActive={filter === 'completed'}
          onClick={() => setFilter('completed')}
        />
        <StatusCard
          label="Failed"
          value={statusCounts.failed}
          icon={XCircle}
          color="red"
          isActive={filter === 'failed'}
          onClick={() => setFilter('failed')}
        />
      </div>

      {/* Recent Updates */}
      {recentUpdates.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400">
            <RefreshCw className="w-4 h-4" />
            <span>
              {recentUpdates.length} recent update{recentUpdates.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Task List */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Loading tasks...</div>
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title={filter === 'all' ? 'No tasks yet' : `No ${filter} tasks`}
          description={
            filter === 'all'
              ? 'Tasks will appear here when agents start executing jobs.'
              : `No tasks with ${filter} status. Try a different filter.`
          }
          action={
            filter !== 'all'
              ? { label: 'Show all tasks', onClick: () => setFilter('all') }
              : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}

interface StatusCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  color: 'slate' | 'blue' | 'green' | 'red';
  isActive: boolean;
  onClick: () => void;
}

function StatusCard({ label, value, icon: Icon, color, isActive, onClick }: StatusCardProps) {
  const colorClasses = {
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  };

  return (
    <button
      onClick={onClick}
      className={clsx(
        'card flex items-center gap-3 transition-all',
        isActive && 'ring-2 ring-primary-500'
      )}
    >
      <div className={clsx('p-2 rounded-lg', colorClasses[color])}>
        <Icon className={clsx('w-5 h-5', color === 'blue' && 'animate-spin')} />
      </div>
      <div className="text-left">
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </button>
  );
}

interface TaskCardProps {
  task: Task;
}

function TaskCard({ task }: TaskCardProps) {
  const statusConfig = {
    queued: { icon: Clock, color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-700' },
    running: { icon: Loader2, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/20' },
    completed: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/20' },
    failed: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/20' },
    cancelled: { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/20' },
  };

  const config = statusConfig[task.status];
  const StatusIcon = config.icon;

  const formatDuration = () => {
    const start = new Date(task.createdAt);
    const end = task.completedAt ? new Date(task.completedAt) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffSecs = Math.floor(diffMs / 1000);

    if (diffSecs < 60) return `${diffSecs}s`;
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ${diffSecs % 60}s`;
    return `${Math.floor(diffSecs / 3600)}h ${Math.floor((diffSecs % 3600) / 60)}m`;
  };

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
    <div className={clsx('card', config.bg)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusIcon
              className={clsx(
                'w-5 h-5 flex-shrink-0',
                config.color,
                task.status === 'running' && 'animate-spin'
              )}
            />
            <h3 className="font-semibold text-slate-900 dark:text-white truncate">
              {task.name}
            </h3>
          </div>
          {task.description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 ml-7">
              {task.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-4 mt-2 ml-7 text-xs text-slate-500 dark:text-slate-400">
            <span>Agent: {task.agentId}</span>
            <span>Duration: {formatDuration()}</span>
            <span>Started: {formatTime(task.createdAt)}</span>
            {task.completedAt && (
              <span>Finished: {formatTime(task.completedAt)}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span
            className={clsx(
              'px-2 py-1 text-xs font-medium rounded-full capitalize',
              task.status === 'completed' && 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200',
              task.status === 'running' && 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200',
              task.status === 'failed' && 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200',
              task.status === 'queued' && 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
              task.status === 'cancelled' && 'bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200'
            )}
          >
            {task.status}
          </span>
          {(task.status === 'running' || task.status === 'queued') && (
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={clsx(
                    'h-full transition-all duration-300',
                    task.status === 'running' ? 'bg-blue-500' : 'bg-slate-400'
                  )}
                  style={{ width: `${task.progress}%` }}
                />
              </div>
              <span className="text-xs text-slate-500">{task.progress}%</span>
            </div>
          )}
        </div>
      </div>

      {task.error && (
        <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{task.error}</p>
        </div>
      )}
    </div>
  );
}
