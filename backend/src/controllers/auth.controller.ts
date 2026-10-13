/**
 * Authentication Controller
 * Handles HTTP requests for authentication endpoints
 */

import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../config/database';
import { registerUser, loginUser, oauthLoginUser, requestPasswordReset, executePasswordReset } from '../services/auth.service';
import { RegisterUserDto, LoginUserDto } from '../types/user.types';
import { validateEmail, validatePhoneNumber } from '../services/validation.service';
import * as OtpService from '../services/otp.service';
import * as TwoFactorService from '../services/two-factor.service';

/**
 * Handle user registration
 * POST /api/auth/register
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const userData: RegisterUserDto = req.body;
    
    if (!userData.email || !userData.password || !userData.first_name ||
        !userData.last_name || !userData.user_type) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
      return;
    }

    // 1. Strict Email Validation (Syntax + Disposable Check + DNS MX Record Check)
    const emailValidation = await validateEmail(userData.email);
    if (!emailValidation.isValid) {
      res.status(400).json({
        success: false,
        message: emailValidation.reason || 'Invalid email address'
      });
      return;
    }

    // 2. Strict Phone Number Validation (if provided)
    if (userData.phone_number) {
      const phoneValidation = validatePhoneNumber(userData.phone_number);
      if (!phoneValidation.isValid) {
        res.status(400).json({
          success: false,
          message: phoneValidation.reason || 'Invalid phone number format'
        });
        return;
      }
      userData.phone_number = phoneValidation.formatted;
    }
    
    if (userData.password.length < 8) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
      return;
    }
    
    if (userData.user_type !== 'CLIENT' && userData.user_type !== 'PHOTOGRAPHER') {
      res.status(400).json({
        success: false,
        message: 'user_type must be either CLIENT or PHOTOGRAPHER'
      });
      return;
    }
    
    const result = await registerUser(userData);

    // Automatically trigger initial email OTP verification code
    let initialOtpCode: string | undefined;
    try {
      const emailOtpRes = await OtpService.sendEmailOtp(userData.email, userData.first_name);
      initialOtpCode = emailOtpRes.code;
    } catch (err) {
      console.error('Failed to dispatch initial email OTP:', err);
    }

    // If phone number provided, automatically trigger initial SMS OTP
    if (userData.phone_number) {
      OtpService.sendPhoneOtp(userData.phone_number).catch(err =>
        console.error('Failed to dispatch initial phone OTP:', err)
      );
    }
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully. Verification codes have been sent to your email and phone.',
      data: {
        ...result,
        otpCode: initialOtpCode
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'An error occurred during registration'
    });
  }
}

/**
 * Handle user login
 * POST /api/auth/login
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const credentials: LoginUserDto = req.body;
    
    if (!credentials.email || !credentials.password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
      return;
    }
    
    const result = await loginUser(credentials);

    // Check if 2FA is enabled for this user
    const twoFactorStatus = await TwoFactorService.get2FAStatus(result.user.id);
    if (twoFactorStatus.enabled) {
      const twoFactorCode = (req.body as any).twoFactorCode;
      if (!twoFactorCode) {
        res.status(200).json({
          success: true,
          twoFactorRequired: true,
          message: 'Two-factor authentication code required',
          data: {
            userId: result.user.id,
            email: result.user.email
          }
        });
        return;
      }

      const isValidCode = await TwoFactorService.validate2FALogin(result.user.id, twoFactorCode);
      if (!isValidCode) {
        res.status(401).json({
          success: false,
          message: 'Invalid two-factor authentication code. Please try again.'
        });
        return;
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error: any) {
    console.error('Login error:', error);
    const statusCode = error.message === 'Invalid email or password' || 
                       error.message === 'Account has been deactivated' 
                       ? 401
                       : 500;
    
    res.status(statusCode).json({
      success: false,
      message: error.message || 'An error occurred during login'
    });
  }
}

/**
 * Send Email OTP
 * POST /api/auth/otp/send-email
 */
export async function sendEmailOtpHandler(req: Request, res: Response): Promise<void> {
  try {
    const { email, firstName } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required' });
      return;
    }
    const result = await OtpService.sendEmailOtp(email, firstName);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Verify Email OTP (JSON API)
 * POST /api/auth/otp/verify-email
 */
export async function verifyEmailOtpHandler(req: Request, res: Response): Promise<void> {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      res.status(400).json({ success: false, message: 'Email and code are required' });
      return;
    }
    const result = await OtpService.verifyEmailOtp(email, code);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 1-Click Verify Email via Web Link
 * GET /api/auth/verify-email-link?email=...&code=...
 */
export async function verifyEmailLinkHandler(req: Request, res: Response): Promise<void> {
  try {
    const { email, code } = req.query;
    if (!email || !code || typeof email !== 'string' || typeof code !== 'string') {
      res.status(400).send('Invalid verification request: Missing email or code.');
      return;
    }

    const result = await OtpService.verifyEmailOtp(email, code);
    const isSuccess = result.success;
    const deepLinkUrl = isSuccess 
      ? `clickflicks://verified?email=${encodeURIComponent(email)}` 
      : `clickflicks://verification-failed`;

    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isSuccess ? 'Email Verified' : 'Verification Failed'} - ClickFlicks</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    body { background-color: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
    .card { background-color: #1e293b; border: 1px solid #334155; border-radius: 24px; padding: 40px 32px; max-width: 440px; width: 100%; text-align: center; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
    .badge-icon { width: 72px; height: 72px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; font-size: 36px; font-weight: bold; background: ${isSuccess ? 'rgba(13, 148, 136, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; color: ${isSuccess ? '#0d9488' : '#ef4444'}; border: 2px solid ${isSuccess ? '#0d9488' : '#ef4444'}; }
    h1 { font-size: 24px; font-weight: 800; margin-bottom: 12px; color: #ffffff; }
    p { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 28px; }
    .btn { display: block; width: 100%; padding: 14px 24px; background: linear-gradient(135deg, #0d9488, #0f766e); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 14px rgba(13, 148, 136, 0.4); }
  </style>
  <script>
    setTimeout(function() {
      window.location.href = "${deepLinkUrl}";
    }, 800);
  </script>
</head>
<body>
  <div class="card">
    <div class="badge-icon">${isSuccess ? '✓' : '✕'}</div>
    <h1>${isSuccess ? 'Email Verified!' : 'Verification Incomplete'}</h1>
    <p>${isSuccess ? 'Your ClickFlicks email identity has been confirmed. Returning you to the mobile app...' : result.message}</p>
    <a href="${deepLinkUrl}" class="btn">Return to ClickFlicks App</a>
  </div>
</body>
</html>
    `.trim());
  } catch (error: any) {
    console.error('Verify email link error:', error);
    res.status(500).send('Email verification failed. Please try again.');
  }
}

/**
 * Send Phone OTP
 * POST /api/auth/otp/send-phone
 */
export async function sendPhoneOtpHandler(req: Request, res: Response): Promise<void> {
  try {
    const { phone } = req.body;
    if (!phone) {
      res.status(400).json({ success: false, message: 'Phone number is required' });
      return;
    }
    const result = await OtpService.sendPhoneOtp(phone);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Verify Phone OTP
 * POST /api/auth/otp/verify-phone
 */
export async function verifyPhoneOtpHandler(req: Request, res: Response): Promise<void> {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      res.status(400).json({ success: false, message: 'Phone number and code are required' });
      return;
    }
    const result = await OtpService.verifyPhoneOtp(phone, code);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Handle OAuth Login (Google & Apple)
 * POST /api/auth/oauth
 */
export async function oauthLogin(req: Request, res: Response): Promise<void> {
  try {
    const { provider, email, firstName, lastName, providerId, avatarUrl, userType } = req.body;

    if (!provider || !email) {
      res.status(400).json({
        success: false,
        message: 'Provider and email are required for OAuth login'
      });
      return;
    }

    const result = await oauthLoginUser({
      provider,
      email,
      firstName,
      lastName,
      providerId,
      avatarUrl,
      userType
    });

    res.status(200).json({
      success: true,
      message: `${provider === 'google' ? 'Google' : 'Apple'} authentication successful`,
      data: result
    });
  } catch (error: any) {
    console.error('OAuth login error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'OAuth authentication failed'
    });
  }
}

/**
 * Handle Forgot Password
 * POST /api/auth/forgot-password
 */
export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email is required'
      });
      return;
    }

    const result = await requestPasswordReset(email);

    res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email address',
      data: result
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to process password reset request'
    });
  }
}

/**
 * Handle Reset Password
 * POST /api/auth/reset-password
 */
export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email, resetToken, newPassword } = req.body;

    if (!email || !resetToken || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Email, reset token, and new password are required'
      });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
      return;
    }

    await executePasswordReset({ email, resetToken, newPassword });

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You may now login with your new credentials.'
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to reset password'
    });
  }
}

/**
 * Log and store legal terms & privacy consent for safety, security, and audit compliance
 * POST /api/auth/consent
 */
export async function logConsentHandler(req: Request, res: Response): Promise<void> {
  try {
    const {
      consentType = 'TERMS_AND_PRIVACY',
      termsVersion = 'v1.2.6',
      userId,
      email,
      platform,
      clientTimestamp
    } = req.body;

    const consentId = crypto.randomUUID();
    const recordedAt = new Date().toISOString();
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'ClickFlicks-Client';

    const consentRecord = {
      consentId,
      consentType,
      termsVersion,
      complianceFramework: 'Ghana Data Protection Act, 2012 (Act 843) & Platform Escrow Agreement',
      dataController: 'ClickFlicks Limited (DPC Registered Controller)',
      userId: userId || null,
      email: email || null,
      platform: platform || 'Mobile App',
      ipAddress,
      userAgent,
      clientTimestamp: clientTimestamp || recordedAt,
      recordedAt,
      consented: true
    };

    // 1. Persist to system_settings in database
    try {
      await prisma.system_settings.upsert({
        where: { key: `consent_${consentId}` },
        update: {
          value: consentRecord,
          updated_at: new Date()
        },
        create: {
          key: `consent_${consentId}`,
          value: consentRecord
        }
      });
    } catch (dbErr) {
      console.warn('Could not save consent to system_settings table:', dbErr);
    }

    // 2. Append to persistent log file for audit preservation
    try {
      const fs = await import('fs');
      const path = await import('path');
      const logDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      fs.appendFileSync(
        path.join(logDir, 'legal_consent_audit.log'),
        JSON.stringify(consentRecord) + '\n',
        'utf8'
      );
    } catch (logErr) {
      console.warn('Could not write to legal_consent_audit.log:', logErr);
    }

    console.log(`⚖️ [LEGAL CONSENT LOGGED]: ${consentType} (${termsVersion}) for ${email || userId || 'Guest'} [${ipAddress}]`);

    res.status(200).json({
      success: true,
      message: 'Legal terms and privacy consent successfully logged and archived.',
      receipt: consentRecord
    });
  } catch (error: any) {
    console.error('Consent logging error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to log consent' });
  }
}