// src/middlewares/rateLimiter.ts
import rateLimit, { Options } from "express-rate-limit";
import { Request, Response, NextFunction } from "express";

const NOOP = (_req: Request, _res: Response, next: NextFunction) => next();

/**
 * Create a rate limiter. When running tests we return a no-op middleware
 * so the test suite isn't constrained by IP-based limits.
 */
export const createRateLimiter = (opts?: Partial<Options>) => {
  if (process.env.NODE_ENV === "test") {
    return NOOP;
  }

  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    ...opts,
  });
};

// Stronger limiter for auth endpoints (skipped during tests)
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 attempts per 15 minutes per IP in non-test env
  message: { error: "Too many requests, please try again later." },
});
