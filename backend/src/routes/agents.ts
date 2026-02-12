import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedRequest } from '../middleware/auth';
import { Agent, AgentStatus, CommandRequest, CommandResponse } from '../types';
import { mcpClient } from '../services/mcp';
import { auditLogger } from '../services/auditLog';
import { commandRateLimiter } from '../middleware/rateLimit';

const router = Router();

// In-memory agent store (replace with database in production)
const agents: Map<string, Agent> = new Map();

// Seed with demo agents
const seedAgents = () => {
  const demoAgents: Agent[] = [
    {
      id: uuidv4(),
      name: 'Atreides',
      type: 'atreides',
      status: 'online',
      lastSeen: new Date(),
      capabilities: ['research', 'analysis', 'code-review'],
      metadata: { version: '1.0.0' },
    },
    {
      id: uuidv4(),
      name: 'Sisyphus',
      type: 'sisyphus',
      status: 'online',
      lastSeen: new Date(),
      capabilities: ['task-execution', 'automation', 'monitoring'],
      metadata: { version: '1.0.0' },
    },
  ];

  demoAgents.forEach((agent) => agents.set(agent.id, agent));
};
seedAgents();

// GET /api/agents
router.get('/', (_req, res: Response) => {
  const agentList = Array.from(agents.values()).map((agent) => ({
    ...agent,
    lastSeen: agent.lastSeen.toISOString(),
  }));

  res.json({ agents: agentList, total: agentList.length });
});

// GET /api/agents/:id
router.get('/:id', (req, res: Response) => {
  const id = req.params.id as string;
  const agent = agents.get(id);

  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }

  res.json({
    ...agent,
    lastSeen: agent.lastSeen.toISOString(),
  });
});

// POST /api/agents/:id/command
router.post('/:id/command', commandRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id as string;
  const { command, parameters } = req.body as CommandRequest;
  const user = req.user;

  const agent = agents.get(id);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }

  if (agent.status === 'offline') {
    return res.status(400).json({ error: 'Agent is offline' });
  }

  try {
    const startTime = Date.now();

    // Audit log command dispatch
    auditLogger.log({
      userId: user?.userId || 'unknown',
      email: user?.email || 'unknown',
      action: 'command_sent',
      target: id,
      details: { command, agentName: agent.name },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Forward command to MCP layer
    const response = await mcpClient.sendCommand(id, command, parameters);

    const executionTime = Date.now() - startTime;

    const commandResponse: CommandResponse = {
      success: response.success,
      result: response.result,
      error: response.error,
      executionTime,
    };

    res.json(commandResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Command failed',
      executionTime: 0,
    });
  }
});

// PUT /api/agents/:id/status (for MCP updates)
router.put('/:id/status', (req, res: Response) => {
  const id = req.params.id as string;
  const { status } = req.body as { status: AgentStatus };

  const agent = agents.get(id);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }

  agent.status = status;
  agent.lastSeen = new Date();
  agents.set(id, agent);

  res.json({ ...agent, lastSeen: agent.lastSeen.toISOString() });
});

export default router;
export { agents };
