/**
 * Authentication Controller
 * Handles HTTP requests for authentication endpoints
 */

import { Request, Response } from 'express';
import { registerUser, loginUser, oauthLoginUser, requestPasswordReset, executePasswordReset } from '../services/auth.service';
import { RegisterUserDto, LoginUserDto } from '../types/user.types';

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
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
      return;
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
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
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