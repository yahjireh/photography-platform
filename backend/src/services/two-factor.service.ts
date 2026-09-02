/**
 * Two-Factor Authentication (2FA) Service
 * Implements RFC 6238 TOTP compatible with Google Authenticator, Microsoft Authenticator, and Authy
 */

import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';

interface TwoFactorRecord {
  secret: string;
  enabled: boolean;
  verifiedAt?: string;
  backupCodes: string[];
}

// In-memory / cache store for 2FA state by userId
const twoFactorStore = new Map<string, TwoFactorRecord>();

/**
 * Generate 8 secure random alphanumeric backup codes
 */
function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 8; i++) {
    const raw = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(`${raw.slice(0, 4)}-${raw.slice(4)}`);
  }
  return codes;
}

/**
 * Helper to verify TOTP code using otplib
 */
function verifyTotp(token: string, secret: string): boolean {
  try {
    const result = verifySync({
      token: token.trim(),
      secret
    });
    return result.valid === true;
  } catch (err) {
    return false;
  }
}

/**
 * Get 2FA status for a user
 */
export async function get2FAStatus(userId: string) {
  const record = twoFactorStore.get(userId);
  if (!record || !record.enabled) {
    return {
      enabled: false,
      backupCodesRemaining: 0
    };
  }

  return {
    enabled: true,
    verifiedAt: record.verifiedAt,
    backupCodesRemaining: record.backupCodes.length
  };
}

/**
 * Initiate 2FA Setup
 * Returns TOTP secret, QR code data URL, and backup codes
 */
export async function setup2FA(userId: string, email: string) {
  // Generate random base32 secret
  const secret = generateSecret();
  
  // Format otpauth URI for Google Authenticator
  const otpauth = generateURI({
    secret,
    label: email,
    issuer: 'ClickFlicks'
  });
  
  // Generate QR Code data URL
  const qrCodeUrl = await QRCode.toDataURL(otpauth);
  
  const backupCodes = generateBackupCodes();

  // Save pending setup state
  twoFactorStore.set(userId, {
    secret,
    enabled: false,
    backupCodes
  });

  return {
    secret,
    qrCodeUrl,
    backupCodes
  };
}

/**
 * Verify and enable 2FA
 */
export async function verifyAndEnable2FA(userId: string, token: string): Promise<boolean> {
  const record = twoFactorStore.get(userId);
  if (!record) {
    throw new Error('No pending 2FA setup found. Please start setup again.');
  }

  const isValid = verifyTotp(token, record.secret);

  if (!isValid) {
    return false;
  }

  // Activate 2FA
  record.enabled = true;
  record.verifiedAt = new Date().toISOString();
  twoFactorStore.set(userId, record);

  return true;
}

/**
 * Validate a 2FA code during login
 */
export async function validate2FALogin(userId: string, token: string): Promise<boolean> {
  const record = twoFactorStore.get(userId);
  if (!record || !record.enabled) {
    return true; // 2FA not enabled
  }

  const cleanToken = token.trim();

  // Check TOTP code
  const isValidTotp = verifyTotp(cleanToken, record.secret);
  if (isValidTotp) {
    return true;
  }

  // Check backup codes
  const backupIndex = record.backupCodes.indexOf(cleanToken.toUpperCase());
  if (backupIndex !== -1) {
    // Consume backup code
    record.backupCodes.splice(backupIndex, 1);
    twoFactorStore.set(userId, record);
    return true;
  }

  return false;
}

/**
 * Disable 2FA
 */
export async function disable2FA(userId: string, token: string): Promise<boolean> {
  const record = twoFactorStore.get(userId);
  if (!record || !record.enabled) {
    return true;
  }

  const isValid = verifyTotp(token, record.secret);
  if (!isValid) {
    return false;
  }

  twoFactorStore.delete(userId);
  return true;
}

/**
 * Regenerate backup codes
 */
export async function regenerateBackupCodes(userId: string, token: string): Promise<string[] | null> {
  const record = twoFactorStore.get(userId);
  if (!record || !record.enabled) {
    throw new Error('2FA is not enabled');
  }

  const isValid = verifyTotp(token, record.secret);
  if (!isValid) {
    return null;
  }

  const newCodes = generateBackupCodes();
  record.backupCodes = newCodes;
  twoFactorStore.set(userId, record);

  return newCodes;
}
