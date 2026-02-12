import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Agent, CommandResponse } from '../types';
import { useAgentStatus } from '../hooks/useAgentStatus';
import { MessageStream, useAgentMessages } from '../components/MessageStream';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../components/Toast';
import { Search, Send, Loader2, Terminal, Clock, Check, X, MessageSquare, Users } from 'lucide-react';
import clsx from 'clsx';

interface CommandHistoryItem {
  id: string;
  command: string;
  response: CommandResponse;
  timestamp: Date;
}

export function AgentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [commandInput, setCommandInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<CommandHistoryItem[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [commandResponse, setCommandResponse] = useState<CommandResponse | null>(null);
  const [showMessageStream, setShowMessageStream] = useState(false);
  const queryClient = useQueryClient();
  const historyRef = useRef<HTMLDivElement>(null);

  // Real-time status updates
  const { isConnected, statusUpdates } = useAgentStatus();

  // Message stream
  const { messages } = useAgentMessages();

  // Toast notifications
  const toast = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ['agents'],
    queryFn: () => api.getAgents(),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const commandMutation = useMutation({
    mutationFn: ({ agentId, command }: { agentId: string; command: string }) =>
      api.sendCommand(agentId, command),
    onSuccess: (response, variables) => {
      setCommandResponse(response);
      queryClient.invalidateQueries({ queryKey: ['agents'] });

      // Add to history
      const historyItem: CommandHistoryItem = {
        id: Date.now().toString(),
        command: variables.command,
        response,
        timestamp: new Date(),
      };
      setCommandHistory((prev) => [historyItem, ...prev].slice(0, 50));
      setHistoryIndex(-1);

      if (response.success) {
        toast.success('Command executed successfully');
      } else {
        toast.error(response.error || 'Command failed');
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to send command');
    },
  });

  const agents = data?.agents || [];
  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Auto-scroll to bottom of history
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = 0;
    }
  }, [commandHistory]);

  const handleSendCommand = () => {
    if (!selectedAgent || !commandInput.trim()) return;

    commandMutation.mutate({
      agentId: selectedAgent.id,
      command: commandInput.trim(),
    });

    setCommandInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCommandInput(commandHistory[newIndex].command);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommandInput(commandHistory[newIndex].command);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommandInput('');
      }
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Failed to load agents: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Agents</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage and command your AI agents
            {isConnected && (
              <span className="ml-2 text-green-500">• Live updates</span>
            )}
          </p>
        </div>
        {statusUpdates.length > 0 && (
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {statusUpdates.length} recent update{statusUpdates.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search agents..."
          className="touch-target w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Agent Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Loading agents...</div>
      ) : error ? (
        <EmptyState
          icon={Users}
          title="Failed to load agents"
          description="There was an error loading the agent list. Please try again."
          action={{
            label: 'Retry',
            onClick: () => queryClient.invalidateQueries({ queryKey: ['agents'] }),
          }}
        />
      ) : filteredAgents.length === 0 ? (
        <EmptyState
          icon={Users}
          title={searchQuery ? 'No agents found' : 'No agents available'}
          description={
            searchQuery
              ? `No agents match "${searchQuery}". Try a different search term.`
              : 'No agents have been registered yet. Agents will appear here when they connect.'
          }
          action={
            searchQuery
              ? { label: 'Clear search', onClick: () => setSearchQuery('') }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredAgents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              isSelected={selectedAgent?.id === agent.id}
              hasRecentUpdate={statusUpdates.some((u) => u.agentId === agent.id)}
              onSelect={() => setSelectedAgent(selectedAgent?.id === agent.id ? null : agent)}
            />
          ))}
        </div>
      )}

      {/* Command Panel */}
      {selectedAgent && (
        <div className="space-y-4" role="region" aria-label={`Command panel for ${selectedAgent.name}`}>
          <div className="card border-2 border-primary-500">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Command: {selectedAgent.name}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowMessageStream(!showMessageStream)}
                  aria-pressed={showMessageStream}
                  aria-label={showMessageStream ? 'Hide message stream' : 'Show message stream'}
                  className={clsx(
                    'flex items-center gap-1 px-2 py-1 text-xs rounded-full transition-colors',
                    showMessageStream
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                  )}
                >
                  <MessageSquare className="w-3 h-3" aria-hidden="true" />
                  Stream
                </button>
                <span
                  className={clsx(
                    'status-badge',
                    selectedAgent.status === 'online' && 'status-online',
                    selectedAgent.status === 'offline' && 'status-offline',
                    selectedAgent.status === 'busy' && 'status-busy',
                    selectedAgent.status === 'error' && 'status-error'
                  )}
                  aria-label={`Status: ${selectedAgent.status}`}
                >
                  {selectedAgent.status}
                </span>
              </div>
            </div>

          {/* Capabilities */}
          <div className="flex flex-wrap gap-2 mb-4" aria-label="Quick command shortcuts">
            {selectedAgent.capabilities.map((cap) => (
              <button
                key={cap}
                onClick={() => setCommandInput(cap)}
                aria-label={`Insert command: ${cap}`}
                className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 hover:bg-primary-100 dark:hover:bg-primary-900/20 transition-colors"
              >
                {cap}
              </button>
            ))}
          </div>

          {/* Command Input */}
          <div className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter command... (↑↓ for history)"
                disabled={selectedAgent.status === 'offline'}
                aria-label="Command input"
                aria-describedby="command-help"
                className="touch-target w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm"
              />
            </div>
            <button
              onClick={handleSendCommand}
              disabled={!commandInput.trim() || selectedAgent.status === 'offline' || commandMutation.isPending}
              aria-busy={commandMutation.isPending}
              aria-label="Send command"
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {commandMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="w-4 h-4" aria-hidden="true" />
              )}
              Send
            </button>
          </div>
          <p id="command-help" className="sr-only">Use arrow keys to navigate command history</p>

          {/* Current Response */}
          {commandMutation.isPending && (
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 mb-4" role="status" aria-live="polite">
              <div className="flex items-center gap-2 text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span className="text-sm">Waiting for response...</span>
              </div>
            </div>
          )}

          {commandResponse && !commandMutation.isPending && (
            <div
              className={clsx(
                'p-4 rounded-lg mb-4',
                commandResponse.success
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              )}
              role="alert"
              aria-live="polite"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {commandResponse.success ? (
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                  )}
                  <span
                    className={clsx(
                      'text-sm font-medium',
                      commandResponse.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                    )}
                  >
                    {commandResponse.success ? 'Success' : 'Error'}
                  </span>
                </div>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {commandResponse.executionTime}ms
                </span>
              </div>
              <StructuredResponse data={commandResponse.result || commandResponse.error} />
            </div>
          )}

          {/* Command History */}
          {commandHistory.length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Command History
              </h3>
              <div
                ref={historyRef}
                className="max-h-48 overflow-y-auto space-y-2 scrollbar-thin"
              >
                {commandHistory.slice(0, 10).map((item) => (
                  <div
                    key={item.id}
                    className="p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-sm"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <code className="text-slate-700 dark:text-slate-300">
                        $ {item.command}
                      </code>
                      <div className="flex items-center gap-2">
                        {item.response.success ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <X className="w-3 h-3 text-red-500" />
                        )}
                        <span className="text-xs text-slate-400">
                          {formatTimestamp(item.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>

          {/* Message Stream */}
          {showMessageStream && (
            <MessageStream
              agent={selectedAgent}
              messages={messages}
              onClose={() => setShowMessageStream(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

// Structured response display component
function StructuredResponse({ data }: { data: unknown }) {
  if (typeof data === 'string') {
    return <p className="text-sm text-slate-700 dark:text-slate-300">{data}</p>;
  }

  if (typeof data === 'object' && data !== null) {
    return (
      <div className="space-y-2">
        {Object.entries(data as Record<string, unknown>).map(([key, value]) => (
          <div key={key} className="flex items-start gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 min-w-[80px]">
              {key}:
            </span>
            <span className="text-sm text-slate-700 dark:text-slate-300">
              {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <pre className="text-sm text-slate-700 dark:text-slate-300 overflow-auto whitespace-pre-wrap font-mono">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

interface AgentCardProps {
  agent: Agent;
  isSelected: boolean;
  hasRecentUpdate: boolean;
  onSelect: () => void;
}

function AgentCard({ agent, isSelected, hasRecentUpdate, onSelect }: AgentCardProps) {
  return (
    <div
      className={clsx(
        'card cursor-pointer transition-all',
        isSelected && 'ring-2 ring-primary-500',
        hasRecentUpdate && 'animate-pulse-once'
      )}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={clsx(
              'w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold',
              agent.type === 'atreides' && 'bg-blue-500',
              agent.type === 'sisyphus' && 'bg-purple-500',
              agent.type === 'custom' && 'bg-slate-500'
            )}
          >
            {agent.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">{agent.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{agent.type}</p>
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

      <div className="mt-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
        <span>
          Last seen: {new Date(agent.lastSeen).toLocaleTimeString()}
        </span>
        <span>{agent.capabilities.length} capabilities</span>
      </div>

      {/* Expanded details */}
      {isSelected && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Capabilities
          </h4>
          <div className="flex flex-wrap gap-2">
            {agent.capabilities.map((cap) => (
              <span
                key={cap}
                className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300"
              >
                {cap}
              </span>
            ))}
          </div>
          {agent.metadata && (
            <div className="mt-3">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Metadata
              </h4>
              <pre className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 p-2 rounded overflow-auto">
                {JSON.stringify(agent.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
