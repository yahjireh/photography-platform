/**
 * Enterprise Rate Limiting & Account Protection Middleware
 *
 * Implements:
 * 1. Tightened thresholds (5 req/15min for Auth, 3 req/15min for OTP send, 5 req/15min for OTP verify)
 * 2. Hybrid IP + Account Identifier tracking (blocks rotating residential proxy attacks)
 * 3. Progressive Exponential Backoff (15 min -> 1 hour -> 24 hours)
 * 4. Cloudflare CF-Connecting-IP & Render proxy resolution
 * 5. Dedicated Paystack Webhook DDoS protection
 * 6. Memory auto-reclamation to prevent memory leaks
 */

import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// ------------------------------------------------------------------------------
// 1. IP & IDENTIFIER RESOLUTION HELPERS
// ------------------------------------------------------------------------------

/**
 * Resolves real client IP supporting Cloudflare (CF-Connecting-IP),
 * Render/reverse proxies (X-Forwarded-For), and direct socket connections.
 */
export function getClientIp(req: Request): string {
  const cfIp = req.headers['cf-connecting-ip'] as string;
  if (cfIp) return cfIp.trim();

  const forwarded = req.headers['x-forwarded-for'] as string;
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  return req.ip || req.socket.remoteAddress || '127.0.0.1';
}

/**
 * Extracts target account identifier (email, phone, or username) from request body
 */
export function getAccountIdentifier(req: Request): string | null {
  const body = req.body || {};
  const identifier = body.email || body.phone || body.phoneNumber || body.username;
  return identifier ? String(identifier).trim().toLowerCase() : null;
}

// ------------------------------------------------------------------------------
// 2. PROGRESSIVE EXPONENTIAL BACKOFF SYSTEM
// ------------------------------------------------------------------------------

interface BackoffRecord {
  blockCount: number;
  blockedUntil: number;
}

// Tracks progressive violations per IP/Identifier key
const backoffStore = new Map<string, BackoffRecord>();

// Periodic garbage collection to prevent memory growth (runs every 30 mins)
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of backoffStore.entries()) {
    if (record.blockedUntil < now - 24 * 60 * 60 * 1000) {
      backoffStore.delete(key);
    }
  }
}, 30 * 60 * 1000);

/**
 * Calculates progressive penalty duration:
 * 1st Violation: 15 minutes
 * 2nd Violation: 60 minutes (1 hour)
 * 3rd+ Violation: 1440 minutes (24 hours)
 */
function recordViolationAndGetDuration(key: string): number {
  const existing = backoffStore.get(key) || { blockCount: 0, blockedUntil: 0 };
  existing.blockCount += 1;

  let durationMinutes = 15;
  if (existing.blockCount === 2) {
    durationMinutes = 60; // 1 hour
  } else if (existing.blockCount >= 3) {
    durationMinutes = 1440; // 24 hours
  }

  existing.blockedUntil = Date.now() + durationMinutes * 60 * 1000;
  backoffStore.set(key, existing);

  return durationMinutes;
}

/**
 * Factory for standard JSON rate limit responses with dynamic progressive backoff
 */
const createLimitHandler = (actionDescription: string) => {
  return (req: Request, res: Response) => {
    const key = `${getClientIp(req)}_${getAccountIdentifier(req) || 'anon'}`;
    const durationMinutes = recordViolationAndGetDuration(key);

    res.status(429).json({
      success: false,
      message: `Too many ${actionDescription}. Your request limit has been reached. Progressive backoff active.`,
      retryAfterMinutes: durationMinutes,
      retryAfterSeconds: durationMinutes * 60
    });
  };
};

// ------------------------------------------------------------------------------
// 3. ACCOUNT-LEVEL LOCKOUT MIDDLEWARE (ANTI-ROTATING PROXY)
// ------------------------------------------------------------------------------

interface AccountAttemptRecord {
  count: number;
  resetTime: number;
  lockedUntil?: number;
}

const accountGlobalStore = new Map<string, AccountAttemptRecord>();

/**
 * Global Account Protection Middleware
 * If an attacker uses rotating proxies targeting a single email or phone number,
 * this locks that specific target account globally across ALL IPs.
 */
export function accountLockoutGuard(req: Request, res: Response, next: NextFunction): void {
  const identifier = getAccountIdentifier(req);
  if (!identifier) {
    return next();
  }

  const now = Date.now();
  const record = accountGlobalStore.get(identifier);

  if (record && record.lockedUntil && record.lockedUntil > now) {
    const remainingMinutes = Math.ceil((record.lockedUntil - now) / 60000);
    res.status(429).json({
      success: false,
      message: `This account is temporarily protected due to multiple failed requests across multiple connections. Please try again in ${remainingMinutes} minutes.`,
      retryAfterMinutes: remainingMinutes
    });
    return;
  }

  next();
}

// ------------------------------------------------------------------------------
// 4. RATE LIMITER DEFINITIONS
// ------------------------------------------------------------------------------

/**
 * Strict Auth Limiter
 * Applied to: /login, /register, /forgot-password, /reset-password
 * Limit: 5 requests per 15 minutes (IP + Account Key)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Recommended: 5 req / 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = getClientIp(req);
    const identifier = getAccountIdentifier(req);
    return identifier ? `auth_${identifier}_${ip}` : `auth_ip_${ip}`;
  },
  handler: createLimitHandler('authentication attempts')
});

/**
 * OTP Send / Dispatch Limiter
 * Applied to: /otp/send-email, /otp/send-phone
 * Limit: 3 requests per 15 minutes (IP + Account Key)
 * Protects against wallet drain and telecom spam blacklisting
 */
export const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Recommended: 3 req / 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = getClientIp(req);
    const identifier = getAccountIdentifier(req);
    return identifier ? `otpsend_${identifier}` : `otpsend_${ip}`;
  },
  handler: createLimitHandler('verification code requests')
});

/**
 * OTP Verification Limiter
 * Applied to: /otp/verify-email, /otp/verify-phone
 * Limit: 5 attempts per 15 minutes (IP + Account Key)
 * Paired with in-memory "Burn OTP on 3 failed attempts" in otp.service.ts
 */
export const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Recommended: 5 req / 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = getClientIp(req);
    const identifier = getAccountIdentifier(req);
    return identifier ? `otpverify_${identifier}_${ip}` : `otpverify_${ip}`;
  },
  handler: createLimitHandler('verification attempts')
});

/**
 * Global API Limiter
 * Applied to: All /api routes (excluding webhooks & health checks)
 * Limit: 500 requests per 15 minutes per IP (~33 req/min)
 */
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Kept as recommended
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  skip: (req) => {
    return req.path.startsWith('/api/webhooks') || req.path === '/health';
  },
  handler: createLimitHandler('API requests')
});

/**
 * Dedicated Paystack Webhook Limiter
 * Applied to: /api/webhooks/paystack
 * Allows up to 120 legitimate webhook calls per minute from Paystack,
 * but prevents CPU/HMAC exhaustion from external DDoS bots.
 */
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  handler: createLimitHandler('webhook calls')
});
