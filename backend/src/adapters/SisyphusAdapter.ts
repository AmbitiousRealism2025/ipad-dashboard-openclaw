/**
 * Sisyphus Agent Adapter
 *
 * Sample implementation of the AgentAdapter interface for Sisyphus-style agents.
 * Sisyphus agents are task execution focused with automation capabilities.
 */

import { BaseAgentAdapter, AgentConfig, type CommandRequest } from '../services/agentAdapter';
import type { Agent, AgentStatus, CommandResponse } from '../types';

export class SisyphusAdapter extends BaseAgentAdapter {
  readonly type = 'sisyphus';
  readonly displayName = 'Sisyphus Agent';

  async connect(config: AgentConfig): Promise<Agent> {
    const agent: Agent = {
      id: config.id,
      name: config.name,
      type: this.type,
      status: 'online',
      lastSeen: new Date(),
      capabilities: config.capabilities,
      metadata: config.metadata,
    };

    this.emitStatusUpdate({
      agentId: agent.id,
      status: 'online',
      timestamp: new Date(),
      message: 'Sisyphus agent connected and ready',
    });

    return agent;
  }

  async disconnect(agentId: string): Promise<void> {
    this.emitStatusUpdate({
      agentId,
      status: 'offline',
      timestamp: new Date(),
      message: 'Sisyphus agent disconnected',
    });
  }

  async sendCommand(agentId: string, request: CommandRequest): Promise<CommandResponse> {
    const startTime = Date.now();

    try {
      // Simulate task execution
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Sisyphus agents are task-focused, so they return task info
      return {
        success: true,
        result: {
          taskId: `task-${Date.now()}`,
          command: request.command,
          status: 'queued',
          estimatedDuration: '30s',
          message: `Task "${request.command}" queued for execution`,
        },
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Task execution failed',
        executionTime: Date.now() - startTime,
      };
    }
  }

  async getStatus(agentId: string): Promise<AgentStatus> {
    // Simulate status check
    return 'online';
  }
}

export function createSisyphusAdapter(): SisyphusAdapter {
  return new SisyphusAdapter();
}
