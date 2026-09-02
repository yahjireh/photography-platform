/**
 * Authentication Controller
 * Handles HTTP requests for authentication endpoints
 */

import { Request, Response } from 'express';
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
    OtpService.sendEmailOtp(userData.email, userData.first_name).catch(err =>
      console.error('Failed to dispatch initial email OTP:', err)
    );
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully. A verification code has been sent to your email.',
      data: result
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
 * Verify Email OTP
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