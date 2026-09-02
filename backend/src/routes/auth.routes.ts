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

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', register);

/**
 * POST /api/auth/login
 * Authenticate existing user
 */
router.post('/login', login);

/**
 * POST /api/auth/oauth
 * Authenticate via Google or Apple OAuth
 */
router.post('/oauth', oauthLogin);

/**
 * POST /api/auth/forgot-password
 * Check user email and dispatch password reset token/link
 */
router.post('/forgot-password', forgotPassword);

/**
 * POST /api/auth/reset-password
 * Verify reset token and apply new password
 */
router.post('/reset-password', resetPassword);

// ============================================
// OTP VERIFICATION ROUTES (EMAIL & PHONE)
// ============================================

/**
 * POST /api/auth/otp/send-email
 */
router.post('/otp/send-email', sendEmailOtpHandler);

/**
 * POST /api/auth/otp/verify-email
 */
router.post('/otp/verify-email', verifyEmailOtpHandler);

/**
 * POST /api/auth/otp/send-phone
 */
router.post('/otp/send-phone', sendPhoneOtpHandler);

/**
 * POST /api/auth/otp/verify-phone
 */
router.post('/otp/verify-phone', verifyPhoneOtpHandler);

export default router;