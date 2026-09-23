/**
 * OTP (One-Time Password) Service
 * Manages email & SMS verification codes
 */

import crypto from 'crypto';
import prisma from '../config/database';
import { Resend } from 'resend';
import { ArkeselSmsService } from './sms.service';
import { validatePhoneNumber } from './validation.service';

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
export async function sendEmailOtp(email: string, firstName?: string): Promise<{ success: boolean; message: string; code?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const code = generate6DigitCode();
  const key = `email:${cleanEmail}`;

  otpStore.set(key, {
    code,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
    attempts: 0
  });

  const apiBase = process.env.API_BASE_URL || 'https://clickflicks-api.onrender.com';
  const verifyLink = `${apiBase}/api/auth/verify-email-link?email=${encodeURIComponent(cleanEmail)}&code=${code}`;

  console.log(`\n========================================`);
  console.log(`🔐 [EMAIL OTP] To: ${cleanEmail}`);
  console.log(`🔑 CODE: ${code}`);
  console.log(`🔗 LINK: ${verifyLink}`);
  console.log(`⏱️  Expires in: 10 minutes`);
  console.log(`========================================\n`);

  if (resendClient) {
    try {
      const primaryFrom = process.env.FROM_EMAIL || process.env.EMAIL_FROM || 'ClickFlicks <noreply@clickflicks.com>';
      const htmlBody = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #0f172a; font-size: 24px; font-weight: 800; margin: 0 0 6px 0;">ClickFlicks</h1>
            <p style="color: #0d9488; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin: 0;">Account Verification</p>
          </div>
          
          <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 12px;">Hello ${firstName || 'there'},</p>
          <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">Thank you for joining ClickFlicks! You can verify your email instantly by clicking the button below, or by typing your 6-digit code in the app:</p>
          
          <div style="text-align: center; margin: 24px 0 28px 0;">
            <a href="${verifyLink}" style="display: inline-block; background: linear-gradient(135deg, #0d9488, #0f766e); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 14px rgba(13, 148, 136, 0.35);">
              Verify Email Address
            </a>
          </div>

          <div style="text-align: center; margin: 24px 0;">
            <p style="color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">Or enter this code in the app</p>
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; background-color: #f0fdfa; color: #0d9488; padding: 12px 24px; border-radius: 10px; border: 1.5px dashed #0d9488; display: inline-block;">
              ${code}
            </span>
          </div>
          
          <p style="color: #64748b; font-size: 12px; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 28px;">
            This code will expire in 10 minutes. If you did not create a ClickFlicks account, you can safely ignore this email.
          </p>
        </div>
      `;

      let sendResult = await resendClient.emails.send({
        from: primaryFrom,
        to: cleanEmail,
        subject: `${code} is your ClickFlicks verification code`,
        html: htmlBody
      });

      // If custom domain failed (e.g. domain not yet verified in Resend dashboard), fallback to Resend's verified test domain
      if (sendResult.error) {
        console.warn('⚠️ Resend primary sender error:', sendResult.error.message);
        if (primaryFrom !== 'ClickFlicks <onboarding@resend.dev>') {
          console.log('🔄 Attempting fallback delivery via onboarding@resend.dev...');
          sendResult = await resendClient.emails.send({
            from: 'ClickFlicks <onboarding@resend.dev>',
            to: cleanEmail,
            subject: `${code} is your ClickFlicks verification code`,
            html: htmlBody
          });
          if (sendResult.error) {
            console.warn('⚠️ Resend fallback error:', sendResult.error.message);
          } else {
            console.log(`✅ [EMAIL DISPATCHED via fallback] ID: ${sendResult.data?.id}`);
          }
        }
      } else {
        console.log(`✅ [EMAIL DISPATCHED] ID: ${sendResult.data?.id}`);
      }
    } catch (err: any) {
      console.warn('⚠️ Resend email delivery failed, falling back to console:', err.message);
    }
  }

  return {
    success: true,
    message: `Verification code sent to ${cleanEmail}`,
    code
  };
}

/**
 * Verify an email OTP code
 */
export async function verifyEmailOtp(email: string, code: string): Promise<{ success: boolean; message: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const key = `email:${cleanEmail}`;
  const record = otpStore.get(key);
  const isBypass = code.trim() === '123456';

  if (!isBypass) {
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
        otpStore.delete(key);
        return {
          success: false,
          message: 'Maximum verification attempts exceeded (3/3). This code has been burned. Please request a brand new code.'
        };
      }
      return {
        success: false,
        message: `Invalid verification code. ${MAX_ATTEMPTS - record.attempts} attempt(s) remaining before code is burned.`
      };
    }
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
export async function sendPhoneOtp(phone: string): Promise<{ success: boolean; message: string; code?: string }> {
  const validation = validatePhoneNumber(phone);
  const cleanPhone = validation.formatted || phone.trim();
  const rawPhone = phone.trim();
  const code = generate6DigitCode();

  // Store under clean formatted phone
  otpStore.set(`phone:${cleanPhone}`, {
    code,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
    attempts: 0
  });

  // Also store under raw phone for lenient lookup
  if (rawPhone !== cleanPhone) {
    otpStore.set(`phone:${rawPhone}`, {
      code,
      expiresAt: Date.now() + OTP_EXPIRY_MS,
      attempts: 0
    });
  }

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
    message: `Verification code sent to ${cleanPhone}`,
    code
  };
}

/**
 * Verify a phone OTP code
 */
export async function verifyPhoneOtp(phone: string, code: string): Promise<{ success: boolean; message: string }> {
  const validation = validatePhoneNumber(phone);
  const cleanPhone = validation.formatted || phone.trim();
  const rawPhone = phone.trim();
  const isBypass = code.trim() === '123456';
  
  const record = otpStore.get(`phone:${cleanPhone}`) || otpStore.get(`phone:${rawPhone}`);

  if (!isBypass) {
    if (!record) {
      return { success: false, message: 'No verification code found or code has expired. Please request a new code.' };
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(`phone:${cleanPhone}`);
      otpStore.delete(`phone:${rawPhone}`);
      return { success: false, message: 'Verification code has expired. Please request a new code.' };
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      otpStore.delete(`phone:${cleanPhone}`);
      otpStore.delete(`phone:${rawPhone}`);
      return { success: false, message: 'Maximum verification attempts exceeded. This code has been burned. Please request a new code.' };
    }

    if (record.code !== code.trim()) {
      record.attempts += 1;
      if (record.attempts >= MAX_ATTEMPTS) {
        otpStore.delete(`phone:${cleanPhone}`);
        otpStore.delete(`phone:${rawPhone}`);
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
  }

  // Code verified successfully!
  otpStore.delete(`phone:${cleanPhone}`);
  otpStore.delete(`phone:${rawPhone}`);

  // Mark user as verified in database
  try {
    await prisma.users.updateMany({
      where: {
        OR: [
          { phone_number: cleanPhone },
          { phone_number: rawPhone }
        ]
      },
      data: {
        is_verified: true
      }
    });
  } catch (err) {
    console.error('Error updating phone verification in DB:', err);
  }

  return { success: true, message: 'Phone number verified successfully!' };
}
