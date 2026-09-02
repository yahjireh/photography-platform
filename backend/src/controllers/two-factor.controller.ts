/**
 * Two-Factor Authentication Controller
 * HTTP request handlers for 2FA setup, verification, and status
 */

import { Request, Response } from 'express';
import * as TwoFactorService from '../services/two-factor.service';
import prisma from '../config/database';
import { comparePassword } from '../utils/hash.utils';

/**
 * GET /api/admin/2fa/status
 * or GET /api/auth/2fa/status
 */
export async function getStatus(req: Request, res: Response) {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const status = await TwoFactorService.get2FAStatus(userId);
    return res.status(200).json({
      success: true,
      data: status
    });
  } catch (error: any) {
    console.error('2FA status error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/admin/2fa/setup
 * or POST /api/auth/2fa/setup
 */
export async function setup(req: Request, res: Response) {
  try {
    const userId = req.user?.user_id;
    const email = req.user?.email;

    if (!userId || !email) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const setupData = await TwoFactorService.setup2FA(userId, email);
    return res.status(200).json({
      success: true,
      data: setupData
    });
  } catch (error: any) {
    console.error('2FA setup error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/admin/2fa/verify
 * or POST /api/auth/2fa/verify
 */
export async function verify(req: Request, res: Response) {
  try {
    const userId = req.user?.user_id;
    const { code } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!code) {
      return res.status(400).json({ success: false, message: 'Verification code is required' });
    }

    const isVerified = await TwoFactorService.verifyAndEnable2FA(userId, code);
    if (!isVerified) {
      return res.status(400).json({ success: false, message: 'Invalid verification code. Please check Google Authenticator and try again.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Two-factor authentication enabled successfully'
    });
  } catch (error: any) {
    console.error('2FA verify error:', error);
    return res.status(400).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/admin/2fa/disable
 * or POST /api/auth/2fa/disable
 */
export async function disable(req: Request, res: Response) {
  try {
    const userId = req.user?.user_id;
    const { code, password } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // If password provided, verify it first
    if (password) {
      const user = await prisma.users.findUnique({ where: { id: userId } });
      if (user && !(await comparePassword(password, user.password_hash))) {
        return res.status(400).json({ success: false, message: 'Incorrect password' });
      }
    }

    const isSuccess = await TwoFactorService.disable2FA(userId, code || '');
    if (!isSuccess) {
      return res.status(400).json({ success: false, message: 'Invalid 2FA code' });
    }

    return res.status(200).json({
      success: true,
      message: 'Two-factor authentication disabled'
    });
  } catch (error: any) {
    console.error('2FA disable error:', error);
    return res.status(400).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/admin/2fa/backup-codes
 */
export async function regenerateBackupCodes(req: Request, res: Response) {
  try {
    const userId = req.user?.user_id;
    const { code } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const codes = await TwoFactorService.regenerateBackupCodes(userId, code);
    if (!codes) {
      return res.status(400).json({ success: false, message: 'Invalid 2FA code' });
    }

    return res.status(200).json({
      success: true,
      data: { backupCodes: codes }
    });
  } catch (error: any) {
    console.error('2FA backup codes error:', error);
    return res.status(400).json({ success: false, message: error.message });
  }
}
