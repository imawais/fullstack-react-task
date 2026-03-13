import type { Request, Response, NextFunction } from 'express';

interface Window {
  count: number;
  resetAt: number;
}

// two windows per IP:
//   minute window — prevents sustained abuse (10 req / 60s)
//   burst window  — prevents spike abuse (5 req / 10s)
//
// one window alone isn't enough. with only a per-minute limit,
// someone could fire all 10 requests in the first second and
// then sit under the limit for the remaining 59s.
export class RateLimiter {
  private readonly minuteLimit: number;
  private readonly burstLimit: number;
  private readonly minuteMs = 60_000;
  private readonly burstMs  = 10_000;

  private minuteWindows = new Map<string, Window>();
  private burstWindows  = new Map<string, Window>();

  constructor(minuteLimit = 10, burstLimit = 5) {
    this.minuteLimit = minuteLimit;
    this.burstLimit  = burstLimit;

    // without this the maps would grow indefinitely as new IPs connect
    const cleanup = setInterval(() => {
      const now = Date.now();
      for (const [ip, w] of this.minuteWindows) {
        if (now > w.resetAt) this.minuteWindows.delete(ip);
      }
      for (const [ip, w] of this.burstWindows) {
        if (now > w.resetAt) this.burstWindows.delete(ip);
      }
    }, 300_000);
    cleanup.unref();
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const ip  = (req.ip ?? 'unknown').replace('::ffff:', '');
      const now = Date.now();

      // get or reset windows for this IP
      let minute = this.minuteWindows.get(ip);
      if (!minute || now > minute.resetAt) {
        minute = { count: 0, resetAt: now + this.minuteMs };
        this.minuteWindows.set(ip, minute);
      }

      let burst = this.burstWindows.get(ip);
      if (!burst || now > burst.resetAt) {
        burst = { count: 0, resetAt: now + this.burstMs };
        this.burstWindows.set(ip, burst);
      }

      if (minute.count >= this.minuteLimit) {
        const retryAfter = Math.ceil((minute.resetAt - now) / 1000);
        res.status(429).json({
          error: 'Rate limit exceeded',
          message: `Max ${this.minuteLimit} requests per minute. Retry in ${retryAfter}s.`,
          retryAfter,
        });
        return;
      }

      if (burst.count >= this.burstLimit) {
        const retryAfter = Math.ceil((burst.resetAt - now) / 1000);
        res.status(429).json({
          error: 'Burst limit exceeded',
          message: `Max ${this.burstLimit} requests per 10 seconds. Retry in ${retryAfter}s.`,
          retryAfter,
        });
        return;
      }

      minute.count++;
      burst.count++;
      next();
    };
  }
}
