import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation error',
          details: error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
}

export function validateParams<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params) as typeof req.params;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation error',
          details: error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
}

// Common validation schemas
export const schemas = {
  login: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),

  command: z.object({
    command: z.string().min(1, 'Command is required'),
    parameters: z.record(z.unknown()).optional(),
  }),

  taskCreate: z.object({
    name: z.string().min(1, 'Task name is required').max(100),
    description: z.string().max(500).optional(),
    agentId: z.string().min(1, 'Agent ID is required'),
  }),

  taskStatus: z.object({
    status: z.enum(['queued', 'running', 'completed', 'failed', 'cancelled']),
    progress: z.number().min(0).max(100).optional(),
    error: z.string().optional(),
  }),

  agentStatus: z.object({
    status: z.enum(['online', 'offline', 'busy', 'error']),
  }),

  idParam: z.object({
    id: z.string().min(1, 'ID is required'),
  }),

  notification: z.object({
    type: z.enum(['agent_error', 'task_complete', 'task_failed', 'security_alert', 'system']),
    title: z.string().min(1, 'Title is required').max(100),
    message: z.string().min(1, 'Message is required').max(500),
    metadata: z.record(z.unknown()).optional(),
  }),
};
