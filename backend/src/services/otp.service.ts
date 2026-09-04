/**
 * OTP (One-Time Password) Service
 * Manages email & SMS verification codes
 */

import crypto from 'crypto';
import prisma from '../config/database';
import { Resend } from 'resend';
import { ArkeselSmsService } from './sms.service';

interface OtpRecord {
  code: string;
  expiresAt: number;
  attempts: number;
}

// In-memory store for OTPs (Key: "email:user@domain.com" or "phone:+233...")
const otpStore = new Map<string, OtpRecord>();

// OTP Expiry: 10 minutes
const OTP_EXPIRY_MS = 10 * 60 * 1000;
// Maximum allowed incorrect attempts before the code is permanently burned
const MAX_ATTEMPTS = 3;

// Resend email client (if API key available)
const resendApiKey = process.env.RESEND_API_KEY;
const resendClient = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Generate a 6-digit numeric OTP
 */
function generate6DigitCode(): string {
  const num = crypto.randomInt(100000, 999999);
  return num.toString();
}

/**
 * Send an email verification OTP
 */
export async function sendEmailOtp(email: string, firstName?: string): Promise<{ success: boolean; message: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const code = generate6DigitCode();
  const key = `email:${cleanEmail}`;

  otpStore.set(key, {
    code,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
    attempts: 0
  });

  console.log(`\n========================================`);
  console.log(`🔐 [EMAIL OTP] To: ${cleanEmail}`);
  console.log(`🔑 CODE: ${code}`);
  console.log(`⏱️  Expires in: 10 minutes`);
  console.log(`========================================\n`);

  if (resendClient) {
    try {
      await resendClient.emails.send({
        from: process.env.EMAIL_FROM || 'ClickFlicks <noreply@clickflicks.com>',
        to: cleanEmail,
        subject: `${code} is your ClickFlicks verification code`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
            <h2 style="color: #0d9488;">ClickFlicks Email Verification</h2>
            <p>Hello ${firstName || 'there'},</p>
            <p>Thank you for signing up for ClickFlicks. Please enter the following 6-digit verification code to confirm your email address:</p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; background-color: #f0fdfa; color: #0d9488; padding: 12px 24px; border-radius: 8px; border: 1px dashed #0d9488;">
                ${code}
              </span>
            </div>
            <p style="color: #64748b; font-size: 14px;">This code will expire in 10 minutes. If you did not create a ClickFlicks account, you can safely ignore this email.</p>
          </div>
        `
      });
    } catch (err: any) {
      console.warn('⚠️ Resend email delivery failed, falling back to console:', err.message);
    }
  }

  return {
    success: true,
    message: `Verification code sent to ${cleanEmail}`
  };
}

/**
 * Verify an email OTP code
 */
export async function verifyEmailOtp(email: string, code: string): Promise<{ success: boolean; message: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const key = `email:${cleanEmail}`;
  const record = otpStore.get(key);

  if (!record) {
    return { success: false, message: 'No verification code found or code has expired. Please request a new code.' };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    return { success: false, message: 'Verification code has expired. Please request a new code.' };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(key);
    return { success: false, message: 'Maximum verification attempts exceeded. This code has been burned. Please request a new code.' };
  }

  if (record.code !== code.trim()) {
    record.attempts += 1;
    if (record.attempts >= MAX_ATTEMPTS) {
      // BURN THE OTP TOKEN IMMEDIATELY
      otpStore.delete(key);
      return {
        success: false,
        message: 'Maximum verification attempts exceeded (3/3). This code has been burned and invalidated. Please request a brand new code.'
      };
    }
    return {
      success: false,
      message: `Invalid verification code. ${MAX_ATTEMPTS - record.attempts} attempt(s) remaining before code is burned.`
    };
  }

  // Code verified successfully!
  otpStore.delete(key);

  // Update user in database if user exists
  try {
    await prisma.users.updateMany({
      where: { email: cleanEmail },
      data: {
        is_verified: true,
        email_verified_at: new Date()
      }
    });
  } catch (err) {
    console.error('Error updating verified status in DB:', err);
  }

  return { success: true, message: 'Email verified successfully!' };
}

/**
 * Send a phone verification OTP
 */
export async function sendPhoneOtp(phone: string): Promise<{ success: boolean; message: string }> {
  const cleanPhone = phone.trim();
  const code = generate6DigitCode();
  const key = `phone:${cleanPhone}`;

  otpStore.set(key, {
    code,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
    attempts: 0
  });

  console.log(`\n========================================`);
  console.log(`📱 [SMS OTP] To: ${cleanPhone}`);
  console.log(`🔑 CODE: ${code}`);
  console.log(`⏱️  Expires in: 10 minutes`);
  console.log(`========================================\n`);

  // Dispatch live SMS via Arkesel
  try {
    await ArkeselSmsService.sendOtpSms(cleanPhone, code);
  } catch (smsErr: any) {
    console.warn('⚠️ Arkesel SMS dispatch error:', smsErr.message);
  }

  return {
    success: true,
    message: `Verification code sent to ${cleanPhone}`
  };
}

/**
 * Verify a phone OTP code
 */
export async function verifyPhoneOtp(phone: string, code: string): Promise<{ success: boolean; message: string }> {
  const cleanPhone = phone.trim();
  const key = `phone:${cleanPhone}`;
  const record = otpStore.get(key);

  if (!record) {
    return { success: false, message: 'No verification code found or code has expired. Please request a new code.' };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    return { success: false, message: 'Verification code has expired. Please request a new code.' };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(key);
    return { success: false, message: 'Maximum verification attempts exceeded. This code has been burned. Please request a new code.' };
  }

  if (record.code !== code.trim()) {
    record.attempts += 1;
    if (record.attempts >= MAX_ATTEMPTS) {
      // BURN THE OTP TOKEN IMMEDIATELY
      otpStore.delete(key);
      return {
        success: false,
        message: 'Maximum verification attempts exceeded (3/3). This code has been burned and invalidated. Please request a brand new code.'
      };
    }
    return {
      success: false,
      message: `Invalid verification code. ${MAX_ATTEMPTS - record.attempts} attempt(s) remaining before code is burned.`
    };
  }

  // Code verified successfully!
  otpStore.delete(key);

  return { success: true, message: 'Phone number verified successfully!' };
}
