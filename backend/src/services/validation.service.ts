/**
 * Validation Service
 * Strict validation for email addresses and phone numbers
 */

import dns from 'dns';

// Common disposable/temporary email domains to block
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'sharklasers.com',
  'throwawaymail.com',
  'getairmail.com',
  'dispostable.com',
  'yopmail.com',
  'trashmail.com',
  'fakeinbox.com',
  'generator.email',
  'temp-mail.org',
  'dropmail.me',
  'mohmal.com',
  'mytemp.email',
  'emailondeck.com',
  'crazymailing.com',
  'nada.ltd',
  'getnada.com',
  'burnermail.io',
  'inboxkitten.com'
]);

/**
 * Result of email validation
 */
export interface EmailValidationResult {
  isValid: boolean;
  reason?: string;
}

/**
 * Result of phone validation
 */
export interface PhoneValidationResult {
  isValid: boolean;
  formatted?: string;
  reason?: string;
}

/**
 * Validate an email address:
 * 1. Syntax check (RFC 5322 regex)
 * 2. Disposable / temporary domain blocklist
 * 3. DNS MX record check (confirms the domain actually exists and accepts mail)
 */
export async function validateEmail(email: string): Promise<EmailValidationResult> {
  if (!email || typeof email !== 'string') {
    return { isValid: false, reason: 'Email is required' };
  }

  const cleanEmail = email.trim().toLowerCase();

  // Basic syntax check
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(cleanEmail)) {
    return { isValid: false, reason: 'Invalid email format' };
  }

  const parts = cleanEmail.split('@');
  if (parts.length !== 2) {
    return { isValid: false, reason: 'Invalid email structure' };
  }

  const domain = parts[1];

  // Block disposable email domains
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      isValid: false,
      reason: 'Disposable or temporary email addresses are not allowed. Please use a valid personal or work email.'
    };
  }

  // DNS MX record check to verify the domain has active mail servers
  try {
    const mxRecords = await dns.promises.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return {
        isValid: false,
        reason: `The email domain "${domain}" does not appear to have active mail servers.`
      };
    }
  } catch (error: any) {
    // In local development or network-restricted environments, fallback gracefully if DNS lookup fails for timeout
    if (error.code === 'ENOTFOUND' || error.code === 'NODATA') {
      return {
        isValid: false,
        reason: `The email domain "${domain}" does not exist or cannot receive mail.`
      };
    }
    console.warn(`⚠️ DNS MX lookup error for ${domain}:`, error.message);
    // Allow if it's just a local network resolver issue during development
  }

  return { isValid: true };
}

/**
 * Validate a phone number:
 * Accepts:
 * - Ghana formats: +233XXXXXXXXX, 02XXXXXXXX, 05XXXXXXXX, 03XXXXXXXX
 * - International formats: +[country code][number] (minimum 8 digits, maximum 15 digits per E.164)
 */
export function validatePhoneNumber(phone: string): PhoneValidationResult {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, reason: 'Phone number is required' };
  }

  // Remove spaces, hyphens, parentheses
  const cleaned = phone.trim().replace(/[\s\-()]/g, '');

  // Must contain only digits, optionally starting with '+'
  if (!/^\+?[0-9]{9,15}$/.test(cleaned)) {
    return {
      isValid: false,
      reason: 'Phone number must contain 9 to 15 digits and may include an optional leading +'
    };
  }

  // Format Ghana local numbers to international +233
  let formatted = cleaned;
  if (/^0[235][0-9]{8}$/.test(cleaned)) {
    formatted = '+233' + cleaned.substring(1);
  } else if (!formatted.startsWith('+')) {
    formatted = '+' + formatted;
  }

  return {
    isValid: true,
    formatted
  };
}
