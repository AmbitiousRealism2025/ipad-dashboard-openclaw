/**
 * Agent Adapter Interface
 *
 * This interface defines the contract for agent adapters.
 * New agent types can be added by implementing this interface.
 */

import type { Agent, AgentStatus, CommandResponse } from '../types';

/**
 * Agent configuration for registration
 */
export interface AgentConfig {
  /** Unique identifier for the agent */
  id: string;
  /** Human-readable name */
  name: string;
  /** Agent type identifier */
  type: string;
  /** List of capabilities this agent supports */
  capabilities: string[];
  /** Optional metadata */
  metadata?: Record<string, unknown>;
  /** Connection endpoint (WebSocket URL, HTTP URL, etc.) */
  endpoint?: string;
}

/**
 * Command request structure
 */
export interface CommandRequest {
  /** Command name/type */
  command: string;
  /** Optional parameters for the command */
  parameters?: Record<string, unknown>;
}

/**
 * Status update event
 */
export interface StatusUpdateEvent {
  agentId: string;
  status: AgentStatus;
  timestamp: Date;
  message?: string;
}

/**
 * Message event from agent
 */
export interface AgentMessageEvent {
  agentId: string;
  content: string;
  type: 'status' | 'command' | 'response' | 'error' | 'log';
  timestamp: Date;
}

/**
 * Event handler types
 */
export type StatusHandler = (event: StatusUpdateEvent) => void;
export type MessageHandler = (event: AgentMessageEvent) => void;

/**
 * Agent Adapter Interface
 *
 * Implement this interface to add support for new agent types.
 */
export interface AgentAdapter {
  /**
   * Unique type identifier for this adapter
   */
  readonly type: string;

  /**
   * Human-readable name for this adapter type
   */
  readonly displayName: string;

  /**
   * Initialize the adapter
   * Called once when the adapter is registered
   */
  initialize(): Promise<void>;

  /**
   * Connect to an agent
   * @param config Agent configuration
   */
  connect(config: AgentConfig): Promise<Agent>;

  /**
   * Disconnect from an agent
   * @param agentId Agent to disconnect
   */
  disconnect(agentId: string): Promise<void>;

  /**
   * Send a command to an agent
   * @param agentId Target agent
   * @param request Command request
   */
  sendCommand(agentId: string, request: CommandRequest): Promise<CommandResponse>;

  /**
   * Get current status of an agent
   * @param agentId Agent to query
   */
  getStatus(agentId: string): Promise<AgentStatus>;

  /**
   * Subscribe to status updates from an agent
   * @param agentId Agent to subscribe to
   * @param handler Callback for status updates
   */
  onStatusUpdate(agentId: string, handler: StatusHandler): () => void;

  /**
   * Subscribe to messages from an agent
   * @param agentId Agent to subscribe to
   * @param handler Callback for messages
   */
  onMessage(agentId: string, handler: MessageHandler): () => void;

  /**
   * Check if this adapter can handle the given agent type
   * @param type Agent type to check
   */
  canHandle(type: string): boolean;

  /**
   * Clean up resources
   * Called when the adapter is unregistered or server shuts down
   */
  shutdown(): Promise<void>;
}

/**
 * Base class for agent adapters with common functionality
 */
export abstract class BaseAgentAdapter implements AgentAdapter {
  abstract readonly type: string;
  abstract readonly displayName: string;

  protected statusHandlers: Map<string, Set<StatusHandler>> = new Map();
  protected messageHandlers: Map<string, Set<MessageHandler>> = new Map();

  async initialize(): Promise<void> {
    // Override in subclass if needed
  }

  abstract connect(config: AgentConfig): Promise<Agent>;
  abstract disconnect(agentId: string): Promise<void>;
  abstract sendCommand(agentId: string, request: CommandRequest): Promise<CommandResponse>;
  abstract getStatus(agentId: string): Promise<AgentStatus>;

  onStatusUpdate(agentId: string, handler: StatusHandler): () => void {
    if (!this.statusHandlers.has(agentId)) {
      this.statusHandlers.set(agentId, new Set());
    }
    this.statusHandlers.get(agentId)!.add(handler);

    return () => {
      this.statusHandlers.get(agentId)?.delete(handler);
    };
  }

  onMessage(agentId: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(agentId)) {
      this.messageHandlers.set(agentId, new Set());
    }
    this.messageHandlers.get(agentId)!.add(handler);

    return () => {
      this.messageHandlers.get(agentId)?.delete(handler);
    };
  }

  canHandle(type: string): boolean {
    return type === this.type;
  }

  async shutdown(): Promise<void> {
    this.statusHandlers.clear();
    this.messageHandlers.clear();
  }

  /**
   * Emit a status update to all handlers for an agent
   */
  protected emitStatusUpdate(event: StatusUpdateEvent): void {
    const handlers = this.statusHandlers.get(event.agentId);
    if (handlers) {
      handlers.forEach((handler) => handler(event));
    }
  }

  /**
   * Emit a message to all handlers for an agent
   */
  protected emitMessage(event: AgentMessageEvent): void {
    const handlers = this.messageHandlers.get(event.agentId);
    if (handlers) {
      handlers.forEach((handler) => handler(event));
    }
  }
}

/**
 * Agent Adapter Registry
 *
 * Manages registration and lookup of agent adapters.
 */
export class AgentAdapterRegistry {
  private adapters: Map<string, AgentAdapter> = new Map();

  /**
   * Register an adapter
   */
  register(adapter: AgentAdapter): void {
    if (this.adapters.has(adapter.type)) {
      throw new Error(`Adapter for type "${adapter.type}" is already registered`);
    }
    this.adapters.set(adapter.type, adapter);
  }

  /**
   * Unregister an adapter
   */
  unregister(type: string): void {
    this.adapters.delete(type);
  }

  /**
   * Get an adapter by type
   */
  get(type: string): AgentAdapter | undefined {
    return this.adapters.get(type);
  }

  /**
   * Find an adapter that can handle the given type
   */
  findAdapter(type: string): AgentAdapter | undefined {
    for (const adapter of this.adapters.values()) {
      if (adapter.canHandle(type)) {
        return adapter;
      }
    }
    return undefined;
  }

  /**
   * Get all registered adapter types
   */
  getTypes(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Initialize all adapters
   */
  async initializeAll(): Promise<void> {
    await Promise.all(
      Array.from(this.adapters.values()).map((adapter) => adapter.initialize())
    );
  }

  /**
   * Shutdown all adapters
   */
  async shutdownAll(): Promise<void> {
    await Promise.all(
      Array.from(this.adapters.values()).map((adapter) => adapter.shutdown())
    );
  }
}

// Singleton registry instance
export const agentRegistry = new AgentAdapterRegistry();
