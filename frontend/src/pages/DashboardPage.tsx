import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Activity, Users, ListTodo, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

export function DashboardPage() {
  const { data: agentsData, isLoading: agentsLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: () => api.getAgents(),
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.getTasks(),
  });

  const agents = agentsData?.agents || [];
  const tasks = tasksData?.tasks || [];

  const onlineAgents = agents.filter((a) => a.status === 'online').length;
  const runningTasks = tasks.filter((t) => t.status === 'running').length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Monitor your agents and tasks
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Online Agents"
          value={onlineAgents}
          total={agents.length}
          icon={Users}
          color="green"
          isLoading={agentsLoading}
        />
        <StatCard
          title="Running Tasks"
          value={runningTasks}
          icon={Activity}
          color="blue"
          isLoading={tasksLoading}
        />
        <StatCard
          title="Completed Today"
          value={completedTasks}
          icon={ListTodo}
          color="purple"
          isLoading={tasksLoading}
        />
        <StatCard
          title="Alerts"
          value={0}
          icon={AlertCircle}
          color="amber"
          isLoading={false}
        />
      </div>

      {/* Agent List Preview */}
      <div className="card">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Agent Status
        </h2>
        {agentsLoading ? (
          <div className="text-center py-8 text-slate-500">Loading agents...</div>
        ) : agents.length === 0 ? (
          <div className="text-center py-8 text-slate-500">No agents configured</div>
        ) : (
          <div className="space-y-3">
            {agents.slice(0, 4).map((agent) => (
              <div
                key={agent.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={clsx(
                      'w-2 h-2 rounded-full',
                      agent.status === 'online' && 'bg-green-500',
                      agent.status === 'offline' && 'bg-gray-400',
                      agent.status === 'busy' && 'bg-amber-500',
                      agent.status === 'error' && 'bg-red-500'
                    )}
                  />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {agent.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {agent.type}
                    </p>
                  </div>
                </div>
                <span
                  className={clsx(
                    'status-badge',
                    agent.status === 'online' && 'status-online',
                    agent.status === 'offline' && 'status-offline',
                    agent.status === 'busy' && 'status-busy',
                    agent.status === 'error' && 'status-error'
                  )}
                >
                  {agent.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  total?: number;
  icon: React.ElementType;
  color: 'green' | 'blue' | 'purple' | 'amber';
  isLoading: boolean;
}

function StatCard({ title, value, total, icon: Icon, color, isLoading }: StatCardProps) {
  const colorClasses = {
    green: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
          {isLoading ? (
            <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-1" />
          ) : (
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {value}
              {total !== undefined && (
                <span className="text-sm font-normal text-slate-400">/{total}</span>
              )}
            </p>
          )}
        </div>
        <div className={clsx('p-2 rounded-lg', colorClasses[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
