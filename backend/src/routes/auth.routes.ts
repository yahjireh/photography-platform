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
  sendPhoneOtpHandler,
  verifyPhoneOtpHandler
} from '../controllers/auth.controller';
import {
  authLimiter,
  otpSendLimiter,
  otpVerifyLimiter
} from '../middleware/rate-limiter.middleware';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user (rate limited)
 */
router.post('/register', authLimiter, register);

/**
 * POST /api/auth/login
 * Authenticate existing user (rate limited)
 */
router.post('/login', authLimiter, login);

/**
 * POST /api/auth/oauth
 * Authenticate via Google or Apple OAuth (rate limited)
 */
router.post('/oauth', authLimiter, oauthLogin);

/**
 * POST /api/auth/forgot-password
 * Check user email and dispatch password reset token/link (rate limited)
 */
router.post('/forgot-password', authLimiter, forgotPassword);

/**
 * POST /api/auth/reset-password
 * Verify reset token and apply new password (rate limited)
 */
router.post('/reset-password', authLimiter, resetPassword);

// ============================================
// OTP VERIFICATION ROUTES (EMAIL & PHONE)
// ============================================

/**
 * POST /api/auth/otp/send-email (rate limited)
 */
router.post('/otp/send-email', otpSendLimiter, sendEmailOtpHandler);

/**
 * POST /api/auth/otp/verify-email (rate limited)
 */
router.post('/otp/verify-email', otpVerifyLimiter, verifyEmailOtpHandler);

/**
 * POST /api/auth/otp/send-phone (rate limited)
 */
router.post('/otp/send-phone', otpSendLimiter, sendPhoneOtpHandler);

/**
 * POST /api/auth/otp/verify-phone (rate limited)
 */
router.post('/otp/verify-phone', otpVerifyLimiter, verifyPhoneOtpHandler);

export default router;