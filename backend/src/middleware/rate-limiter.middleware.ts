/**
 * Rate Limiting Middleware
 * Protects backend services against brute force, credential stuffing, and DoS attacks
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Standard JSON response handler for 429 Too Many Requests
 */
const createLimitHandler = (message: string) => {
  return (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message,
      retryAfterMinutes: 15
    });
  };
};

/**
 * General API Limiter
 * Applied globally across all /api endpoints (excluding webhooks)
 * Max: 500 requests per 15 minutes per IP
 */
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Never throttle external webhooks (e.g. Paystack callbacks) or health checks
    return req.path.startsWith('/api/webhooks') || req.path === '/health';
  },
  handler: createLimitHandler('Too many requests from this IP. Please slow down and try again shortly.')
});

/**
 * Strict Auth Limiter
 * Applied to sensitive authentication actions: login, register, password reset
 * Max: 25 requests per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimitHandler('Too many authentication attempts. Please try again in 15 minutes.')
});

/**
 * OTP Request / Dispatch Limiter
 * Protects email & SMS dispatch services against spam and cost-exhaustion
 * Max: 8 OTP send requests per 10 minutes per IP
 */
export const otpSendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimitHandler('Too many verification code requests. Please wait a few minutes before requesting another code.')
});

/**
 * OTP Verification Limiter
 * Prevents automated brute-force guessing of 6-digit verification codes
 * Max: 15 verification attempts per 15 minutes per IP
 */
export const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createLimitHandler('Too many verification attempts. Please request a new code or try again later.')
});
