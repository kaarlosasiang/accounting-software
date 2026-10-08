import { NextFunction, Request, Response } from "express";

/**
 * Minimal fixed-window rate limiter (no external dependency).
 *
 * Counters live in this process's memory, which is correct for a single API
 * instance. When the API runs as several instances behind a load balancer
 * each instance counts separately; move the store to a shared backend
 * (e.g. Redis) at that point.
 *
 * Clients are identified by `req.ip`, which honours `trust proxy` (set in
 * config/app.ts) so the real client address is used behind nginx.
 */
export interface RateLimitOptions {
  /** Window length in milliseconds. */
  windowMs: number;
  /** Requests allowed per client per window. */
  max: number;
  /** Separates counters of different limiters. */
  name: string;
  /** Defaults to off under NODE_ENV=test so suites aren't throttled. */
  enabled?: boolean;
  message?: string;
}

interface Bucket {
  count: number;
  resetAt: number;
}

export function rateLimit(options: RateLimitOptions) {
  const enabled = options.enabled ?? process.env.NODE_ENV !== "test";
  const buckets = new Map<string, Bucket>();

  // Periodically drop expired windows so the map cannot grow unbounded.
  const sweeper = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }, options.windowMs);
  sweeper.unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!enabled) return next();

    const now = Date.now();
    const key = `${options.name}:${req.ip ?? "unknown"}`;
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + options.windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;

    const remaining = Math.max(0, options.max - bucket.count);
    const resetSeconds = Math.ceil((bucket.resetAt - now) / 1000);
    res.setHeader("RateLimit-Limit", String(options.max));
    res.setHeader("RateLimit-Remaining", String(remaining));
    res.setHeader("RateLimit-Reset", String(resetSeconds));

    if (bucket.count > options.max) {
      res.setHeader("Retry-After", String(resetSeconds));
      res.status(429).json({
        success: false,
        error:
          options.message ?? "Too many requests. Please try again shortly.",
      });
      return;
    }

    next();
  };
}
