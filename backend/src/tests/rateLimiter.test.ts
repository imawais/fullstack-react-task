import { describe, it, expect, vi, afterEach } from 'vitest';
import { RateLimiter } from '../rateLimiter';
import type { Request, Response, NextFunction } from 'express';

// we test the middleware directly without spinning up Express.
// just need minimal req/res mocks.

function makeReq(ip = '127.0.0.1'): Partial<Request> {
  return { ip };
}

function makeRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json:   vi.fn().mockReturnThis(),
  };
}

const next = vi.fn() as unknown as NextFunction;

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('RateLimiter', () => {
  it('lets requests through when under the limit', () => {
    const limiter = new RateLimiter(10, 5);
    const mw      = limiter.middleware();
    const res     = makeRes();

    mw(makeReq() as Request, res as unknown as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('blocks with 429 once the burst limit is hit', () => {
    const limiter = new RateLimiter(10, 3); // burst cap of 3
    const mw      = limiter.middleware();
    const req     = makeReq();

    // use up the burst window
    for (let i = 0; i < 3; i++) {
      mw(req as Request, makeRes() as unknown as Response, next);
    }

    const res = makeRes();
    mw(req as Request, res as unknown as Response, next);

    expect(res.status).toHaveBeenCalledWith(429);
  });

  it('blocks with 429 once the minute limit is hit', () => {
    vi.useFakeTimers();

    // high burst limit so only the minute window is the bottleneck
    const limiter = new RateLimiter(3, 100);
    const mw      = limiter.middleware();
    const req     = makeReq();

    for (let i = 0; i < 3; i++) {
      mw(req as Request, makeRes() as unknown as Response, next);
      vi.advanceTimersByTime(11_000); // clear the burst window each time
    }

    const res = makeRes();
    mw(req as Request, res as unknown as Response, next);

    expect(res.status).toHaveBeenCalledWith(429);
  });

  it('allows requests again after the window resets', () => {
    vi.useFakeTimers();

    const limiter = new RateLimiter(10, 2); // burst cap of 2
    const mw      = limiter.middleware();
    const req     = makeReq();

    // fill the burst window
    mw(req as Request, makeRes() as unknown as Response, next);
    mw(req as Request, makeRes() as unknown as Response, next);

    vi.advanceTimersByTime(11_000); // past the 10s burst window

    const res = makeRes();
    mw(req as Request, res as unknown as Response, next);

    expect(res.status).not.toHaveBeenCalled();
  });

  it('tracks limits per IP independently', () => {
    const limiter = new RateLimiter(10, 1); // burst cap of 1
    const mw      = limiter.middleware();

    // use up ip1's allowance
    mw(makeReq('1.1.1.1') as Request, makeRes() as unknown as Response, next);

    // ip2 should still be fine
    const res = makeRes();
    mw(makeReq('2.2.2.2') as Request, res as unknown as Response, next);

    expect(res.status).not.toHaveBeenCalled();
  });
});
