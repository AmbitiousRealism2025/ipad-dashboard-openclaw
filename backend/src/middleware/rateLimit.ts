import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (req: Request) => string;
  skipFailedRequests?: boolean;
}

export function createRateLimiter(options: RateLimitOptions) {
  const store: RateLimitStore = {};
  const { windowMs, maxRequests, keyGenerator, skipFailedRequests = false } = options;

  // Clean up expired entries periodically
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const key of Object.keys(store)) {
      if (store[key].resetTime < now) {
        delete store[key];
      }
    }
  }, windowMs);

  // Prevent memory leak in tests
  if (process.env.NODE_ENV === 'test') {
    clearInterval(cleanupInterval);
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = keyGenerator ? keyGenerator(req) : req.ip || 'unknown';
    const now = Date.now();

    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    store[key].count++;

    const remaining = Math.max(0, maxRequests - store[key].count);
    const resetTimeSeconds = Math.ceil((store[key].resetTime - now) / 1000);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', store[key].resetTime);

    if (store[key].count > maxRequests) {
      res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${resetTimeSeconds} seconds.`,
        retryAfter: resetTimeSeconds,
      });
      return;
    }

    // Track if response was successful
    if (skipFailedRequests) {
      const originalEnd = res.end;
      res.end = function (this: Response, ...args: Parameters<typeof res.end>) {
        if (res.statusCode >= 400) {
          store[key].count--;
        }
        return originalEnd.apply(this, args);
      } as typeof res.end;
    }

    next();
  };
}

// Default rate limiter: 60 requests per minute
export const defaultRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60,
  keyGenerator: (req: Request) => {
    // Use user ID if authenticated, otherwise use IP
    const user = (req as any).user;
    return user?.userId || req.ip || 'anonymous';
  },
});

// Strict rate limiter for auth endpoints: 5 requests per minute
export const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5,
  keyGenerator: (req: Request) => {
    // Use IP for unauthenticated requests
    return req.ip || req.body?.email || 'anonymous';
  },
});

// Command rate limiter: 30 commands per minute
export const commandRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30,
  keyGenerator: (req: Request) => {
    const user = (req as any).user;
    return user?.userId || req.ip || 'anonymous';
  },
});
