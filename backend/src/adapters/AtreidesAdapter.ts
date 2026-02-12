/**
 * Atreides Agent Adapter
 *
 * Sample implementation of the AgentAdapter interface for Atreides-style agents.
 * This demonstrates how to create a new agent type adapter.
 */

import { BaseAgentAdapter, AgentConfig, type CommandRequest } from '../services/agentAdapter';
import type { Agent, AgentStatus, CommandResponse } from '../types';

export class AtreidesAdapter extends BaseAgentAdapter {
  readonly type = 'atreides';
  readonly displayName = 'Atreides Agent';

  // In a real implementation, this would track WebSocket connections
  private connections: Map<string, WebSocket> = new Map();

  async connect(config: AgentConfig): Promise<Agent> {
    // In a real implementation, this would establish a WebSocket connection
    // For now, return a mock agent
    const agent: Agent = {
      id: config.id,
      name: config.name,
      type: this.type,
      status: 'online',
      lastSeen: new Date(),
      capabilities: config.capabilities,
      metadata: config.metadata,
    };

    // Simulate connection established
    this.emitStatusUpdate({
      agentId: agent.id,
      status: 'online',
      timestamp: new Date(),
      message: 'Connected',
    });

    return agent;
  }

  async disconnect(agentId: string): Promise<void> {
    const connection = this.connections.get(agentId);
    if (connection) {
      connection.close();
      this.connections.delete(agentId);
    }

    this.emitStatusUpdate({
      agentId,
      status: 'offline',
      timestamp: new Date(),
      message: 'Disconnected',
    });
  }

  async sendCommand(agentId: string, request: CommandRequest): Promise<CommandResponse> {
    const startTime = Date.now();

    try {
      // In a real implementation, this would send the command via WebSocket
      // and wait for a response

      // Simulate command processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      return {
        success: true,
        result: {
          command: request.command,
          status: 'acknowledged',
          message: `Command "${request.command}" received and queued for execution`,
        },
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Command failed',
        executionTime: Date.now() - startTime,
      };
    }
  }

  async getStatus(agentId: string): Promise<AgentStatus> {
    // In a real implementation, this would query the actual agent
    const connection = this.connections.get(agentId);
    return connection ? 'online' : 'offline';
  }

  override async shutdown(): Promise<void> {
    // Close all connections
    for (const [agentId] of this.connections) {
      await this.disconnect(agentId);
    }
    await super.shutdown();
  }
}

// Export a factory function for easy registration
export function createAtreidesAdapter(): AtreidesAdapter {
  return new AtreidesAdapter();
}
