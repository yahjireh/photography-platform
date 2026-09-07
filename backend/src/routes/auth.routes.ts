/**
 * Authentication Routes
 * Defines URL paths for authentication endpoints
 */

import express from 'express';
import {
  register,
  login,
  oauthLogin,
  forgotPassword,
  resetPassword,
  sendEmailOtpHandler,
  verifyEmailOtpHandler,
  verifyEmailLinkHandler,
  sendPhoneOtpHandler,
  verifyPhoneOtpHandler
} from '../controllers/auth.controller';
import {
  authLimiter,
  otpSendLimiter,
  otpVerifyLimiter,
  accountLockoutGuard
} from '../middleware/rate-limiter.middleware';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user (rate limited + account locked)
 */
router.post('/register', accountLockoutGuard, authLimiter, register);

/**
 * POST /api/auth/login
 * Authenticate existing user (rate limited + account locked)
 */
router.post('/login', accountLockoutGuard, authLimiter, login);

/**
 * POST /api/auth/oauth
 * Authenticate via Google or Apple OAuth (rate limited)
 */
router.post('/oauth', authLimiter, oauthLogin);

/**
 * POST /api/auth/forgot-password
 * Check user email and dispatch password reset token/link (rate limited + account locked)
 */
router.post('/forgot-password', accountLockoutGuard, authLimiter, forgotPassword);

/**
 * POST /api/auth/reset-password
 * Verify reset token and apply new password (rate limited)
 */
router.post('/reset-password', authLimiter, resetPassword);

// ============================================
// OTP VERIFICATION ROUTES (EMAIL & PHONE)
// ============================================

/**
 * POST /api/auth/otp/send-email (rate limited + account locked)
 */
router.post('/otp/send-email', accountLockoutGuard, otpSendLimiter, sendEmailOtpHandler);

/**
 * POST /api/auth/otp/verify-email (rate limited + account locked)
 */
router.post('/otp/verify-email', accountLockoutGuard, otpVerifyLimiter, verifyEmailOtpHandler);

/**
 * GET /api/auth/verify-email-link (1-click email verification from inbox)
 */
router.get('/verify-email-link', verifyEmailLinkHandler);

/**
 * POST /api/auth/otp/send-phone (rate limited + account locked)
 */
router.post('/otp/send-phone', accountLockoutGuard, otpSendLimiter, sendPhoneOtpHandler);

/**
 * POST /api/auth/otp/verify-phone (rate limited + account locked)
 */
router.post('/otp/verify-phone', accountLockoutGuard, otpVerifyLimiter, verifyPhoneOtpHandler);

export default router;