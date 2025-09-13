import { getClientIp } from "./auth";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private cache = new Map<string, RateLimitRecord>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.cache.entries()) {
      if (now > record.resetTime) {
        this.cache.delete(key);
      }
    }
  }

  check(identifier: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const record = this.cache.get(identifier);

    if (!record || now > record.resetTime) {
      this.cache.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });
      return true;
    }

    if (record.count >= maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }

  getRemainingRequests(identifier: string, maxRequests: number): number {
    const record = this.cache.get(identifier);
    if (!record || Date.now() > record.resetTime) {
      return maxRequests;
    }
    return Math.max(0, maxRequests - record.count);
  }

  getResetTime(identifier: string): number | null {
    const record = this.cache.get(identifier);
    if (!record || Date.now() > record.resetTime) {
      return null;
    }
    return record.resetTime;
  }

  clear(identifier?: string): void {
    if (identifier) {
      this.cache.delete(identifier);
    } else {
      this.cache.clear();
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

// Create global rate limiter instance
const rateLimiter = new RateLimiter();

// Rate limit configurations
export const RATE_LIMITS = {
  AUTH: {
    maxRequests: 5,
    windowMs: 5 * 60 * 1000, // 5 minutes
  },
  UPLOAD: {
    maxRequests: 10,
    windowMs: 5 * 60 * 1000, // 5 minutes
  },
  API: {
    maxRequests: 100,
    windowMs: 5 * 60 * 1000, // 5 minutes
  },
} as const;

export function checkRateLimit(
  request: Request,
  config: { maxRequests: number; windowMs: number }
): {
  allowed: boolean;
  remaining: number;
  resetTime: number | null;
} {
  const ip = getClientIp(request as any);
  const identifier = ip;

  const allowed = rateLimiter.check(
    identifier,
    config.maxRequests,
    config.windowMs
  );

  const remaining = rateLimiter.getRemainingRequests(
    identifier,
    config.maxRequests
  );

  const resetTime = rateLimiter.getResetTime(identifier);

  return {
    allowed,
    remaining,
    resetTime,
  };
}

export function createRateLimitResponse(
  remaining: number,
  resetTime: number | null
): Response {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-RateLimit-Limit": "60",
    "X-RateLimit-Remaining": remaining.toString(),
  };

  if (resetTime) {
    headers["X-RateLimit-Reset"] = Math.ceil(resetTime / 1000).toString();
    headers["Retry-After"] = Math.ceil((resetTime - Date.now()) / 1000).toString();
  }

  return new Response(
    JSON.stringify({
      error: "Rate limit exceeded",
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests. Please try again later.",
    }),
    {
      status: 429,
      headers,
    }
  );
}

// Backward compatibility wrapper function
export async function rateLimit(
  request: Request,
  maxRequests: number,
  windowMs: number
): Promise<{
  success: boolean;
  retryAfter?: number;
}> {
  const result = checkRateLimit(request, { maxRequests, windowMs });

  if (!result.allowed) {
    const retryAfter = result.resetTime
      ? Math.ceil((result.resetTime - Date.now()) / 1000)
      : windowMs / 1000;

    return {
      success: false,
      retryAfter,
    };
  }

  return {
    success: true,
  };
}

// Cleanup on process exit - check if listeners already exist to prevent memory leak
if (!process.listenerCount('SIGINT')) {
  process.on("SIGINT", () => {
    rateLimiter.destroy();
  });
}

if (!process.listenerCount('SIGTERM')) {
  process.on("SIGTERM", () => {
    rateLimiter.destroy();
  });
}

export { rateLimiter };
