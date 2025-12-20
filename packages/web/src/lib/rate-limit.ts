/**
 * Rate Limiting Utility
 * In-memory rate limiting for tRPC endpoints
 * 
 * SECURITY FIX: Prevents API credit exhaustion and brute force attacks
 * See: https://github.com/joelfuller2016/job-applier/issues/18
 * 
 * Note: For production with horizontal scaling, consider upgrading to Redis-based
 * rate limiting (e.g., @upstash/ratelimit)
 */

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  success: boolean;
  /** Number of requests remaining in the current window */
  remaining: number;
  /** Timestamp when the rate limit resets (ms since epoch) */
  resetAt: number;
  /** Total limit for the window */
  limit: number;
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

/**
 * In-memory rate limiter using sliding window algorithm
 */
class RateLimiter {
  private records: Map<string, RateLimitRecord> = new Map();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Clean up expired records every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check and update rate limit for a given key
   */
  check(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const record = this.records.get(key);

    // If no record exists or window has expired, create new record
    if (!record || now >= record.resetAt) {
      const resetAt = now + config.windowMs;
      this.records.set(key, { count: 1, resetAt });
      return {
        success: true,
        remaining: config.limit - 1,
        resetAt,
        limit: config.limit,
      };
    }

    // Check if limit exceeded
    if (record.count >= config.limit) {
      return {
        success: false,
        remaining: 0,
        resetAt: record.resetAt,
        limit: config.limit,
      };
    }

    // Increment count
    record.count++;
    return {
      success: true,
      remaining: config.limit - record.count,
      resetAt: record.resetAt,
      limit: config.limit,
    };
  }

  /**
   * Clean up expired records to prevent memory leaks
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.records.entries()) {
      if (now >= record.resetAt) {
        this.records.delete(key);
      }
    }
  }

  /**
   * Stop the cleanup interval (for testing/shutdown)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get current stats (for monitoring)
   */
  getStats(): { activeKeys: number } {
    return { activeKeys: this.records.size };
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

/**
 * Pre-configured rate limit tiers
 */
export const RATE_LIMITS = {
  /**
   * General API rate limit
   * 100 requests per minute per user/IP
   */
  GENERAL: {
    limit: 100,
    windowMs: 60 * 1000, // 1 minute
  } as RateLimitConfig,

  /**
   * Authentication endpoints
   * 10 requests per minute (prevents brute force)
   */
  AUTH: {
    limit: 10,
    windowMs: 60 * 1000, // 1 minute
  } as RateLimitConfig,

  /**
   * AI-powered endpoints (expensive API calls)
   * 10 requests per minute per user
   */
  AI_OPERATIONS: {
    limit: 10,
    windowMs: 60 * 1000, // 1 minute
  } as RateLimitConfig,

  /**
   * Hunt/Automation start (very expensive)
   * 3 per 5 minutes per user
   */
  EXPENSIVE_OPERATIONS: {
    limit: 3,
    windowMs: 5 * 60 * 1000, // 5 minutes
  } as RateLimitConfig,

  /**
   * Search operations
   * 30 requests per minute
   */
  SEARCH: {
    limit: 30,
    windowMs: 60 * 1000, // 1 minute
  } as RateLimitConfig,

  /**
   * Read operations (queries)
   * 200 requests per minute
   */
  READ: {
    limit: 200,
    windowMs: 60 * 1000, // 1 minute
  } as RateLimitConfig,

  /**
   * Write operations (mutations)
   * 50 requests per minute
   */
  WRITE: {
    limit: 50,
    windowMs: 60 * 1000, // 1 minute
  } as RateLimitConfig,
} as const;

/**
 * Check rate limit for a request
 * @param identifier - User ID, IP address, or other unique identifier
 * @param config - Rate limit configuration
 * @param prefix - Optional prefix for the key (e.g., endpoint name)
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
  prefix?: string
): RateLimitResult {
  const key = prefix ? `${prefix}:${identifier}` : identifier;
  return rateLimiter.check(key, config);
}

/**
 * Get rate limiter stats for monitoring
 */
export function getRateLimiterStats(): { activeKeys: number } {
  return rateLimiter.getStats();
}

/**
 * Format rate limit headers for HTTP response
 */
export function formatRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetAt / 1000).toString(),
  };
}
