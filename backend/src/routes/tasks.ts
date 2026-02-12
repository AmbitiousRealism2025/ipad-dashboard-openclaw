import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedRequest } from '../middleware/auth';
import { Task, TaskStatus } from '../types';

const router = Router();

// In-memory task store
const tasks: Map<string, Task> = new Map();

// Seed with demo tasks
const seedTasks = () => {
  const demoTasks: Task[] = [
    {
      id: uuidv4(),
      name: 'Daily Health Check',
      description: 'Run automated health checks on all agents',
      agentId: 'sisyphus',
      status: 'running',
      progress: 45,
      createdAt: new Date(Date.now() - 5 * 60 * 1000),
      updatedAt: new Date(),
    },
    {
      id: uuidv4(),
      name: 'Research Summary',
      description: 'Generate weekly research summary',
      agentId: 'atreides',
      status: 'completed',
      progress: 100,
      createdAt: new Date(Date.now() - 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 30 * 60 * 1000),
      completedAt: new Date(Date.now() - 30 * 60 * 1000),
    },
  ];

  demoTasks.forEach((task) => tasks.set(task.id, task));
};
seedTasks();

// GET /api/tasks
router.get('/', (_req, res: Response) => {
  const taskList = Array.from(tasks.values())
    .map((task) => ({
      ...task,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      completedAt: task.completedAt?.toISOString(),
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  res.json({ tasks: taskList, total: taskList.length });
});

// GET /api/tasks/:id
router.get('/:id', (req, res: Response) => {
  const task = tasks.get(req.params.id);

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  res.json({
    ...task,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    completedAt: task.completedAt?.toISOString(),
  });
});

// POST /api/tasks
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  const { name, description, agentId } = req.body;

  if (!name || !agentId) {
    return res.status(400).json({ error: 'Name and agentId required' });
  }

  const task: Task = {
    id: uuidv4(),
    name,
    description,
    agentId,
    status: 'queued',
    progress: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  tasks.set(task.id, task);

  res.status(201).json({
    ...task,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  });
});

// PUT /api/tasks/:id/status
router.put('/:id/status', (req, res: Response) => {
  const { id } = req.params;
  const { status, progress, error } = req.body as {
    status: TaskStatus;
    progress?: number;
    error?: string;
  };

  const task = tasks.get(id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  task.status = status;
  if (progress !== undefined) task.progress = Math.min(100, Math.max(0, progress));
  if (error) task.error = error;
  task.updatedAt = new Date();

  if (status === 'completed' || status === 'failed') {
    task.completedAt = new Date();
    task.progress = status === 'completed' ? 100 : task.progress;
  }

  tasks.set(id, task);

  res.json({
    ...task,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    completedAt: task.completedAt?.toISOString(),
  });
});

export default router;
