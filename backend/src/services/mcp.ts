import { v4 as uuidv4 } from 'uuid';
import { MCPMessage, MCPMessageType, CommandResponse } from '../types';

// MCP Client configuration
const MCP_ENDPOINT = process.env.MCP_ENDPOINT || 'ws://localhost:3002';
const MCP_TIMEOUT = parseInt(process.env.MCP_TIMEOUT || '30000', 10);

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}

// Simple MCP client for Phase 1 (will be enhanced in Phase 2)
class MCPClient {
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private connected = false;

  constructor() {
    // In Phase 1, we simulate MCP responses
    // Phase 2 will implement actual MCP WebSocket connection
  }

  async sendCommand(
    agentId: string,
    command: string,
    parameters?: Record<string, unknown>
  ): Promise<CommandResponse> {
    const messageId = uuidv4();

    // Create the MCP message envelope
    const message: MCPMessage = {
      id: messageId,
      type: 'command',
      timestamp: new Date(),
      source: 'dashboard-backend',
      target: agentId,
      payload: {
        command,
        parameters: parameters || {},
      },
    };

    // For Phase 1, simulate response
    // In Phase 2, this will send to actual MCP endpoint
    return this.simulateResponse(message);
  }

  private simulateResponse(message: MCPMessage): Promise<CommandResponse> {
    return new Promise((resolve) => {
      // Simulate network latency
      setTimeout(() => {
        const responses: Record<string, CommandResponse> = {
          status: {
            success: true,
            result: {
              status: 'operational',
              uptime: Math.floor(Math.random() * 86400),
              lastTask: new Date().toISOString(),
            },
            executionTime: Math.random() * 100,
          },
          list: {
            success: true,
            result: {
              items: ['task1', 'task2', 'task3'],
              count: 3,
            },
            executionTime: Math.random() * 150,
          },
          help: {
            success: true,
            result: {
              commands: ['status', 'list', 'help', 'run', 'stop'],
              description: 'Available agent commands',
            },
            executionTime: Math.random() * 50,
          },
        };

        const payload = message.payload as { command: string };
        const response = responses[payload.command] || {
          success: true,
          result: { message: `Command '${payload.command}' executed successfully` },
          executionTime: Math.random() * 200,
        };

        resolve(response);
      }, Math.random() * 500 + 100);
    });
  }

  async getAgentStatus(agentId: string): Promise<unknown> {
    return this.sendCommand(agentId, 'status');
  }

  isConnected(): boolean {
    return this.connected;
  }
}

export const mcpClient = new MCPClient();
export default mcpClient;
